const FULL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function recentMonths() {
  const raw = process.env.RECENT_MONTHS;
  if (raw === undefined || String(raw).trim() === "") return 12;
  const months = Number(raw);
  if (!Number.isFinite(months) || months < 0) return 12;
  return Math.floor(months);
}

function isoDate(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const match = String(value).match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

/** UTC midnight for a record date. Null when the value is missing or not a calendar day. */
function dateValue(value) {
  const iso = isoDate(value);
  if (!iso) return null;
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  if (!year || !month || !day) return null;
  return Date.UTC(year, month - 1, day);
}

function compareDocsDesc(a, b) {
  const av = dateValue(a.data && a.data.doc_date);
  const bv = dateValue(b.data && b.data.doc_date);
  if (av === null && bv === null) {
    return String((a.data && a.data.title) || "").localeCompare(String((b.data && b.data.title) || ""));
  }
  if (av === null) return 1;
  if (bv === null) return -1;
  if (av !== bv) return bv - av;
  return String((a.data && a.data.title) || "").localeCompare(String((b.data && b.data.title) || ""));
}

function monthKeyValue(key) {
  const year = Number(String(key).slice(0, 4));
  const month = Number(String(key).slice(5, 7));
  return year * 12 + month;
}

function formatIso(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function subtractMonths(date, months) {
  const firstOfTarget = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - months, 1));
  const lastDay = new Date(
    Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth() + 1, 0)
  ).getUTCDate();
  return new Date(
    Date.UTC(
      firstOfTarget.getUTCFullYear(),
      firstOfTarget.getUTCMonth(),
      Math.min(date.getUTCDate(), lastDay)
    )
  );
}

function monthEnd(iso) {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${iso.slice(0, 7)}-${String(last).padStart(2, "0")}`;
}

function isRecent(data, cutoff, today) {
  const precision = data.date_precision || "unknown";
  const iso = isoDate(data.doc_date);
  if (!iso || precision === "unknown" || precision === "year") return false;
  const start = dateValue(precision === "month" ? `${iso.slice(0, 7)}-01` : iso);
  const end = dateValue(precision === "month" ? monthEnd(iso) : iso);
  const cutoffValue = dateValue(cutoff);
  const todayValue = dateValue(today);
  if (start === null || end === null || cutoffValue === null || todayValue === null) return false;
  return end >= cutoffValue && start <= todayValue;
}

/**
 * Split document records into an expanded rolling window and collapsed older years.
 * The cutoff is computed from the build clock, not stored on the records.
 * Exact dates on or after the cutoff and on or before today are recent.
 * Month-only dates are recent when that calendar month overlaps the window.
 * Undated, year-only, and future-dated records stay in the year sections.
 */
function partitionArchive(docs, now = new Date()) {
  const months = recentMonths();
  const todayDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const today = formatIso(todayDate);
  const cutoff = formatIso(subtractMonths(todayDate, months));
  const recentMap = new Map();
  const yearMap = new Map();

  for (const doc of docs || []) {
    const data = doc.data || {};
    if (isRecent(data, cutoff, today)) {
      const key = isoDate(data.doc_date).slice(0, 7);
      if (!recentMap.has(key)) recentMap.set(key, []);
      recentMap.get(key).push(doc);
    } else {
      const year = String(data.doc_year || "undated");
      if (!yearMap.has(year)) yearMap.set(year, []);
      yearMap.get(year).push(doc);
    }
  }

  const recent = [...recentMap.keys()]
    .sort((a, b) => monthKeyValue(b) - monthKeyValue(a))
    .map((key) => {
      const monthIndex = Number(key.slice(5, 7)) - 1;
      return {
        key,
        label: `${FULL_MONTHS[monthIndex] || key} ${key.slice(0, 4)}`,
        items: recentMap.get(key).sort(compareDocsDesc),
      };
    });

  const years = [...yearMap.keys()]
    .sort((a, b) => {
      if (a === "undated") return 1;
      if (b === "undated") return -1;
      return Number(b) - Number(a);
    })
    .map((year) => {
      const items = yearMap.get(year).sort(compareDocsDesc);
      return {
        year,
        label: year === "undated" ? "Undated" : year,
        count: items.length,
        items,
      };
    });

  return { months, cutoff, today, recent, years };
}

module.exports = { recentMonths, partitionArchive, dateValue, compareDocsDesc, monthKeyValue };
