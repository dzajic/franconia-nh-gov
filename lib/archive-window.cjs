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
    return value.toISOString().slice(0, 10);
  }
  const match = String(value).match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
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
  if (precision === "month") {
    const start = `${iso.slice(0, 7)}-01`;
    return monthEnd(iso) >= cutoff && start <= today;
  }
  if (precision !== "exact") return false;
  return iso >= cutoff && iso <= today;
}

function byDateDesc(a, b) {
  const date = String((b.data && b.data.doc_date) || "").localeCompare(String((a.data && a.data.doc_date) || ""));
  if (date) return date;
  return String((a.data && a.data.title) || "").localeCompare(String((b.data && b.data.title) || ""));
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
    .sort((a, b) => b.localeCompare(a))
    .map((key) => {
      const monthIndex = Number(key.slice(5, 7)) - 1;
      return {
        key,
        label: `${FULL_MONTHS[monthIndex] || key} ${key.slice(0, 4)}`,
        items: recentMap.get(key).sort(byDateDesc),
      };
    });

  const years = [...yearMap.keys()]
    .sort((a, b) => {
      if (a === "undated") return 1;
      if (b === "undated") return -1;
      return Number(b) - Number(a);
    })
    .map((year) => {
      const items = yearMap.get(year).sort(byDateDesc);
      return {
        year,
        label: year === "undated" ? "Undated" : year,
        count: items.length,
        items,
      };
    });

  return { months, cutoff, today, recent, years };
}

module.exports = { recentMonths, partitionArchive };
