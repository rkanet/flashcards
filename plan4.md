# Flashcards – kompletní technická specifikace (v1.0)

---

## 0) Účel dokumentu
Tento dokument je **jediný závazný zadání** systému pro:
- učení slovíček (webová PWA aplikace),
- tisk kartiček (lokální tiskový program),
- správu dat přes Excel jako master.

Dokument:
- nahrazuje veškerou předchozí komunikaci,
- obsahuje **všechny předpoklady, omezení a rozhodnutí**,
- je **kompletní a uzavřený** – není nutné další upřesnování.

---

## 1) Základní předpoklady

### 1.1 Architektura
- Neexistuje backend.
- Neexistuje přihlášení, účet ani serverová databáze.
- GitHub Pages slouží pouze jako **statický hosting**.
- Veškerá logika běží:
  - lokálně na PC (Python skripty),
  - v prohlížeči (PWA).

### 1.2 Provoz
- OS: Windows 10 Pro.
- Uživatel:
  - ručně upravuje Excel,
  - spouští Python skripty,
  - provádí `git commit` a `git push`.
- Data nejsou citlivá → mohou být veřejná.

### 1.3 Koncepce
- **Excel je jediný zdroj pravdy (master)**.
- PWA aplikace:
  - data pouze čte,
  - nikdy je neupravuje.
  - **Rating v PWA se ukládá do localStorage** (nezasahuje do Excelu).
- Exportní skript:
  - převádí Excel → JSON,
  - netiskne a nemění stav tisku.
- Tiskový skript:
  - pracuje přímo s Excelem,
  - nemá žádnou vazbu na PWA.

---

## 2) Oddělení systému

Systém má **tři striktně oddělené entity**:

1. **PWA aplikace** – pouze učení
2. **Exportní skript** – Excel → JSON
3. **Tiskový skript** – Excel → HTML + zápis `printed_at`

---

## 3) Zdrojová data – Excel (master)

### 3.1 Formát
- `.xls` i `.xlsx`
- vždy první list
- první řádek = hlavička
- názvy sloupců v angličtině

### 3.2 Sloupce

| Column       | Type          | Required | Managed by |
|--------------|---------------|----------|------------|
| `en`         | string        | yes      | user       |
| `pron`       | string        | no       | user       |
| `meaning_en` | string        | no       | user       |
| `cz`         | string        | no       | user       |
| `rating`     | int (1–5)     | no       | user       |
| `printed_at` | datetime/text | no       | print tool |
| `note`       | string        | no       | user       |

### 3.3 Pravidla
- `en` je **ID karty**, musí být jedinečný.
- `rating`:
  - prázdné → 1
  - <1 → 1
  - >5 → 5
- `printed_at`:
  - prázdné → netisknuto
  - vyplněné → už se nikdy znovu netiskne

---

## 4) PWA aplikace (GitHub Pages)

### 4.1 Data
- PWA čte:
  - `web/data/vocab.json`
  - `web/data/latest.json`
- Mobilní zařízení **nic neimportuje**.

### 4.2 Aktualizace
- Pokud se liší verze v `latest.json`:
  - zobrazí se banner **„New data available – Reload"**.
- Po reloadu:
  - dataset se znovu načte,
  - session se resetuje.

### 4.3 Funkce
- **Swipe kartičky**: na mobilu gesto, na desktopu šipky/tlačítka + klávesnice.
- **Kartička**: zobrazí otázku → tap/click odkryje odpověď → uživatel zadá rating (1–5).
- **Režim učení**: EN→MEANING_EN nebo MEANING_EN→EN, toggle kdykoli za běhu.
- **CZ překlad**: globální toggle v nastavení.
- **Rating filtr**: preset tlačítka – All, Weak (1–2), Medium (3), Strong (4–5).
- **Shuffle**: tlačítko pro zamíchání.
- **Rating v PWA**: ukládá se do localStorage (nezasahuje do Excelu).
- Bez hintu.

