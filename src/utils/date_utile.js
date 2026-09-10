// utils/dateUtils.js

const getFormattedDate = (date) => {
  return date.toISOString().split("T")[0];
};

// Last 7 Days
const last7DaysFrom = new Date();
last7DaysFrom.setDate(last7DaysFrom.getDate() - 7);

export const last7Days = {
  from: new Date(last7DaysFrom.setHours(0, 0, 0, 0)),
  to: new Date(new Date().setHours(23, 59, 59, 999)),
};

// Last 1 Month
const last1MonthFrom = new Date();
last1MonthFrom.setMonth(last1MonthFrom.getMonth() - 1);

export const last1Month = {
  from: new Date(last1MonthFrom.setHours(0, 0, 0, 0)),
  to: new Date(new Date().setHours(23, 59, 59, 999)),
};

// Last 6 Months
const last6MonthsFrom = new Date();
last6MonthsFrom.setMonth(last6MonthsFrom.getMonth() - 6);

export const last6Months = {
  from: new Date(last6MonthsFrom.setHours(0, 0, 0, 0)),
  to: new Date(new Date().setHours(23, 59, 59, 999)),
};

// Optional formatted versions
export const formattedDates = {
  last7Days: {
    from: getFormattedDate(last7Days.from),
    to: getFormattedDate(last7Days.to),
  },
  last1Month: {
    from: getFormattedDate(last1Month.from),
    to: getFormattedDate(last1Month.to),
  },
  last6Months: {
    from: getFormattedDate(last6Months.from),
    to: getFormattedDate(last6Months.to),
  },
};