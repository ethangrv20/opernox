#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app/monitor/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
# Find all div open/close at 18+ spaces in keywords section (lines 590-760)
print("=== All div tags at 18+ spaces in keywords section ===")
for i in range(589, 760):
    line = lines[i]
    sp = len(line) - len(line.lstrip())
    if (('<div' in line or '</div>' in line) and '</div>' not in line.lstrip()) or '</div>' in line:
        if sp >= 18:
            print(f"L{i+1}(idx={i}): sp={sp:2d} {'OPEN' if '<div' in line and '</div>' not in line else 'CLOSE' if '</div>' in line else '???'} {repr(line[:95])}")
