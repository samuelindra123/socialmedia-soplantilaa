import re

with open('apps/frontend/src/components/Hero.tsx', 'r') as f:
    content = f.read()

replacements = [
    (r'Mencoba Features jurnal baru di Soplantila\.', r'Trying out the new journal features on Soplantila.'),
    (r'Sangat membantu untuk tracking mood tanpa tekanan likes\.', r'Helps track mindfulness without the pressure of likes.'),
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open('apps/frontend/src/components/Hero.tsx', 'w') as f:
    f.write(content)
