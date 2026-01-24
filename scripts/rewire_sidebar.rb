#!/usr/bin/env ruby
# frozen_string_literal: true

require "pathname"
require "set"

ROOT = Pathname.new(__dir__).parent
SRC  = ROOT.join("src")
SIDEBAR = SRC.join("_includes/partials/sidebar.njk")

def discover_routes
  routes = Set.new

  SRC.glob("**/index.md").each do |p|
    rel = p.relative_path_from(SRC).to_s # e.g. "boards/energy-commission/index.md"
    next if rel.start_with?("_includes/") || rel.start_with?("_data/") || rel.start_with?("assets/")

    dir = File.dirname(rel) # e.g. "boards/energy-commission"
    if dir == "."
      routes << "/"
    else
      routes << "/#{dir}/"
    end
  end

  routes
end

def normalize_path(path)
  return "/" if path == "" || path == "/"
  path = path.strip
  path = path.sub(/\A\//, "")
  path = path.sub(/\/+\z/, "")
  "/#{path}/"
end

# Try to map an old path to a known route.
def best_match(old_href, routes)
  p = old_href.strip

  # Ignore external-ish or special
  return nil if p.start_with?("http://", "https://", "mailto:", "tel:", "#", "javascript:")

  # If it already looks like /foo/ return as normalized if exists
  wanted = normalize_path(p)
  return wanted if routes.include?(wanted)

  # Try stripping ".html"
  no_html = p.sub(/\.html?\z/i, "")
  wanted2 = normalize_path(no_html)
  return wanted2 if routes.include?(wanted2)

  # Try slugify-ish fallback: collapse weird chars to hyphens
  slug = no_html.downcase.gsub(/[^a-z0-9\/]+/, "-").gsub(/-+/, "-")
  wanted3 = normalize_path(slug)
  return wanted3 if routes.include?(wanted3)

  # Try last segment only (useful if old links include nested /something/page)
  seg = slug.split("/").reject(&:empty?).last
  if seg && !seg.empty?
    candidate = "/#{seg}/"
    return candidate if routes.include?(candidate)
  end

  nil
end

routes = discover_routes
abort "Sidebar not found: #{SIDEBAR}" unless SIDEBAR.exist?

sidebar = SIDEBAR.read

# Backup
backup = SIDEBAR.sub_ext(".njk.bak")
backup.write(sidebar)

changed = 0

# 1) Rewrite Nunjucks url filter links: href="{{ '/foo/' | url }}"
sidebar = sidebar.gsub(/href="\{\{\s*'([^']+)'\s*\|\s*url\s*\}\}"/) do
  old = Regexp.last_match(1) # "/boards/"
  mapped = best_match(old, routes)
  if mapped
    changed += 1
    %{href="#{mapped}"}
  else
    # keep as-is
    %{href="{{ '#{old}' | url }}"}
  end
end

# 2) Rewrite plain internal href="/foo" or href="/foo/"
sidebar = sidebar.gsub(/href="(\/[^"]*)"/) do
  old = Regexp.last_match(1)
  mapped = best_match(old, routes)
  if mapped
    changed += 1
    %{href="#{mapped}"}
  else
    %{href="#{old}"}
  end
end

SIDEBAR.write(sidebar)

puts "Routes discovered: #{routes.size}"
puts "Sidebar rewritten: #{SIDEBAR}"
puts "Backup saved: #{backup}"
puts "Links updated: #{changed}"

# Optional: print any internal hrefs that still don't resolve
unresolved = []
sidebar.scan(/href="(\/[^"]*)"/).flatten.each do |href|
  next if href == "/" || href.start_with?("//")
  unresolved << href unless routes.include?(normalize_path(href))
end
unresolved.uniq!
if unresolved.any?
  puts "\nUnresolved internal hrefs (no matching page found under src/**/index.md):"
  unresolved.sort.each { |u| puts " - #{u}" }
end
