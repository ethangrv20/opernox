#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app/monitor/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

# The fix: insert panel outer </div> at 20 spaces RIGHT AFTER the Details button closes,
# and BEFORE the keyword wrapper </div> at 18 spaces.

# Pattern to find: Details button closing tag (at 20 spaces) followed by wrapper </div> (at 18 spaces)
old_pattern = """                    </button>
                  </div>
                ))}
              </div>
            )}"""

new_pattern = """                    </button>
                    </div>
                ))}
              </div>
            )}"""

# Wait, let me just do the targeted replacement: find the Details button close + wrapper close
# and insert panel outer </div> between them

# Find in the file: the exact bytes around L691-L692
for i in range(688, 700):
    sp = len(lines[i]) - len(lines[i].lstrip())
    print(f"L{i+1}: sp={sp:2d} {repr(lines[i][:90])}")
