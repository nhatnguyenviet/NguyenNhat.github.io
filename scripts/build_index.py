"""Build content/posts/index.json (from posts front matter) and content/albums/index.json (from album files).
Runs automatically on GitHub (see .github/workflows/deploy.yml). No extra packages needed."""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "content"
POSTS = ROOT / "posts"
ALBUMS = ROOT / "albums"


def clean(v):
    v = v.strip()
    m = re.match(r'^(["\'])(.*)\1$', v)
    return m.group(2) if m else v


def front_matter(text):
    m = re.match(r"^﻿?---\s*\n(.*?)\n---\s*(\n|$)", text, re.S)
    data = {}
    if not m:
        return data
    lines = m.group(1).split("\n")
    i = 0
    while i < len(lines):
        kv = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", lines[i])
        if kv:
            key, val = kv.group(1), kv.group(2)
            if val.strip() == "":
                arr = []
                while i + 1 < len(lines) and re.match(r"^\s+-\s+", lines[i + 1]):
                    i += 1
                    arr.append(clean(re.sub(r"^\s+-\s+", "", lines[i])))
                data[key] = arr
            elif re.match(r"^[>|][-+]?$", val.strip()):
                buf = []
                while i + 1 < len(lines) and (lines[i + 1].startswith((" ", "\t")) or lines[i + 1] == ""):
                    i += 1
                    buf.append(lines[i].strip())
                data[key] = (" " if val.strip().startswith(">") else "\n").join(buf).strip()
            elif val.strip().startswith("[") and val.strip().endswith("]"):
                data[key] = [clean(x) for x in val.strip()[1:-1].split(",") if x.strip()]
            else:
                data[key] = clean(val)
        i += 1
    return data


def main():
    posts = []
    for f in sorted(POSTS.glob("*.md")):
        d = front_matter(f.read_text(encoding="utf-8"))
        if str(d.get("draft", "")).lower() == "true":
            continue
        posts.append({
            "slug": f.stem,
            "title": d.get("title") or f.stem,
            "date": str(d.get("date", ""))[:10],
            "lang": d.get("lang", "en"),
            "summary": d.get("summary", ""),
            "tags": d.get("tags", []),
        })
    posts.sort(key=lambda p: p["date"], reverse=True)
    out = POSTS / "index.json"
    out.write_text(json.dumps(posts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"posts/index.json: {len(posts)} posts")

    albums = []
    for f in sorted(ALBUMS.glob("*.json")):
        if f.name == "index.json":
            continue
        try:
            a = json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"skip {f.name}: {e}")
            continue
        images, dates = [], []
        for m in a.get("moments") or []:
            imgs = m.get("images") or []
            if isinstance(imgs, str):
                imgs = [imgs]
            images += [i for i in imgs if i]
            if m.get("date"):
                dates.append(str(m["date"]))
        try:
            order = float(a.get("order") or 999)
        except (TypeError, ValueError):
            order = 999
        albums.append({
            "slug": f.stem,
            "name": a.get("name") or f.stem,
            "title": a.get("title") or {},
            "cover": a.get("cover") or (images[0] if images else ""),
            "count": len(images),
            "from": min(dates) if dates else "",
            "to": max(dates) if dates else "",
            "order": order,
        })
    albums.sort(key=lambda x: (x["order"], x["name"]))
    (ALBUMS / "index.json").write_text(json.dumps(albums, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"albums/index.json: {len(albums)} albums")


if __name__ == "__main__":
    main()
