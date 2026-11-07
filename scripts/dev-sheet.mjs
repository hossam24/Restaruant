import http from 'node:http'
import { createRuntime } from './fake-sheets.mjs'

const PORT = Number(process.env.PORT ?? 8799)
const rt = createRuntime()
rt.setup()

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
const send = (res, status, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(status, { 'Content-Type': type, ...CORS })
  res.end(body)
}
const readBody = (req) =>
  new Promise((resolve) => {
    let data = ''
    req.on('data', (d) => (data += d))
    req.on('end', () => resolve(data))
  })

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

function page() {
  const tabs = [...rt.sheets.keys()]
  const blocks = tabs
    .map((name) => {
      const sheet = rt.sheets.get(name)
      const rows = sheet.getLastRow()
      const cols = Math.max(0, ...[...sheet.cells.keys()].map((k) => Number(k.split(':')[1])))
      const body = Array.from({ length: rows }, (_, i) => {
        const r = i + 1
        const cells = Array.from({ length: cols }, (_, j) => {
          const v = sheet._get(r, j + 1)
          const shown = v instanceof Date ? v.toISOString().slice(11, 16) : v
          return r === 1
            ? `<th>${esc(shown)}</th>`
            : `<td><input value="${esc(shown)}" data-tab="${esc(name)}" data-row="${r}" data-col="${j + 1}"></td>`
        }).join('')
        return `<tr><td class="n">${r}</td>${cells}</tr>`
      }).join('')
      return `<h2>${esc(name)}</h2><div class="scroll"><table>${body}</table></div>`
    })
    .join('')
  return `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>الشيت التجريبي</title>
<style>body{font-family:Segoe UI,Tahoma,sans-serif;margin:16px;background:#f7f6f4}h1{margin:0 0 4px}p{color:#555}
.scroll{overflow:auto;max-height:70vh;border:1px solid #ccc;background:#fff;margin-bottom:28px}table{border-collapse:collapse}
th{position:sticky;top:0;background:#e67e22;color:#fff;padding:6px 8px;font-size:13px;white-space:nowrap}td{border:1px solid #e5e5e5;padding:0}
td.n{padding:2px 6px;color:#999;font-size:12px}input{border:0;padding:6px 8px;min-width:90px;font:inherit;background:transparent}input:focus{outline:2px solid #e67e22;background:#fff8ef}
.ok{outline:2px solid #2e9e5b}</style>
<h1>الشيت التجريبي (على جهازك بس)</h1>
<p>ده شيت وهمي بيشغّل نفس كود Google الحقيقي. غيّر أي خانة (مثلاً سعر) واضغط Enter، وبعدها افتح الموقع. الطلبات بتظهر في تبويب اليوم لما تعمل refresh للصفحة دي.</p>
${blocks}
<script>
document.addEventListener('change', async (e) => {
  const i = e.target; if (!i.dataset || !i.dataset.tab) return;
  const r = await fetch('/__edit', {method:'POST', body: JSON.stringify({tab:i.dataset.tab,row:+i.dataset.row,col:+i.dataset.col,value:i.value})});
  i.classList.toggle('ok', r.ok); setTimeout(()=>i.classList.remove('ok'), 800);
});
</script></html>`
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://x')
    if (req.method === 'OPTIONS') return send(res, 204, '')
    try {
      if (url.pathname === '/exec' && req.method === 'GET') return send(res, 200, rt.ctx.doGet({}).getContent())
      if (url.pathname === '/exec' && req.method === 'POST') {
        const out = rt.ctx.doPost({ postData: { contents: await readBody(req) } })
        return send(res, 200, out.getContent())
      }
      if (url.pathname === '/__edit' && req.method === 'POST') {
        const { tab, row, col, value } = JSON.parse(await readBody(req))
        const n = Number(value)
        rt.edit(tab, row, col, value !== '' && !Number.isNaN(n) && /^\d+(\.\d+)?$/.test(value) ? n : value)
        return send(res, 200, '{"ok":true}')
      }
      if (url.pathname === '/__orders') return send(res, 200, JSON.stringify(rt.ordersToday()))
      if (url.pathname === '/__reset') {
        rt.sheets.clear()
        rt.cacheStore.clear()
        rt.setup()
        return send(res, 200, '{"ok":true}')
      }
      if (url.pathname === '/') return send(res, 200, page(), 'text/html; charset=utf-8')
      send(res, 404, '{"error":"not found"}')
    } catch (e) {
      send(res, 500, JSON.stringify({ error: String(e?.message ?? e) }))
    }
  })
  .listen(PORT, '127.0.0.1', () => console.log(`Fake Google Sheet on http://127.0.0.1:${PORT}  (menu API: /exec)`))
