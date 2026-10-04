/**
 * Formats a byte number into a human-readable string (e.g. 1.5 MB, 320 KB).
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
