#!/usr/bin/env ruby
# frozen_string_literal: true

require "net/http"
require "uri"
require "nokogiri"
require "set"
require "pathname"
require "fileutils"

BASE = "http://www.franconianh.org/"
ROOT = Pathname.new(__dir__).parent
SRC  = ROOT.join("src")
SIDEBAR_OUT = SRC.join("_includes/partials/sidebar.njk")

SKIP_EXTS = %w[
  .pdf .doc .docx .xls .xlsx .ppt .pptx
  .jpg .jpeg .png .gif .webp .svg
  .zip .mp3 .mp4 .mov .avi
].freeze

def fetch(url)
  url = url.sub(/\Ahttps:\/\//i, "http://")
  uri = URI(url)
  http = Net::HTTP.new(uri.host, uri.port)
  http.open_timeout = 20
  http.read_timeout = 30
  req = Net::HTTP::Get.new(uri.request_uri, { "User-Agent" => "FranconiaSidebarGen/1.0" })
  res = http.request(req)
  raise "HTTP #{res.code}" unless res.is_a?(Net::HTTPSuccess)
  res.body
end

def canonicalize(url)
  u = URI(url.sub(/\Ahttps:\/\//i, "http://"))
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
  p = (u.path || "").downcase
  return false if p.include?("/uploads/")
  return false if SKIP_EXTS.any? { |ext| p.end_with?(ext) }
  true
rescue URI::InvalidURIError
  false
end

def guess_slug(url)
  u = URI(url)
  path = (u.path || "").sub(/\A\//, "").sub(/\/\z/, "")
  return "" if path.empty?
  path = path.sub(/\.html?\z/i, "")
  path.downcase.gsub(/[^a-z0-9\/]+/, "-").gsub(/-+/, "-").gsub(%r{\/-}, "/").gsub(%r{-\/}, "/")
end

def discover_routes
  routes = Set.new
  SRC.glob("**/index.md").each do |p|
    rel = p.relative_path_from(SRC).to_s
    next if rel.start_with?("_includes/") || rel.start_with?("_data/") || rel.start_with?("assets/")

    dir = File.dirname(rel)
    routes << (dir == "." ? "/" : "/#{dir}/")
  end
  routes
end

def normalize_path(path)
  return "/" if path.nil? || path.strip == "" || path.strip == "/"
  p = path.strip.sub(/\A\//, "").sub(/\/+\z/, "")
  "/#{p}/"
end

def best_match(old_href, routes)
  return nil if old_href.nil?
  h = old_href.strip
  return nil if h.start_with?("mailto:", "tel:", "#", "javascript:")
  return nil if h.start_with?("http://", "https://") && !same_site?(h)

  abs = if h.start_with?("http://", "https://")
          canonicalize(h)
        else
          canonicalize(URI.join(BASE, h).to_s) rescue nil
        end
  return nil unless abs

  abs = abs.sub(/\Ahttps:\/\//i, "http://")

  # Keep uploads as-is
  return abs if abs.include?("/uploads/")

  # Only map internal HTML pages
  return abs unless same_site?(abs) && html_page?(abs)

  slug = guess_slug(abs)
  candidate = (slug == "" ? "/" : "/#{slug}/")
  return candidate if routes.include?(candidate)

  # fallback: strip .html from href and try that
  no_html = h.sub(/\.html?\z/i, "")
  c2 = normalize_path(no_html)
  return c2 if routes.include?(c2)

  nil
end

# Extract Weebly menu tree from homepage
def parse_menu_tree(doc)
  # Weebly typically has: ul.wsite-menu-default (sometimes multiple)
  ul = doc.at_css("ul.wsite-menu-default") || doc.at_css("nav ul") || doc.at_css("ul")
  raise "Could not find a Weebly menu (<ul class='wsite-menu-default'>)" unless ul

  walk = lambda do |li|
    a = li.at_css("> a[href]")
    label = a&.text&.strip.to_s.gsub(/\s+/, " ")
    href  = a&.[]("href")

    children_ul =
      li.at_css("div.wsite-menu-wrap > ul") ||
      li.at_css("ul.wsite-menu") ||
      li.at_css("ul")
    children = []
    if children_ul
      children_ul.css("li").each do |child_li|
        children << walk.call(child_li)
      end
    end

    { label: label, href: href, children: children }.tap do |n|
      n[:children].reject! { |c| c[:label].empty? }
    end
  end

  items = []
  ul.css("> li").each do |li|
    node = walk.call(li)
    next if node[:label].empty?
    items << node
  end
  items
end

def render_sidebar(items, routes)
  # simple HTML structure compatible with your existing CSS classes
  out = []
  out << %(<div class="town-nav">)

  items.each do |item|
    href = best_match(item[:href].to_s, routes) || "#"
    label = item[:label]

    if item[:children].any?
      out << %(<details class="town-nav-details">)
      out << %(<summary class="town-nav-item">#{label}</summary>)
      out << %(<div class="town-subnav">)
      item[:children].each do |ch|
        ch_href = best_match(ch[:href].to_s, routes) || "#"
        out << %(<a class="town-subnav-item" href="#{ch_href}">#{ch[:label]}</a>)
      end
      out << %(</div>)
      out << %(</details>)
    else
      out << %(<a class="town-nav-item" href="#{href}">#{label}</a>)
    end
  end

  out << %(</div>)
  out.join("\n")
end

# ---- main ----
routes = discover_routes
html = fetch(BASE)
doc  = Nokogiri::HTML(html)
items = parse_menu_tree(doc)

sidebar_html = render_sidebar(items, routes)

FileUtils.mkdir_p(SIDEBAR_OUT.dirname)
if SIDEBAR_OUT.exist?
  backup = SIDEBAR_OUT.sub_ext(".njk.bak")
  backup.write(SIDEBAR_OUT.read)
  puts "Backup saved: #{backup}"
end

# Wrap in your existing sidebar container as needed; this writes just the nav block.
SIDEBAR_OUT.write(sidebar_html + "\n")
puts "Wrote sidebar: #{SIDEBAR_OUT}"
puts "Top-level items: #{items.size}"
