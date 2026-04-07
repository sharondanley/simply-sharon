#!/usr/bin/env python3
"""Replace local asset paths with CDN URLs in React pages."""
import re

# CDN mapping: filename -> CDN URL
cdn_map = {}
with open('/home/ubuntu/simply-sharon/cdn_map.txt') as f:
    for line in f:
        line = line.strip()
        if '|' in line:
            filename, url = line.split('|', 1)
            cdn_map[filename] = url

print(f"Loaded {len(cdn_map)} CDN mappings")

files_to_process = [
    '/home/ubuntu/simply-sharon/client/src/pages/DesktopPage.tsx',
    '/home/ubuntu/simply-sharon/client/src/pages/BlogPage.tsx',
    '/home/ubuntu/simply-sharon/client/src/pages/MobilePage.tsx',
]

for filepath in files_to_process:
    with open(filepath, 'r') as f:
        content = f.read()
    
    replacements = 0
    for filename, cdn_url in cdn_map.items():
        # Replace /filename.ext with CDN URL
        local_path = f'/{filename}'
        if local_path in content:
            content = content.replace(f'src="{local_path}"', f'src="{cdn_url}"')
            content = content.replace(f"src='{local_path}'", f"src='{cdn_url}'")
            replacements += 1
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"  {filepath}: {replacements} replacements")

print("Done!")
