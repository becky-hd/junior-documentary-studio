# 🌍 WildPages — Junior Documentary Studio

An interactive, creative **3rd-grade structured nonfiction writing web app** built for young readers who love documentary books, backed by **Google Sheets as the relational database/storage tables** and deployed on **Vercel**.

## ✨ Highlights

- **Mission 1 — Instant Hook & Warm-Up (`Press Pass` + `Rescue the Boring Book!`)**: Low-friction 2-minute opening activity that gets her writing immediately by turning hilarious "Sleepy Textbook" lines into exciting real-world documentary captions.
- **Mission 2 — Documentary Blueprint (Structured Writing Lab)**: Guides 3rd-grade nonfiction writing step-by-step using the **Fact + Zoom-In** structure (`Catchy Title → Opening Hook → Topic Sentence → 3 Fact + Zoom-In Pairs with Transition Pickers → Strong Wrap-Up`), paired with a side-by-side **Fact Pack Drawer**, a **Mimic Octopus Model Example**, and a live **💎 Sleepy Word Detective** that suggests one-click book-worthy word upgrades.
- **Toolbox — Interactive Word Vault & Fact Encyclopedia**: Flip cards for vocabulary upgrades, a Transition Word Glue Bank, and 6 real nonfiction Fact Packs.
- **Mission 3 — Published Magazine Page & Author Badge Studio**: Automatically renders her structured blocks into a printable 3-paragraph *National Kid-Geographic* magazine page with an editable *"Did You Know?"* sidebar, sticker illustration frame, and an 8-item Editor-in-Chief checklist that unlocks her Author Rank.

## 📊 Google Sheets Database Tables

The app uses a 6-tab Google Spreadsheet as its database:

1. `Topics` — Documentary topics, 4 real facts each, vocabulary, and model prompts
2. `WarmupChallenges` — "Rescue the Boring Book!" warm-up challenges
3. `WordVault` — Sleepy words, juicy upgrades, strong action verbs, and example sentences
4. `StudentProfiles` — Explorer Press Pass profiles and stars
5. `WarmupSubmissions` — Saved warm-up captions
6. `WritingDrafts` — Structured documentary drafts, stickers, checklists, word counts, and author ranks

## 🔐 Connecting Live Google Sheets Writes on Vercel

Out of the box, the app runs safely in **Demo Preview Mode** if write credentials aren't set yet. To enable permanent read/write persistence to your Google Sheet, configure **either** option in **Vercel → Project Settings → Environment Variables**:

### Option A: Google Cloud Service Account (Recommended)
1. Create a Google Cloud Service Account with the **Google Sheets API** enabled.
2. Share your Google Sheet with the service account email as **Editor**.
3. Set in Vercel:
   - `GOOGLE_SPREADSHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `SESSION_SECRET` (32+ random hex chars)

### Option B: 60-Second Google Apps Script Bridge
1. Open your Google Sheet → **Extensions → Apps Script**.
2. Paste `google-apps-script/Code.gs`, add Script Property `APPS_SCRIPT_SECRET`, and deploy as a Web App (`Execute as: Me`, `Who has access: Anyone`).
3. Set in Vercel:
   - `GOOGLE_SPREADSHEET_ID`
   - `GOOGLE_APPS_SCRIPT_URL`
   - `APPS_SCRIPT_SECRET`
   - `SESSION_SECRET`

## 🧑‍💻 Local Development

```bash
npm install
npm run dev:api   # Starts local BFF API on http://127.0.0.1:3001
npm run dev       # Starts Vite frontend on http://127.0.0.1:5173
```
