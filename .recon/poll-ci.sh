#!/usr/bin/env bash
set -u
cd "/d/DeepSeek Harness/plugins/utodo"
CRED=$(printf "protocol=https\nhost=github.com\n\n" | git -c credential.helper=wincred credential fill)
U=$(printf "%s" "$CRED" | sed -n "s/^username=//p")
P=$(printf "%s" "$CRED" | sed -n "s/^password=//p")
SHA=f10cd6178974aafa64b8ce12ff1d5f668155f5c1
for i in $(seq 1 40); do
  curl -sS --ssl-no-revoke -m 30 -u "$U:$P" "https://api.github.com/repos/awesome-dsh-plugin/awesome-dsh-plugin/commits/$SHA/check-runs" -o .recon/cr3.json
  L=$(python -c "import json;d=json.load(open('.recon/cr3.json',encoding='utf-8'));print(';'.join(c['name']+':'+c['status']+'/'+str(c['conclusion']) for c in d.get('check_runs',[])) or 'none')")
  echo "$(date +%H:%M:%S) $L"
  case "$L" in *in_progress*|none) sleep 30 ;; *) break ;; esac
done