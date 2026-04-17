#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app/monitor/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
# Find the keyword row opening div
for i in range(594, 610):
    sp = len(lines[i]) - len(lines[i].lstrip())
    print(f"L{i+1}(idx={i}): sp={sp:2d} {repr(lines[i][:100])}")
