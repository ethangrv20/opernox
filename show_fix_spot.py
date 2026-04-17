#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app/monitor/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
# Find the exact location of the problem:
# L692: </div> at 18 spaces (closes wrapper prematurely)
# L693: {expandedKwId === kw.id && ( at 18 spaces
# The panel outer div at 20 spaces (L694) comes AFTER the wrapper closes
# We need to add panel outer </div> BEFORE wrapper </div>

# Find L692 in the file
for i in range(685, 700):
    sp = len(lines[i]) - len(lines[i].lstrip())
    print(f"L{i+1}(idx={i}): sp={sp:2d} {repr(lines[i][:95])}")
