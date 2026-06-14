// Generate an iCalendar (.ics) all-day event for a cooked dish and let the
// user save it to their device calendar (iOS / Android / desktop).

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function ymdCompact(ymd: string): string {
  return ymd.replaceAll('-', '')
}

function nextDayCompact(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + 1)
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}`
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export function addCookedDateToCalendar(name: string, ymd: string, description?: string): void {
  const summary = `🍳 ${name || '料理'}`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//cook_myself//JP',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@cook_myself`,
    `DTSTAMP:${stamp()}`,
    `DTSTART;VALUE=DATE:${ymdCompact(ymd)}`,
    `DTEND;VALUE=DATE:${nextDayCompact(ymd)}`,
    `SUMMARY:${escapeIcs(summary)}`,
    description ? `DESCRIPTION:${escapeIcs(description)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(name || 'dish').replace(/[\\/:*?"<>|]/g, '_')}-${ymd}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
