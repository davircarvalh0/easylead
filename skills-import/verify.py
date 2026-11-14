"""Verify preserved skill folders against their source-byte manifest."""
import hashlib
import json
from pathlib import Path


def main():
    root = Path(__file__).resolve().parent
    records = json.loads((root.parent / "skills-import-manifest.json").read_text(encoding="utf-8"))
    total = 0
    for record in records:
        folder = root / "sources" / record["name"]
        expected = {item["path"] for item in record["files"]}
        actual = {p.relative_to(folder).as_posix() for p in folder.rglob("*") if p.is_file()}
        if actual != expected:
            raise ValueError(f'{record["name"]}: file inventory differs')
        if "SKILL.md" not in actual or len(actual) > 256:
            raise ValueError(f'{record["name"]}: invalid file count or missing SKILL.md')
        size = 0
        for item in record["files"]:
            data = (folder / item["path"]).read_bytes()
            if len(data) != item["bytes"] or hashlib.sha256(data).hexdigest() != item["sha256"]:
                raise ValueError(f'{record["name"]}/{item["path"]}: integrity mismatch')
            size += len(data)
        if size > 10 * 1024 * 1024:
            raise ValueError(f'{record["name"]}: exceeds 10 MB')
        total += len(actual)
        print(f'{record["name"]}: {len(actual)} files, {size} bytes verified')
    print(f'{len(records)} complete folders, {total} files verified')


if __name__ == "__main__":
    main()
