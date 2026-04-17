#!/usr/bin/env python3
"""Replace keyword row section using line-by-line analysis."""
import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

content = subprocess.run(['git', 'show', 'HEAD:app/monitor/page.tsx'],
                       capture_output=True, text=True, encoding='utf-8').stdout
lines = content.split('\n')

# Find the keyword row div start (has borderRadius: 12 and style at 18 spaces)
kw_row_start = None
for i, line in enumerate(lines):
    if '<div style={{ fontSize: 12, color: \'#4b5563\'' in line and i > 590:
        kw_row_start = i
        break

print(f"Keyword row starts at L{kw_row_start+1} (idx={kw_row_start})")

# Find where the keyword row div ends (the </div> at 18 spaces after the delete button)
kw_row_end = None
for i in range(kw_row_start, min(kw_row_start+30, len(lines))):
    sp = len(lines[i]) - len(lines[i].lstrip())
    if '</div>' in lines[i] and sp == 18:
        kw_row_end = i
        break

print(f"Keyword row ends at L{kw_row_end+1} (idx={kw_row_end})")
print(f"Line content: {repr(lines[kw_row_end][:80])}")

# Show the context
for i in range(kw_row_start, kw_row_end+5):
    sp = len(lines[i]) - len(lines[i].lstrip())
    print(f"  L{i+1}(idx={i}): sp={sp:2d} {repr(lines[i][:100])}")
