import json
d = json.load(open('.tools/duku_parsed.json', encoding='utf-8'))
for e in d.get('work_experience', []):
    print('---', e.get('company'), '|', e.get('role'), '---')
    print('DESC:', (e.get('description') or '')[:400])
    print('BULLETS:', e.get('bullets', []))
    print()
print('=== PROJECTS ===')
for p in d.get('projects', []):
    print('---', p.get('name'), '|', p.get('role'), '---')
    print('DESC:', (p.get('description') or '')[:400])
    print('BULLETS:', p.get('bullets', []))
    print()
