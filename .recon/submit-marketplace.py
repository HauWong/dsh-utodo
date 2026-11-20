import json, os, sys, time, urllib.request, urllib.error, base64

TOKEN = os.environ["GH_TOKEN"]
API = "https://api.github.com"
H = {
    "Authorization": "Bearer " + TOKEN,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "dsh-utodo-submission",
    "Content-Type": "application/json",
}
FORK_OWNER = "HauWong"
UPSTREAM = "awesome-dsh-plugin/awesome-dsh-plugin"
FORK = FORK_OWNER + "/awesome-dsh-plugin"
BRANCH = "add-dsh-utodo"
ENTRY_PATH = "data/plugins/HauWong__dsh-utodo.yml"

ENTRY = """url: https://github.com/HauWong/dsh-utodo
name: HauWong/dsh-utodo
category: ui
description:
  en: 'Sidebar todo and idea panel: tasks with a single date or a date range, overdue, important and due-soon views, and notes with colour-coded tags.'
  zh: '侧栏待办与想法面板：待办支持单日或日期区间，提供逾期、重要、临期视图；想法可加彩色标签。'
icon: https://raw.githubusercontent.com/HauWong/dsh-utodo/main/assets/icon-180.png
"""

BODY = """- [x] I added **one file** at `data/plugins/HauWong__dsh-utodo.yml` — that single file is the whole submission.
- [x] My repo's `package.json` declares **`dsh.bundle`** (`dsh.bundle.patch: ./cordis.patch.yml`, plus `dsh.client` for the browser half).
- [ ] My repo is at least **1 day old** — created 2026-11-20T15:49:11Z, so this is the only failing gate; `regate.yml` re-runs it on a schedule.
- [x] `category: ui` — it is a sidebar panel with its own todo and idea UI.
- [x] Description states what the plugin does, no superlatives.
- [x] My repo has the `dsh-plugin` topic.

What it does: a sidebar panel (`sidebar.panellist` entry `utodo`, `main` page keyed to it) with two tabs. **待办** stores tasks that may have no date, a single date, or a date range, and shows them either all together (overdue / today / upcoming / no date / done) or in two derived views: 重要, every task marked important, and 临期, unfinished tasks due within a window the user sets (2, 7, 30 days or any 1–365). **想法** stores notes with any number of tags; tags are coloured from a fixed six-tone Morandi palette, assigned in order of first appearance so the first six tags are always distinct, and the tag row doubles as a filter with per-tag counts. Everything persists in `localStorage` under `dsh-utodo.v1`; the plugin makes no network requests. It is a single hand-written `window.__ModuleLoader__` bundle with no build step, MIT licensed.
"""

def req(method, path, data=None, raw=False):
    url = path if path.startswith("http") else API + path
    body = None if data is None else json.dumps(data).encode()
    r = urllib.request.Request(url, data=body, headers=H, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            txt = resp.read().decode()
            return resp.status, (txt if raw else json.loads(txt or "{}"))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

log = {}
st, fork = req("GET", "/repos/" + FORK)
if st == 404:
    st, fork = req("POST", "/repos/" + UPSTREAM + "/forks", {"default_branch_only": True})
    log["fork_create"] = st
    for _ in range(60):
        time.sleep(3)
        st2, fork = req("GET", "/repos/" + FORK)
        if st2 == 200:
            break
else:
    log["fork_existing"] = st

st, main_ref = req("GET", "/repos/" + FORK + "/git/ref/heads/main")
log["main_ref"] = st
if st != 200:
    print(json.dumps({"log": log, "error": "no main ref", "detail": main_ref[:400]}))
    sys.exit(1)
sha = main_ref["object"]["sha"]

st, br = req("GET", "/repos/" + FORK + "/git/ref/heads/" + BRANCH)
log["branch_exists"] = st
if st != 200:
    st, br = req("POST", "/repos/" + FORK + "/git/refs", {"ref": "refs/heads/" + BRANCH, "sha": sha})
    log["branch_create"] = st
    if st not in (201, 422):
        print(json.dumps({"log": log, "error": "branch create failed", "detail": br}))
        sys.exit(1)

st, cur = req("GET", "/repos/" + FORK + "/contents/" + ENTRY_PATH + "?ref=" + BRANCH)
log["entry_exists"] = st
payload = {
    "message": "add dsh-utodo to the plugin list",
    "content": base64.b64encode(ENTRY.encode()).decode(),
    "branch": BRANCH,
}
if st == 200:
    payload["sha"] = cur["sha"]
st, put = req("PUT", "/repos/" + FORK + "/contents/" + ENTRY_PATH, payload)
log["entry_put"] = st
if st not in (200, 201):
    print(json.dumps({"log": log, "error": "entry put failed", "detail": put}))
    sys.exit(1)

st, prs = req("GET", "/repos/" + UPSTREAM + "/pulls?head=" + FORK_OWNER + ":" + BRANCH + "&state=all")
log["existing_pr"] = st
if st == 200 and prs:
    pr = prs[0]
    log["pr"] = {"number": pr["number"], "state": pr["state"], "url": pr["html_url"]}
else:
    st, pr = req("POST", "/repos/" + UPSTREAM + "/pulls", {
        "title": "add dsh-utodo — sidebar todo & idea panel",
        "head": FORK_OWNER + ":" + BRANCH,
        "base": "main",
        "body": BODY,
    })
    log["pr_create"] = st
    log["pr"] = {"number": pr.get("number"), "url": pr.get("html_url"), "detail": None if st in (200, 201) else str(pr)[:600]}

print(json.dumps(log, indent=1))
