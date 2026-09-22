const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 123456 -> "₹1,23,456.00" (Indian digit grouping). Works the same on every phone. */
export function formatINR(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const paise = Math.round(Math.abs(safe) * 100);
  const rupees = String(Math.floor(paise / 100));
  const decimals = String(paise % 100).padStart(2, '0');

  const last3 = rupees.slice(-3);
  const rest = rupees.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;

  return `${safe < 0 && paise > 0 ? '-' : ''}₹${grouped}.${decimals}`;
}

/** 2 -> "2", 2.5 -> "2.5", 0.125 -> "0.125" (no useless zeros). */
export function formatQty(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return String(Math.round(value * 1000) / 1000);
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Date -> "2026-09-18" using the phone's local date (not UTC). */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** "2026-09-18" -> local Date at noon (noon avoids daylight-saving edge cases). */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

/** Date -> "18 Sep 2026" */
export function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** ISO string -> "18 Sep 2026, 3:45 PM" */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const hours = date.getHours();
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${formatDate(date)}, ${hour12}:${pad2(date.getMinutes())} ${ampm}`;
}

/** Only the time part: "3:45 PM" */
export function formatTime(iso: string): string {
  const full = formatDateTime(iso);
  return full.includes(', ') ? full.split(', ')[1] : full;
}
