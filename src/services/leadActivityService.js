const localDay = new Intl.DateTimeFormat('en-CA', {
  timeZone:'America/Fortaleza', year:'numeric', month:'2-digit', day:'2-digit',
});

export function leadActivityDay(now = new Date()) {
  return localDay.format(now);
}

export function lastSevenDays(now) {
  const today = leadActivityDay(now);
  const firstDay = new Date(today + 'T00:00:00Z');
  firstDay.setUTCDate(firstDay.getUTCDate() - 6);
  const start = firstDay.toISOString().slice(0, 10);
  return day => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && day >= start && day <= today;
}
