const toDate = new Date();

// Helper function
const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

const last7DaysFrom = new Date();
last7DaysFrom.setDate(toDate.getDate() - 7);

export const last7Days = {
  from: formatDate(last7DaysFrom),
  to: formatDate(toDate),
};

const last1MonthFrom = new Date();
last1MonthFrom.setMonth(toDate.getMonth() - 1);

export const last1Month = {
  from: formatDate(last1MonthFrom),
  to: formatDate(toDate),
};

const last6MonthsFrom = new Date();
last6MonthsFrom.setMonth(toDate.getMonth() - 6);

export const last6Months = {
  from: formatDate(last6MonthsFrom),
  to: formatDate(toDate),
};
