const moment = require('moment-timezone');

const timezone = 'Asia/Riyadh';

const toLocal = (date) => {
  if (!date) return null;
  return moment(date).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
};

const now = () => {
  return moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss');
};

const startOfDayUTC = () => {
  return moment().tz(timezone).startOf('day').utc().format('YYYY-MM-DD HH:mm:ss');
};

const endOfDayUTC = () => {
  return moment().tz(timezone).endOf('day').utc().format('YYYY-MM-DD HH:mm:ss');
};

const localToUTC = (localDate, time = '00:00:00') => {
  if (!localDate) return null;
  return moment.tz(`${localDate} ${time}`, timezone).utc().format('YYYY-MM-DD HH:mm:ss');
};

const utcToLocalDate = (utcDate) => {
  if (!utcDate) return null;
  return moment.utc(utcDate).tz(timezone).toDate();
};

const startOfMonthUTC = () => {
  return moment().tz(timezone).startOf('month').utc().format('YYYY-MM-DD HH:mm:ss');
};

const startOfWeekUTC = () => {
  return moment().tz(timezone).startOf('week').utc().format('YYYY-MM-DD HH:mm:ss');
};

const getMomentInTimezone = () => {
  return moment().tz(timezone);
};

module.exports = {
  toLocal,
  now,
  startOfDayUTC,
  endOfDayUTC,
  localToUTC,
  utcToLocalDate,
  startOfMonthUTC,
  startOfWeekUTC,
  getMomentInTimezone
};