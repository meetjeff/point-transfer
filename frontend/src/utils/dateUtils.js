/**
 * 日期時間工具函數
 */

/**
 * 將ISO格式的時間字符串轉換為用戶本地時區的可讀格式
 * @param {string} isoString - ISO格式的時間字符串
 * @param {Object} options - Intl.DateTimeFormat 選項
 * @returns {string} 格式化後的本地時間字符串
 */
export const formatLocalTime = (isoString, options = {}) => {
  if (!isoString) return '';

  const date = new Date(isoString);

  // 預設選項
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  // 合併選項
  const formatterOptions = { ...defaultOptions, ...options };

  try {
    // 使用 Intl.DateTimeFormat 根據用戶瀏覽器的語言和時區設置格式化日期
    const formatter = new Intl.DateTimeFormat(undefined, formatterOptions);
    return formatter.format(date);
  } catch (error) {
    console.error('日期格式化錯誤:', error);
    // 備用方案
    return date.toLocaleString();
  }
};

/**
 * 計算並返回相對時間（如"3分鐘前"，"2小時前"等）
 * @param {string} isoString - ISO格式的時間字符串
 * @returns {string} 相對時間字符串
 */
export const getRelativeTime = (isoString) => {
  if (!isoString) return '';

  const date = new Date(isoString);
  const now = new Date();
  const diffSeconds = Math.floor((now - date) / 1000);

  if (diffSeconds < 60) return `${diffSeconds} 秒前`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} 分鐘前`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} 小時前`;
  if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)} 天前`;

  // 超過30天則顯示具體日期
  return formatLocalTime(isoString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * 判斷時間是否已過期
 * @param {string} isoString - ISO格式的時間字符串
 * @returns {boolean} 是否已過期
 */
export const isExpired = (isoString) => {
  if (!isoString) return false;
  const date = new Date(isoString);
  return date < new Date();
};
