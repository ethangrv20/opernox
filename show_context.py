#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app/monitor/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
# Show lines around the expanded panel insertion
for i in range(655, 750):
    sp = len(lines[i]) - len(lines[i].lstrip())
    print(f"L{i+1}(idx={i}): sp={sp:2d} {repr(lines[i][:90])}")
