# Rasheedy Restaurant

Ordering site for مشويات رشيدي. React + TypeScript + Vite + Tailwind. **No server of our own:** the menu, the
settings (opening hours, delivery fee) and the orders all live in one Google Sheet, which the owner edits like Excel.

## How it works

```
Owner edits the Google Sheet  ->  Apps Script (google-apps-script.js)  <->  the website (static files)
   tabs: المنيو, الإعدادات          GET  = the menu + settings            customers browse and order
         one tab per day            POST = an order, checked again
         for the orders                    and priced from the sheet
```

- The website is plain static files (host it anywhere, e.g. Cloudflare Pages: build `npm run build`, output `dist`).
- `google-apps-script.js` is pasted into the Sheet's Apps Script. It serves the menu, validates every order, works out the
  prices itself from the sheet (it never trusts prices from the browser), throttles floods, and writes the orders.
- `src/data/menu.ts` is the built-in menu. It is the starting data for a new Sheet and the fallback shown when no Sheet
  is connected or the Sheet cannot be reached.

## Connecting your own Google Sheet (about 5 minutes)

1. Create a new Google Sheet in your Google account (sheets.new).
2. Extensions -> Apps Script. Delete what is there, paste the whole of `google-apps-script.js`, Save.
3. Choose the function `setup` in the toolbar and press Run (allow access). It creates the tabs `المنيو` and `الإعدادات`
   and fills the menu.
4. Deploy -> New deployment -> Web app. Execute as: **Me**. Who has access: **Anyone**. Deploy, and copy the Web app URL
   (it ends with `/exec`).
5. Paste that URL into `SHEET_API_URL` in `src/config.ts`, then publish the site.

To change the script later: edit `scripts/apps-script.template.js`, run `npm run apps-script`, paste the new
`google-apps-script.js` into Apps Script, then Deploy -> Manage deployments -> pencil -> New version (the URL stays).

## Daily use (owner)

Edit the `المنيو` tab: change a price, type a new item on the next empty row (the code in column A is filled in by
itself), set `متاح النهارده؟` to `لا` when something runs out, `ظاهر في المنيو؟` to `لا` to hide it. The `الإعدادات` tab holds the
opening hours and delivery fee. Changes reach the site in about a minute. Orders appear in a new tab per day.
In the Sheet, the menu **رشيدي -> فحص المنيو** lists rows the site cannot use and why.

Photos: write a file name from `public/imgs` (for example `offers/alf-hana.webp`) or a full `https://` link in the
`الصورة` column.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | The website, using the built-in menu (or the Sheet from `SHEET_API_URL`) |
| `npm run sheet:fake` | A pretend Google Sheet on http://127.0.0.1:8799. It runs the real `google-apps-script.js`; open it in a browser to edit cells like in Excel |
| `npm run dev:sheet` | The website connected to the pretend Sheet |
| `npm test` | Unit tests, including the real Apps Script run against a fake sheet |
| `npm run typecheck` / `npm run build` | Check the types / production build into `dist/` |
| `npm run apps-script` | Rebuild `google-apps-script.js` from the template and the built-in menu |
| `npm run images` | Convert and shrink photos in `public/imgs` to WebP |

## Other folders

- `archive/cloudflare-admin/`: the first version of the owner tools (an `/admin` page on Cloudflare Functions). Kept for reference, not built.
- `legacy/`: the original plain HTML/JS site. Safe to delete.

## Security notes

- The Web app URL is public by nature (the website must call it). It only returns the public menu and accepts orders.
  Orders and customers' phone numbers cannot be read through it; they stay inside the Sheet, which is private to its owner.
- Every order is validated again and priced from the Sheet. One phone number can send 3 orders per 10 minutes and the
  whole site 120 per 10 minutes. This is a brake against floods, not a guarantee: the WhatsApp message remains the real order.
- Menu data coming from the Sheet is checked again by the website (`src/data/sheetMenu.ts`): bad rows are dropped,
  photos must be site files or `https://` links, and an empty or broken answer never replaces the menu.
