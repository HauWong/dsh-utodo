import json, base64
e = json.load(open('.recon/entry.json', encoding='utf-8'))
t = base64.b64decode(e['content']).decode('utf-8')
open('.recon/entry-check.yml', 'w', encoding='utf-8', newline='\n').write(t)
f = json.load(open('.recon/files.json', encoding='utf-8'))
print('FILES', [(x['status'], x['filename'], x['additions'], x['deletions']) for x in f])
print('BYTES', len(t.encode('utf-8')))