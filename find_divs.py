#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app/monitor/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
# Find all </div> at 18 or 20 spaces in lines 688-760
print("=== All </div> in the keyword row area ===")
for i in range(688, 760):
    line = lines[i]
    sp = len(line) - len(line.lstrip())
    if '</div>' in line:
        print(f"L{i+1}(idx={i}): sp={sp:2d} {repr(line[:95])}")
