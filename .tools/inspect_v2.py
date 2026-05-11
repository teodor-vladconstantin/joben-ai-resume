import json
d = json.load(open('.tools/duku_parsed_v2.json', encoding='utf-8'))
for e in d.get('work_experience', []):
    print('---', e.get('company'), '|', e.get('role'), '---')
    print('DESC:', (e.get('description') or '')[:200])
    print('BULLETS (', len(e.get('bullets', [])), '):')
    for i, b in enumerate(e.get('bullets', [])):
        print(f'  {i+1}.', b[:150])
    print()
print('=== PROJECTS ===')
for p in d.get('projects', []):
    print('---', p.get('name'), '|', p.get('role'), '---')
    print('DESC:', (p.get('description') or '')[:200])
    print('BULLETS (', len(p.get('bullets', [])), '):')
    for i, b in enumerate(p.get('bullets', [])):
        print(f'  {i+1}.', b[:150])
    print()
