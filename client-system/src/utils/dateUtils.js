/**
 * 日期格式化工具函数
 * @param {Date} date 日期对象
 * @param {string} fmt 格式化字符串，例如：'yyyy-MM-dd HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, fmt) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'H+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    'S': date.getMilliseconds()
  };
  
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      );
    }
  }
  
  return fmt;
} 