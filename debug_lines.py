#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app/monitor/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Split into lines and show exact content around keywords section
lines = content.split('\n')
for i in range(594, 648):
    print(f"L{i+1}: {repr(lines[i][:100])}")
