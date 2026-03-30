/**
 * تنسيق التاريخ والوقت بتوقيت السعودية
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    const options = {
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    const formatted = d.toLocaleString('en-CA', options);
    return formatted.replace(',', '');
  } catch (e) {
    console.error('Date formatting error:', e);
    return String(date);
  }
};

/**
 * تنسيق التاريخ فقط
 */
export const formatDate = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    const options = { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' };
    return d.toLocaleDateString('en-CA', options);
  } catch (e) {
    return String(date);
  }
};

/**
 * تنسيق الوقت فقط
 */
export const formatTime = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    const options = { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    return d.toLocaleTimeString('en-US', options);
  } catch (e) {
    return String(date);
  }
};

/**
 * الوقت الحالي بصيغة ISO
 */
export const now = () => {
  return new Date().toISOString();
};