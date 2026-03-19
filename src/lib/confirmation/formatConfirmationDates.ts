const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

const toDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const isMidnightUtc = (date: Date) => {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
};

const isSameUtcDay = (left: Date, right: Date) => {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
};

export const formatConfirmationDateTime = (
  value: string | null | undefined,
  options: {
    emptyLabel?: string | null;
  } = {},
) => {
  const date = toDate(value);
  if (!date) return options.emptyLabel ?? null;
  return isMidnightUtc(date)
    ? DATE_FORMATTER.format(date)
    : DATE_TIME_FORMATTER.format(date);
};

export const formatConfirmationDateRange = (
  startAt: string | null | undefined,
  endAt: string | null | undefined,
  options: {
    emptyLabel?: string | null;
  } = {},
) => {
  const start = toDate(startAt);
  const end = toDate(endAt);

  if (!start && !end) return options.emptyLabel ?? null;
  if (!start) return formatConfirmationDateTime(endAt, options);
  if (!end) return formatConfirmationDateTime(startAt, options);

  const startHasTime = !isMidnightUtc(start);
  const endHasTime = !isMidnightUtc(end);

  if (!startHasTime && !endHasTime) {
    const startLabel = DATE_FORMATTER.format(start);
    const endLabel = DATE_FORMATTER.format(end);
    return startLabel === endLabel ? startLabel : `${startLabel} to ${endLabel}`;
  }

  if (isSameUtcDay(start, end)) {
    return `${DATE_FORMATTER.format(start)} · ${TIME_FORMATTER.format(start)} to ${TIME_FORMATTER.format(end)}`;
  }

  return `${DATE_TIME_FORMATTER.format(start)} to ${DATE_TIME_FORMATTER.format(end)}`;
};
