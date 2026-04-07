import os
import re

def replace_in_file(filepath, replacements):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        new_content = content
        for old, new in replacements:
            new_content = re.sub(old, new, new_content, flags=re.IGNORECASE)
        
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
    except Exception as e:
        print(f"Error {filepath}: {e}")

replacements = [
    (r'Refleksi diri,\s*<br />', r'Mindful Connection,<br />'),
    (r'tanpa distraksi\.', r'Daily Reflection.'),
    (r'Eksplorasi pikiran dalam ruang digital yang tenang\. Fokus pada esensi, bukan atensi\.', r'A modern digital space for your thoughts, community, and personal growth. Build habits that last.'),
    (r'Akses Beta Sekarang', r'Start Reflecting'),
    (r'Akses Beta', r'Start Reflecting'),
    (r'Baca Manifesto', r'Explore Soplantila'),
    (r'Masuk', r'Login'),
    (r'Fitur', r'Features'),
    (r'Harga', r'Pricing'),
    (r'Beta Early Access', r'Join Soplantila Beta'),
    (r'bg-indigo-400', r'bg-emerald-400'),
    (r'bg-indigo-500', r'bg-emerald-500'),
    (r'text-indigo-600', r'text-emerald-600'),
    (r'bg-indigo-600', r'bg-emerald-600'),
    (r'border-indigo-200', r'border-emerald-200'),
    (r'text-indigo-500', r'text-emerald-500'),
    (r'bg-black', r'bg-slate-900'),
    (r'hover:bg-black', r'hover:bg-slate-800'),
    (r'bg-\[\#0B0C0E\]', r'bg-slate-900'),
]

for root, _, files in os.walk('apps/frontend/src/components'):
    for file in files:
        if file.endswith('.tsx'):
            replace_in_file(os.path.join(root, file), replacements)

for root, _, files in os.walk('apps/frontend/src/app/(marketing)'):
    for file in files:
        if file.endswith('.tsx'):
            replace_in_file(os.path.join(root, file), replacements)
