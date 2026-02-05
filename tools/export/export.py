"""Export Excel → JSON pro PWA.

Spuštění z kořene projektu:
    python tools/export/export.py
"""

import json
import os
import sys
from datetime import datetime, timezone

import openpyxl

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))

REQUIRED_COLUMNS = {"en"}
ALL_COLUMNS = ["en", "pron", "meaning_en", "example", "cz", "rating", "printed_at", "note"]
EXPORT_COLUMNS = [c for c in ALL_COLUMNS if c != "printed_at"]


def load_config():
    config_path = os.path.join(ROOT_DIR, "tools", "config.json")
    with open(config_path, encoding="utf-8") as f:
        return json.load(f)


def read_excel(excel_path):
    wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        print("ERROR: Excel is empty.")
        sys.exit(1)

    header = [str(h).strip().lower() if h else "" for h in rows[0]]

    missing = REQUIRED_COLUMNS - set(header)
    if missing:
        print(f"ERROR: Missing required columns: {missing}")
        sys.exit(1)

    col_map = {name: idx for idx, name in enumerate(header) if name in ALL_COLUMNS}

    words = []
    for row in rows[1:]:
        en_val = row[col_map["en"]] if "en" in col_map else None
        if not en_val or not str(en_val).strip():
            continue

        word = {}
        for col_name in EXPORT_COLUMNS:
            if col_name in col_map:
                val = row[col_map[col_name]]
                if col_name == "rating":
                    val = clamp_rating(val)
                else:
                    val = str(val).strip() if val is not None else ""
                word[col_name] = val
            else:
                word[col_name] = "" if col_name != "rating" else 1

        words.append(word)

    wb.close()
    return words


def clamp_rating(val):
    if val is None or val == "" or val == "None":
        return 1
    try:
        r = int(float(val))
    except (ValueError, TypeError):
        return 1
    return max(1, min(5, r))


def write_vocab_json(words, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, indent=2)


def write_latest_json(count, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = {
        "version": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S"),
        "count": count,
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def write_report_json(words, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    no_rating = sum(1 for w in words if w.get("rating") == 1)
    report = {
        "exported_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S"),
        "total_words": len(words),
        "words_without_rating": no_rating,
        "rating_distribution": {
            str(r): sum(1 for w in words if w.get("rating") == r)
            for r in range(1, 6)
        },
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)


def main():
    os.chdir(ROOT_DIR)

    config = load_config()
    excel_path = config["excel_path"]

    if not os.path.exists(excel_path):
        print(f"ERROR: Excel not found: {excel_path}")
        sys.exit(1)

    print(f"Reading: {excel_path}")
    words = read_excel(excel_path)
    print(f"Found {len(words)} words.")

    vocab_path = os.path.join("docs", "data", "vocab.json")
    latest_path = os.path.join("docs", "data", "latest.json")
    report_path = os.path.join("tools", "export", "out", "report.json")

    write_vocab_json(words, vocab_path)
    print(f"Written: {vocab_path}")

    write_latest_json(len(words), latest_path)
    print(f"Written: {latest_path}")

    write_report_json(words, report_path)
    print(f"Written: {report_path}")

    print("Export done.")


if __name__ == "__main__":
    main()
