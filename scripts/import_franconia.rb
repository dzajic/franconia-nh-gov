#!/usr/bin/env ruby
# frozen_string_literal: true

require "net/http"
require "uri"
require "json"
require "fileutils"
require "set"
require "nokogiri"
require "reverse_markdown"

BASE = "http://www.franconianh.org/"
OUT_DIR = "src"
CACHE_PATH = "scripts/franconia-url-cache.json"
MAX_PAGES = 5_000

SKIP_EXTS = %w[
  .pdf .doc .docx .xls .xlsx .ppt .pptx
  .jpg .jpeg .png .gif .webp .svg
  .zip .mp3 .mp4 .mov .avi
].freeze

def force_http(url)
  url.sub(/\Ahttps:\/\//i, "http://")
end

def canonicalize(url)
  u = URI(force_http(url))
  u.fragment = nil
  u.query = nil
  u.to_s
rescue URI::InvalidURIError
  nil
end

def same_site?(url)
  u = URI(url)
  u.host.nil? || u.host.end_with?("franconianh.org")
rescue URI::InvalidURIError
  false
end

def html_page?(url)
  u = URI(url)
  path = (u.path || "").downcase
  return false if path.include?("/uploads/")
  return false if SKIP_EXTS.any? { |ext| path.end_with?(ext) }
  true
rescue URI::InvalidURIError
  false
end

def fetch(url)
  url = force_http(url)
  uri = URI(url)
  http = Net::HTTP.new(uri.host, uri.port)
  http.open_timeout = 20
  http.read_timeout = 30
  req = Net::HTTP::Get.new(uri.request_uri, { "User-Agent" => "FranconiaImporter/1.0" })
  res = http.request(req)
  raise "HTTP #{res.code}" unless res.is_a?(Net::HTTPSuccess)

  res.body
end

def guess_slug(url)
  u = URI(url)
  path = (u.path || "").sub(/\A\//, "").sub(/\/\z/, "")
  return "" if path.empty?

  path = path.sub(/\.html?\z/i, "")
  # normalize to URL-safe "slug-ish"
  path.downcase.gsub(/[^a-z0-9\/]+/, "-").gsub(/-+/, "-").gsub(%r{\/-}, "/").gsub(%r{-\/}, "/")
end

def out_path_for_slug(slug)
  return File.join(OUT_DIR, "index.md") if slug == ""
  File.join(OUT_DIR, slug, "index.md")
end

def migrated?(path)
  return false unless File.exist?(path)

  head = File.read(path, 4096, mode: "r:BOM|UTF-8") || ""
  head.match?(/(?m)^migrated:\s*true\s*$/)
end

def title_from(html)
  doc = Nokogiri::HTML(html)
  t = doc.at_css("title")&.text&.strip.to_s
  t = t.sub(/\s*\|\s*.*\z/, "").strip
  t.empty? ? "Town of Franconia, NH" : t
end

def extract_main_node(doc)
  doc.at_css("#wsite-content") ||
    doc.at_css(".wsite-section-content") ||
    doc.at_css(".wsite-elements") ||
    doc.at_css("body")
end

def rewrite_links!(node, page_url)
  node.css("a[href]").each do |a|
    href = a["href"].to_s.strip
    next if href.empty?
    next if href.start_with?("#", "mailto:", "tel:", "javascript:")

    abs = canonicalize(URI.join(page_url, href).to_s) rescue nil
    next unless abs

    abs = force_http(abs)

    # Keep uploads as absolute http links
    if abs.include?("franconianh.org/uploads/")
      a["href"] = abs
      next
    end

    # Rewrite internal HTML pages to new pretty paths
    if same_site?(abs) && html_page?(abs)
      slug = guess_slug(abs)
      a["href"] = (slug == "" ? "/" : "/#{slug}/")
    else
      a["href"] = abs
    end
  end

  # Images to absolute http so they keep working during migration
  node.css("img[src]").each do |img|
    src = img["src"].to_s.strip
    next if src.empty?
    abs = canonicalize(URI.join(page_url, src).to_s) rescue nil
    next unless abs
    img["src"] = force_http(abs)
  end
end

def to_markdown(html_fragment)
  ReverseMarkdown.convert(html_fragment, unknown_tags: :bypass, github_flavored: true)
                .gsub(/\n{3,}/, "\n\n")
                .strip + "\n"
end

def write_page(slug:, title:, permalink:, md:, source_url:)
  path = out_path_for_slug(slug)
  FileUtils.mkdir_p(File.dirname(path))

  fm = <<~YAML
    ---
    layout: base.njk
    title: #{title}
    permalink: #{permalink}
    imported_from: "#{source_url}"
    migrated: false
    ---
  YAML

  File.write(path, fm + "\n" + md)
end

def extract_internal_links(doc, page_url)
  links = []
  doc.css("a[href]").each do |a|
    href = a["href"].to_s.strip
    next if href.empty?
    next if href.start_with?("#", "mailto:", "tel:", "javascript:")

    abs = canonicalize(URI.join(page_url, href).to_s) rescue nil
    next unless abs

    abs = force_http(abs)
    next unless same_site?(abs)
    next unless html_page?(abs)

    links << abs
  end
  links.uniq
end

def crawl_or_load_cache
  if File.exist?(CACHE_PATH)
    data = JSON.parse(File.read(CACHE_PATH))
    urls = data.is_a?(Hash) ? data["urls"] : data
    return urls if urls.is_a?(Array) && !urls.empty?
  end

  puts "No cache found. Crawling site starting at #{BASE} ..."
  seen = Set.new
  queue = [BASE]
  out = []

  seen << BASE

  until queue.empty? || out.size >= MAX_PAGES
    url = queue.shift
    out << url

    begin
      html = fetch(url)
      doc = Nokogiri::HTML(html)
      extract_internal_links(doc, url).each do |u|
        next if seen.include?(u)
        seen << u
        queue << u
      end
      print "\rDiscovered: #{out.size} pages (queue #{queue.size})"
    rescue => e
      warn "\nCrawl fetch failed: #{url} (#{e})"
    end
  end

  puts "\nCrawl done. Saving cache to #{CACHE_PATH}"
  FileUtils.mkdir_p(File.dirname(CACHE_PATH))
  File.write(CACHE_PATH, JSON.pretty_generate({ "base" => BASE, "count" => out.size, "urls" => out }))
  out
end

# ---- main ----
urls = crawl_or_load_cache

FileUtils.mkdir_p("src/_data")
map = {}

urls.each do |url|
  slug = guess_slug(url)
  # old weebly url path (without domain)
  u = URI(url)
  key = u.path
  key = "/" if key.nil? || key == "" || key == "/"
  key = key.sub(/\.html?\z/i, "")
  key = "/" if key == ""
  map[key] = (slug == "" ? "/" : "/#{slug}/")
end

File.write("src/_data/urlmap.json", JSON.pretty_generate(map))


puts "Importing #{urls.size} pages into #{OUT_DIR}/ ..."

urls.each_with_index do |url, idx|
  slug = guess_slug(url)
  path = out_path_for_slug(slug)

  if migrated?(path)
    puts "↷ skip migrated: #{path}"
    next
  end

  begin
    html = fetch(url)
    doc = Nokogiri::HTML(html)

    title = title_from(html)

    main = extract_main_node(doc)
    rewrite_links!(main, url)

    # remove repeated nav/footer if captured
    main.css("nav, header, footer, .wsite-menu-default, .wsite-footer, .wsite-header-section").remove

    md = to_markdown(main.to_html)

    permalink = (slug == "" ? "/" : "/#{slug}/")
    write_page(slug: slug, title: title, permalink: permalink, md: md, source_url: url)

    puts "✓ [#{idx + 1}/#{urls.size}] #{url} -> #{path}"
  rescue => e
    warn "✗ [#{idx + 1}/#{urls.size}] #{url}: #{e}"
  end
end

puts "Done."
puts "Tip: set `migrated: true` in any page front matter you’ve finalized to prevent overwrites."
