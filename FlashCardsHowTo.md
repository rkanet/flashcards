# Flashcards - Návod k použití

Tato aplikace slouží k učení anglických slovíček pomocí digitálních kartiček. Funguje v prohlížeči a po prvním načtení funguje i offline.

---

## Obsah

1. [Jak aplikace funguje](#jak-aplikace-funguje)
2. [Přidání nových slovíček](#přidání-nových-slovíček)
3. [Export dat pro aplikaci](#export-dat-pro-aplikaci)
4. [Publikování na GitHub](#publikování-na-github)
5. [Používání aplikace](#používání-aplikace)
6. [Řešení problémů](#řešení-problémů)

---

## Jak aplikace funguje

### Struktura projektu

```
Slovnik/
├── data/
│   └── slovnik.xlsx      ← Hlavní soubor se slovíčky (Excel)
├── docs/                  ← Webová aplikace (GitHub Pages)
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   └── data/
│       ├── vocab.json    ← Slovíčka ve formátu JSON
│       └── latest.json   ← Informace o verzi
└── tools/
    └── export/
        └── export.py     ← Skript pro export z Excelu
```

### Tok dat

1. **Excel** (`data/slovnik.xlsx`) - zde přidáváš a upravuješ slovíčka
2. **Export skript** - převede Excel na JSON pro webovou aplikaci
3. **GitHub** - hostuje webovou aplikaci zdarma
4. **Prohlížeč** - zobrazuje kartičky

---

## Přidání nových slovíček

### Krok 1: Otevři Excel soubor

1. Otevři soubor `data/slovnik.xlsx` v Excelu nebo LibreOffice
2. Uvidíš tabulku s těmito sloupci:

| Sloupec | Popis | Povinný? |
|---------|-------|----------|
| `en` | Anglické slovo | Ano |
| `pron` | Výslovnost (foneticky) | Ne |
| `meaning_en` | Význam v angličtině | Ne |
| `example` | Příklad použití ve větě | Ne |
| `cz` | Český překlad | Ne |
| `rating` | Rezervováno pro budoucí použití (ponechat prázdné) | Ne |
| `note` | Poznámka | Ne |

### Krok 2: Přidej nová slovíčka

Přidej nový řádek a vyplň minimálně sloupec `en`:

```
en          | pron      | meaning_en           | example                        | cz
------------|-----------|----------------------|--------------------------------|--------
apple       | ˈæp.əl    | a round fruit        | I eat an apple every day.      | jablko
beautiful   | ˈbjuː.tɪ.fəl | pleasing to look at | The sunset is beautiful.     | krásný
```

### Krok 3: Ulož soubor

- Ulož jako `.xlsx` (Excel formát)
- **Nezavírej Excel** před exportem, nebo zavři úplně

---

## Export dat pro aplikaci

Po úpravě slovíček musíš spustit export, aby se změny projevily v aplikaci.

### Krok 1: Otevři příkazový řádek

1. Stiskni `Win + R`
2. Napiš `cmd` a stiskni Enter
3. Přejdi do složky projektu:

```cmd
cd C:\Renik\Slovnik
```

### Krok 2: Spusť export

```cmd
python tools/export/export.py
```

### Krok 3: Ověř výstup

Měl bys vidět:
```
Reading: data/slovnik.xlsx
Found 15 words.
Written: docs/data/vocab.json
Written: docs/data/latest.json
Written: tools/export/out/report.json
Export done.
```

### Možné chyby

| Chyba | Řešení |
|-------|--------|
| `python` není rozpoznán | Nainstaluj Python z python.org |
| Excel je zamčený | Zavři Excel a zkus znovu |
| Chybí sloupec `en` | Zkontroluj, že první řádek obsahuje hlavičky |

---

## Publikování na GitHub

Po exportu musíš změny nahrát na GitHub, aby se projevily online.

### Krok 1: Otevři příkazový řádek

```cmd
cd C:\Renik\Slovnik
```

### Krok 2: Zkontroluj změny

```cmd
git status
```

Uvidíš seznam změněných souborů (červeně).

### Krok 3: Přidej změny

```cmd
git add docs/data/vocab.json docs/data/latest.json
```

### Krok 4: Vytvoř commit

```cmd
git commit -m "Přidána nová slovíčka"
```

### Krok 5: Nahraj na GitHub

```cmd
git push
```

### Krok 6: Počkej na nasazení

- GitHub Pages automaticky aktualizuje stránku
- Trvá to 1-2 minuty
- Aplikace je na: **https://rkanet.github.io/flashcards/**

---

## Kompletní postup (shrnutí)

Když chceš přidat nová slovíčka, udělej toto:

```cmd
# 1. Uprav data/slovnik.xlsx v Excelu a ulož

# 2. Otevři příkazový řádek a přejdi do složky
cd C:\Renik\Slovnik

# 3. Spusť export
python tools/export/export.py

# 4. Nahraj na GitHub (3 příkazy)
git add docs/data/vocab.json docs/data/latest.json
git commit -m "Přidána nová slovíčka"
git push
```

Za 1-2 minuty budou změny online.

---

## Používání aplikace

### Ovládání na mobilu

| Gesto | Akce |
|-------|------|
| Tap na kartičku | Odkryj odpověď |
| Swipe doleva | Další kartička |
| Swipe doprava | Předchozí kartička |

### Ovládání na PC

| Klávesa | Akce |
|---------|------|
| Mezerník | Odkryj odpověď |
| Šipka doprava | Další kartička |
| Šipka doleva | Předchozí kartička |

### Režimy učení

- **EN → CZ**: Vidíš anglické slovo, hádáš český překlad
- **CZ → EN**: Vidíš český překlad, hádáš anglické slovo

Přepínáš tlačítkem "EN → CZ" / "CZ → EN".

---

## Řešení problémů

### Aplikace ukazuje staré slovíčka

1. Otevři aplikaci v prohlížeči
2. Stiskni `Ctrl + Shift + R` (hard refresh)
3. Nebo vymaž cache: F12 → Application → Storage → Clear site data

### Export nefunguje

1. Zkontroluj, že Excel je zavřený
2. Zkontroluj, že máš Python nainstalovaný: `python --version`
3. Zkontroluj, že jsi ve správné složce: `cd C:\Renik\Slovnik`

### Git push nefunguje

1. Zkontroluj připojení k internetu
2. Ověř přihlášení: `gh auth status`
3. Případně se znovu přihlas: `gh auth login`

### Aplikace nefunguje offline

1. Nejprve musíš aplikaci otevřít online (aby se stáhla do cache)
2. Pak funguje offline
3. Nová slovíčka se stáhnou až při online připojení

---

## Užitečné odkazy

- **Aplikace**: https://rkanet.github.io/flashcards/
- **GitHub repozitář**: https://github.com/rkanet/flashcards
- **Lokální testování**: http://localhost:8080 (po spuštění serveru)

---

## Spuštění lokálního serveru (pro testování)

Pokud chceš testovat změny před nahráním na GitHub:

```cmd
cd C:\Renik\Slovnik
python -m http.server 8080 --directory docs
```

Pak otevři v prohlížeči: http://localhost:8080

Zastav server: `Ctrl + C`
