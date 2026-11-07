import { readFileSync } from 'node:fs'
import { webcrypto } from 'node:crypto'
import vm from 'node:vm'

class FakeSheet {
  constructor(name) {
    this.name = name
    this.cells = new Map()
    this.formats = new Map()
    this.validations = []
    this.frozen = 0
  }
  getName() {
    return this.name
  }
  _set(r, c, v) {
    const key = `${r}:${c}`
    if (v === '' || v === null || v === undefined) return void this.cells.delete(key)
    if (typeof v === 'string' && this.formats.get(key) !== '@' && /^\d{1,2}:\d{2}$/.test(v)) {
      const [h, m] = v.split(':').map(Number)
      v = new Date(Date.UTC(1899, 11, 30, h, m))
    }
    this.cells.set(key, v)
  }
  _get(r, c) {
    return this.cells.has(`${r}:${c}`) ? this.cells.get(`${r}:${c}`) : ''
  }
  getLastRow() {
    let max = 0
    for (const k of this.cells.keys()) max = Math.max(max, Number(k.split(':')[0]))
    return max
  }
  getRange(r, c, nr = 1, nc = 1) {
    return new FakeRange(this, r, c, nr, nc)
  }
  appendRow(values) {
    const r = this.getLastRow() + 1
    values.forEach((v, i) => this._set(r, i + 1, v))
  }
  setFrozenRows(n) {
    this.frozen = n
  }
  setColumnWidth() {}
}

class FakeRange {
  constructor(sheet, r, c, nr, nc) {
    Object.assign(this, { sheet, r, c, nr, nc })
    return new Proxy(this, {
      get: (t, prop) => (prop in t ? t[prop] : typeof prop === 'string' && prop.startsWith('set') ? () => t.self() : undefined),
    })
  }
  self() {
    return this
  }
  getSheet() {
    return this.sheet
  }
  getRow() {
    return this.r
  }
  getColumn() {
    return this.c
  }
  getNumRows() {
    return this.nr
  }
  getNumColumns() {
    return this.nc
  }
  getValues() {
    return Array.from({ length: this.nr }, (_, i) => Array.from({ length: this.nc }, (_, j) => this.sheet._get(this.r + i, this.c + j)))
  }
  getValue() {
    return this.sheet._get(this.r, this.c)
  }
  setValues(rows) {
    rows.forEach((row, i) => row.forEach((v, j) => this.sheet._set(this.r + i, this.c + j, v)))
    return this
  }
  setValue(v) {
    this.sheet._set(this.r, this.c, v)
    return this
  }
  setNumberFormat(fmt) {
    for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.sheet.formats.set(`${this.r + i}:${this.c + j}`, fmt)
    return this
  }
  setDataValidation(rule) {
    this.sheet.validations.push({ row: this.r, col: this.c, rows: this.nr, cols: this.nc, list: rule.list, fromTab: rule.fromTab })
    return this
  }
}

const pad = (n) => String(n).padStart(2, '0')

function formatDate(date, tz, fmt) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((x) => [x.type, x.value]),
  )
  return fmt.replace('yyyy', p.year).replace('MM', p.month).replace('dd', p.day).replace('HH', p.hour).replace('mm', p.minute).replace('ss', p.second)
}

export function createRuntime(scriptPath = 'google-apps-script.js') {
  const sheets = new Map()
  const clock = { offset: 0, now: () => Date.now() + clock.offset }
  const cacheStore = new Map()
  const alerts = []

  const ss = {
    getSheetByName: (n) => sheets.get(n) ?? null,
    insertSheet: (n) => {
      const s = new FakeSheet(n)
      sheets.set(n, s)
      return s
    },
    getSpreadsheetTimeZone: () => 'UTC',
  }

  const sandbox = {
    console,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ss,
      newDataValidation: () => ({
        list: [],
        requireValueInList(list) {
          this.list = list
          return this
        },
        requireValueInRange(range) {
          this.list = range.getValues().flat().filter((v) => v !== '')
          this.fromTab = range.sheet.name
          return this
        },
        setAllowInvalid() {
          return this
        },
        build() {
          return { list: this.list, fromTab: this.fromTab }
        },
      }),
      getUi: () => ({
        alert: (m) => alerts.push(m),
        createMenu: () => ({ addItem() { return this }, addToUi() {} }),
      }),
    },
    Utilities: { formatDate, getUuid: () => webcrypto.randomUUID() },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => {
          const e = cacheStore.get(k)
          return e && e.until > clock.now() ? e.value : null
        },
        put: (k, v, sec) => cacheStore.set(k, { value: String(v), until: clock.now() + sec * 1000 }),
        remove: (k) => cacheStore.delete(k),
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: 'JSON' },
      createTextOutput: (content) => ({
        content,
        setMimeType() {
          return this
        },
        getContent() {
          return this.content
        },
      }),
    },
  }
  vm.createContext(sandbox)
  vm.runInContext(readFileSync(scriptPath, 'utf8'), sandbox, { filename: scriptPath })

  const parse = (out) => JSON.parse(out.getContent())
  return {
    ctx: sandbox,
    ss,
    sheets,
    clock,
    alerts,
    cacheStore,
    setup: () => sandbox.setup(),
    menu: () => parse(sandbox.doGet({})),
    order: (body) => parse(sandbox.doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } })),
    edit(tab, row, col, value) {
      const sheet = sheets.get(tab)
      sheet.getRange(row, col).setValue(value)
      sandbox.onEdit({ range: sheet.getRange(row, col) })
    },
    paste(tab, row, col, rows) {
      const sheet = sheets.get(tab)
      sheet.getRange(row, col, rows.length, rows[0].length).setValues(rows)
      sandbox.onEdit({ range: sheet.getRange(row, col, rows.length, rows[0].length) })
    },
    menuSheet: () => sheets.get('المنيو'),
    ordersToday: () => {
      const day = formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd')
      const sheet = sheets.get(day)
      return sheet ? sheet.getRange(1, 1, sheet.getLastRow(), 9).getValues() : []
    },
  }
}
