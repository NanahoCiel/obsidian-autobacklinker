# Obsidian AutoBacklinker 🔗

Automatically wraps matching words in your notes with `[[wikilinks]]` using **existing note titles** in your vault. Designed for **Korean + English** notes (handles 조사 like `을/를` automatically).

## ✅ Features
- Builds a live index of all note titles in the vault
- Auto-links on save (toggleable via ribbon / command)
- Korean particle handling: e.g., `Ciel을` → `[[Ciel]]을`
- Ignores already-linked `[[...]]` content
- One-off commands: current note / incremental / whole vault
- Exclude folders, batch size control (Settings)

## 🧭 Commands
- **AutoBacklinker: Toggle auto mode (on-save)** — turn automatic linking on/off
- **AutoBacklinker: Rebuild title index** — refresh title cache
- **AutoBacklinker: Process current note (one-off)** — link only the active file
- **AutoBacklinker: Process notes changed since last run** — incremental
- **AutoBacklinker: Process whole vault (one-off)** — all notes

## ⚙️ Settings
- **Allow Korean particles after title** — keep 조사 after links
- **Auto-link on save/modify (auto mode)** — enable background linking
- **Exclude folders** — semicolon separated roots (e.g., `Templates;Daily Notes`)
- **Batch size (advanced)** — bulk ops chunk size (default 50)
- **Last incremental run** — informational

## 📦 Install (Manual)
1. Build (or download release) to get `main.js`.
2. Put these in your vault folder: `.obsidian/plugins/autobacklinker/`
   - `manifest.json`
   - `main.js`
   - *(optional)* `styles.css`
3. Enable in **Settings → Community plugins**.

## 🛠 Build (Developer)
```bash
npm i
npm run build   # generates main.js
```
- Tooling: Rollup + TypeScript
- See `tsconfig.json` and `rollup.config.js` for configuration.

## 🪪 License
MIT