---

## 5) Exportní skript (Python – Excel → JSON)

### 5.1 Účel
- Převod Excelu na dataset pro PWA.
- Netiskne.
- Nemění `printed_at`.

### 5.2 Výstupy
- `web/data/vocab.json`
- `web/data/latest.json`
- `tools/export/out/report.json`

---

## 6) Tiskový skript (Python – Excel → HTML)

### 6.1 Účel
- **Tisk pouze nových položek.**
- Pracuje přímo s Excelem.

### 6.2 Výběr
- Pouze řádky s **prázdným `printed_at`**.

### 6.3 Výstup
- `print/output.html`
- Tisk přes prohlížeč (Ctrl+P).

### 6.4 Layout
- A4
- Grid 2×4
- Fold:
  - horní část = front
  - dolní část = back
  - čárkovaná dělící čára

### 6.5 Konfigurace tisku (`tools/print/config.json`)
```json
{
  "front": ["en", "pron"],
  "back": ["meaning_en", "cz"]
}
```

### 6.6 Zápis do Excelu

Po generování HTML:
- nastavit `printed_at = now` u všech vytištěných řádků.

---

## 7) Formáty JSON souborů

### 7.1 vocab.json
```json
[
  {
    "en": "hello",
    "pron": "həˈloʊ",
    "meaning_en": "a greeting",
    "cz": "ahoj",
    "rating": 3,
    "note": "common word"
  }
]
```
- Pole objektů, exportují se všechny sloupce **kromě** `printed_at`.
- `rating`: prázdný → 1, clamped 1–5.

### 7.2 latest.json
```json
{
  "version": "2025-01-15T14:30:00",
  "count": 150
}
```
- `version` = ISO timestamp momentu exportu.
- `count` = počet exportovaných slov.

### 7.3 report.json
- Statistiky exportu (počet slov, počet bez ratingu, datum exportu apod.).
- Uložen v `tools/export/out/report.json`.

---

## 8) Adresářová struktura

```
Slovnik/
├── data/
│   └── slovnik.xlsx          ← master Excel
├── web/                      ← PWA (GitHub Pages root)
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   ├── css/
│   ├── js/
│   └── data/
│       ├── vocab.json
│       └── latest.json
├── tools/
│   ├── config.json           ← cesta k Excelu + další nastavení
│   ├── export/
│   │   ├── export.py
│   │   └── out/
│   │       └── report.json
│   └── print/
│       ├── print.py
│       ├── config.json
│       └── output.html
└── plan4.md
```

---

## 9) PWA technické detaily

### 9.1 Service Worker
- Cache-first strategie pro statické soubory (HTML, CSS, JS).
- Network-first pro data (`vocab.json`, `latest.json`).
- Plný offline režim s posledními staženými daty.

### 9.2 manifest.json
- Název, ikony, theme color – definovat základní hodnoty.

### 9.3 UI
- **Swipe kartičky**: na mobilu gesto, na desktopu šipky/tlačítka + klávesnice.
- **Kartička**: zobrazí otázku → tap/click odkryje odpověď → uživatel zadá rating (1–5).
- **Režim učení**: EN→MEANING_EN nebo MEANING_EN→EN, toggle kdykoli za běhu.
- **CZ překlad**: globální toggle v nastavení.
- **Rating filtr**: preset tlačítka – All, Weak (1–2), Medium (3), Strong (4–5).
- **Shuffle**: tlačítko pro zamíchání.
- **Rating v PWA**: ukládá se do localStorage (nezasahuje do Excelu).

---

## 10) Konfigurace nástrojů

### 10.1 tools/config.json
```json
{
  "excel_path": "data/slovnik.xlsx"
}
```

---

## 11) Python závislosti

- `openpyxl` (čtení/zápis `.xlsx`)
- `xlrd` (čtení `.xls`, pokud potřeba)
- `requirements.txt` v `tools/`
