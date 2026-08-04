export type MonthAvailability = Record<string, number>;
export type OfficeHourSlot = { time: string; taken: boolean; fomoBlocked?: boolean };

const VISIBLE_DAYS_PER_MONTH = 8;
const MIN_CLICKABLE_SLOTS_PER_DAY = 1;
const MAX_CLICKABLE_SLOTS_PER_DAY = 3;

function localWeekKey() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
  const week = Math.ceil((dayOfYear + start.getDay()) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function hashSeed(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seedInput: string) {
  const result = [...items];
  const random = seededRandom(hashSeed(seedInput));
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function clickableSlotCount(dateISO: string, openSlotsCount: number) {
  if (openSlotsCount <= 0) return 0;
  const random = seededRandom(hashSeed(`${dateISO}:${localWeekKey()}:count`));
  const range = MAX_CLICKABLE_SLOTS_PER_DAY - MIN_CLICKABLE_SLOTS_PER_DAY + 1;
  const count = MIN_CLICKABLE_SLOTS_PER_DAY + Math.floor(random() * range);
  return Math.min(count, openSlotsCount);
}

export function applyOfficeHoursFomoToMonth(
  year: number,
  month: number,
  monthData: MonthAvailability,
) {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const eligibleDates = Object.keys(monthData)
    .filter((date) => (monthData[date] ?? 0) > 0)
    .sort();

  const visibleDates = new Set(
    seededShuffle(eligibleDates, `${monthKey}:${localWeekKey()}`)
      .slice(0, VISIBLE_DAYS_PER_MONTH),
  );

  return eligibleDates.reduce<MonthAvailability>((acc, date) => {
    if (visibleDates.has(date)) acc[date] = clickableSlotCount(date, monthData[date] ?? 0);
    return acc;
  }, {});
}

export function applyOfficeHoursFomoToSlots(dateISO: string, slots: OfficeHourSlot[]) {
  const openSlots = slots.filter((slot) => !slot.taken);
  const clickableCount = clickableSlotCount(dateISO, openSlots.length);
  const clickable = new Set(
    seededShuffle(openSlots, `${dateISO}:${localWeekKey()}`)
      .slice(0, clickableCount)
      .map((slot) => slot.time),
  );

  return slots.map((slot) => {
    if (slot.taken || clickable.has(slot.time)) return slot;
    return { ...slot, taken: true, fomoBlocked: true };
  });
}

export const OFFICE_HOURS_FOMO_VISIBLE_DAYS = VISIBLE_DAYS_PER_MONTH;
