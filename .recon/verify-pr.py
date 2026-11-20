import json, os, time, base64, urllib.request, urllib.error

T = os.environ["GH_TOKEN"]
API = "https://api.github.com"
H = {"Authorization": "Bearer " + T, "Accept": "application/vnd.github+json",
     "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "dsh-utodo-verify"}

def get(path, raw=False):
    req = urllib.request.Request(API + path, headers=H)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            txt = r.read().decode()
            return r.status, (txt if raw else json.loads(txt or "{}"))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

_, pr = get("/repos/awesome-dsh-plugin/awesome-dsh-plugin/pulls/17337")
sha = pr["head"]["sha"]
print("pr", pr["number"], pr["state"], "mergeable_state=" + str(pr["mergeable_state"]), "files=" + str(pr["changed_files"]))
for i in range(20):
    _, cr = get("/repos/awesome-dsh-plugin/awesome-dsh-plugin/commits/" + sha + "/check-runs")
    runs = cr.get("check_runs", [])
    line = " ; ".join(c["name"] + ":" + c["status"] + "/" + str(c["conclusion"]) for c in runs) or "none"
    print("poll", i + 1, line)
    if runs and all(c["status"] == "completed" for c in runs):
        break
    time.sleep(20)

_, entry = get("/repos/HauWong/awesome-dsh-plugin/contents/data/plugins/HauWong__dsh-utodo.yml?ref=add-dsh-utodo")
text = base64.b64decode(entry["content"]).decode("utf-8")
open(".recon/entry-check.yml", "w", encoding="utf-8", newline="\n").write(text)
print("entry_bytes", len(text.encode("utf-8")), "zh_ok", "\u6807\u7b7e" in text)

_, files = get("/repos/awesome-dsh-plugin/awesome-dsh-plugin/pulls/17337/files")
for f in files:
    print("file", f["status"], f["filename"], "+" + str(f["additions"]), "-" + str(f["deletions"]))
