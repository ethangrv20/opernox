#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app/monitor/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
# Find keyword wrapper div and its siblings in map
for i, line in enumerate(lines):
    if 'expandedKwId' in line and i > 600:
        print(f"Found expandedKwId at L{i+1}: sp={len(line)-len(line.lstrip())} {repr(line[:90])}")
        # show surrounding context
        for j in range(max(0,i-3), min(len(lines), i+10)):
            print(f"  L{j+1}: sp={len(lines[j])-len(lines[j].lstrip())} {repr(lines[j][:90])}")
        break
