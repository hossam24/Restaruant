# Restaurant ordering site (template)

A ready-made online menu and ordering site for any restaurant. Arabic (right-to-left), phone first.
React + TypeScript + Vite + Tailwind. **No server of our own:** the menu, the sections, the settings (opening hours,
delivery fee) and the orders all live in one Google Sheet, which the owner edits like Excel. Customers send their order
on WhatsApp, and it is also logged in the Sheet.

It has no restaurant name yet. Everything specific to a restaurant is in `src/brand.json` (see below).

## Make it yours

1. Open `src/brand.json` and fill in the name, the welcome line, the WhatsApp number (international format, no `+`,
   for example `201000000000`), phones, address, social links and the brand colour. Empty fields are simply not shown.
2. Run `npm run icons` to redraw the app icon in your colour (or just replace `public/icon-192.png`,
   `public/icon-512.png` and `public/og.png` with your logo).
3. Connect a Google Sheet (next section) to manage the menu without touching code.
4. Photos: put files in `public/imgs` and write their names in the sheet, or paste a full `https://` link.
   Items without a photo show `public/imgs/default.webp`.

If the colours should change too, edit the `brand-*` values in `src/index.css`.

## How it works

```
Owner edits the Google Sheet  ->  Apps Script (google-apps-script.js)  <->  the website (static files)
   tabs: المنيو, الأقسام,           GET  = the menu, sections, settings    customers browse and order
         الإعدادات                  POST = an order, checked again
         one tab per day                   and priced from the sheet
         for the orders
```

- The website is plain static files. Host it anywhere, for example Cloudflare Pages: build command `npm run build`,
  output folder `dist`.
- `google-apps-script.js` is pasted into the Sheet's Apps Script. It serves the menu, validates every order, works out
  the prices itself from the sheet (it never trusts prices from the browser), throttles floods, and writes the orders.
- `src/data/menu.ts` is a **sample menu**. It fills a new Sheet, and it is what the site shows when no Sheet is
  connected or the Sheet cannot be reached.

## Connecting your own Google Sheet (about 5 minutes)

1. Create a new Google Sheet in your Google account (sheets.new).
2. Extensions -> Apps Script. Delete what is there, paste the whole of `google-apps-script.js`, Save.
3. Choose the function `setup` in the toolbar and press Run (allow access). It creates the tabs `المنيو`, `الأقسام`
   and `الإعدادات` and fills them with the sample menu.
4. Deploy -> New deployment -> Web app. Execute as: **Me**. Who has access: **Anyone**. Deploy, and copy the Web app URL
   (it ends with `/exec`).
5. Give that URL to the website as `VITE_SHEET_API_URL`:
   - while developing: copy `.env.example` to `.env.local` and paste it there;
   - when publishing: add it as a variable in the hosting dashboard (Cloudflare Pages -> Settings -> Variables).

To change the script later: edit `scripts/apps-script.template.js`, run `npm run apps-script`, paste the new
`google-apps-script.js` into Apps Script, then Deploy -> Manage deployments -> pencil -> New version (the URL stays).

## Daily use (owner)

- **`المنيو` tab:** change a price, type a new item on the next empty row (the code in column A is filled in by
  itself), set `متاح النهارده؟` to `لا` when something runs out, `ظاهر في المنيو؟` to `لا` to hide it.
  The `القسم` column is a dropdown of the sections.
- **`الأقسام` tab:** the sections of the menu, one per row, in the order they appear in the side menu. Add a row for a new
  section, rename or reorder them, and optionally write a note that shows above that section's dishes.
- **`الإعدادات` tab:** opening hours, delivery fee, free-delivery amount, delivery time.

Changes reach the site in about a minute. Orders appear in a new tab per day. In the Sheet, the menu
**إدارة المنيو -> فحص المنيو** lists rows the site cannot use and why.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | The website, using the sample menu (or the Sheet from `VITE_SHEET_API_URL`) |
| `npm run sheet:fake` | A pretend Google Sheet on http://127.0.0.1:8799. It runs the real `google-apps-script.js`; open it in a browser to edit cells like in Excel |
| `npm run dev:sheet` | The website connected to the pretend Sheet |
| `npm test` | Unit tests, including the real Apps Script run against a fake sheet |
| `npm run typecheck` / `npm run build` | Check the types / production build into `dist/` |
| `npm run apps-script` | Rebuild `google-apps-script.js` from the template and the sample menu |
| `npm run icons` | Redraw the app icons and the share picture from the colour in `src/brand.json` |
| `npm run images` | Convert and shrink photos in `public/imgs` to WebP |

Optional: set `VITE_SITE_URL` (for example `https://your-site.pages.dev`) when building, so link previews on
WhatsApp and Facebook can show the share picture.

## Other folders

- `archive/cloudflare-admin/`: an earlier idea for the owner tools (an `/admin` page on Cloudflare Functions). Kept for reference, not built.

## Notes

- The wording is Egyptian Arabic, prices are in Egyptian pounds, and phone numbers are checked as Egyptian mobiles
  (`01x xxxxxxxx`). The leg/breast choice (`ورك/صدر؟` column) is optional and only for items that need it.
- The Web app URL is public by nature (the website must call it). It only returns the public menu and accepts orders.
  Orders and customers' phone numbers cannot be read through it; they stay inside the Sheet, which is private to its owner.
- Every order is validated again and priced from the Sheet. One phone number can send 3 orders per 10 minutes and the
  whole site 120 per 10 minutes. This is a brake against floods, not a guarantee: the WhatsApp message remains the real order.
- Menu data coming from the Sheet is checked again by the website (`src/data/sheetMenu.ts`): bad rows are dropped,
  photos must be site files or `https://` links, and an empty or broken answer never replaces the menu.
