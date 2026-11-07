import http from 'node:http'
import { readFileSync } from 'node:fs'
const secret = readFileSync('.dev.vars', 'utf8').match(/ORDER_SECRET=(.*)/)[1].trim()
const rows = []
http.createServer((req, res) => {
  let body = ''
  req.on('data', (d) => (body += d))
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json')
    const url = new URL(req.url, 'http://x')
    if (req.method === 'POST') {
      const d = JSON.parse(body)
      if (d.secret !== secret) return res.end(JSON.stringify({ status: 'error', message: 'unauthorised' }))
      rows.push(d)
      console.log('ROW', JSON.stringify({ items: d.items, total: d.total, name: d.customerName, phone: d.phone }))
      return res.end(JSON.stringify({ status: 'success' }))
    }
    if (url.searchParams.get('secret') !== secret) return res.end(JSON.stringify({ status: 'error', message: 'unauthorised' }))
    res.end(JSON.stringify({ status: 'success', orders: rows.map((r) => ({ time: '2026-11-07 18:30:00', name: r.customerName, phone: r.phone, additionalPhone: r.additionalPhone, address: r.address, items: r.items, total: r.total, notes: r.notes, type: r.orderType })) }))
  })
}).listen(8799, '127.0.0.1', () => console.log('mock sheet on 8799'))
