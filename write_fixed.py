#!/usr/bin/env python3
"""Read original page.tsx from git, apply all fixes, write corrected version."""
import sys
sys.stdout.reconfigure(encoding='utf-8')

import subprocess
# Read original file from git
result = subprocess.run(['git', 'show', 'HEAD:app/monitor/page.tsx'],
                       capture_output=True, text=True, encoding='utf-8',
                       cwd='.')
content = result.stdout
print(f"Original: {len(content)} chars")

lines = content.split('\n')
print(f"Lines: {len(lines)}")

# Write to temp
with open('/tmp/orig_page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Written to /tmp/orig_page.tsx")
