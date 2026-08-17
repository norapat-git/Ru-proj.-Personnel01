const formatDateBind = (val) => {
  if (!val || val === 'null' || val === 'undefined') return null;
  const str = String(val).trim();
  if (!str) return null;
  const iso = str.substring(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return null;
};

const parseNum = (val) => {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (str === '' || str === 'null' || str === 'undefined') return null;
  const n = Number(str);
  return isNaN(n) ? null : n;
};

const parseStr = (val, maxLen) => {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (str === '' || str === 'null' || str === 'undefined') return null;
  return maxLen ? str.substring(0, maxLen) : str;
};

const parseStrBytes = (val, maxBytes) => {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (str === '' || str === 'null' || str === 'undefined') return null;
  if (!maxBytes) return str;
  let bytes = 0;
  let resultStr = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    let charBytes = 1;
    if (charCode > 0x7f && charCode <= 0x7ff) {
      charBytes = 2;
    } else if (charCode > 0x7ff && charCode <= 0xffff) {
      charBytes = 3;
    } else if (charCode > 0xffff) {
      charBytes = 4;
    }
    if (bytes + charBytes > maxBytes) break;
    bytes += charBytes;
    resultStr += str[i];
  }
  return resultStr || null;
};

module.exports = {
  formatDateBind,
  parseNum,
  parseStr,
  parseStrBytes,
};
