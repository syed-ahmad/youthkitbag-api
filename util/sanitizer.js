// express-validator custom sanitizers

// string array fields can be passed into api either as a csv string or as an array of strings
// this ensure that these elements are properly converted to an array (clean up is done per item)
exports.commaToArray = value => {
  if (value === undefined) return [];

  if (Array.isArray(value)) {
    return value.filter(item => item.trim().length > 0);
  }

  return value.split(',').filter(item => item.trim().length > 0);
};

exports.caseTagFormat = value => value.trim().replace(/ +/g, '-');

exports.lowTagFormat = value =>
  value
    .trim()
    .replace(/ +/g, '-')
    .toLowerCase();

exports.lower = value => value.toLowerCase();

exports.dateFormat = value => {
  function padZero(value, size) {
    const s = '00000' + value;
    return s.substr(s.length - size);
  }

  function fixYear(value) {
    const y = +value;
    if (y < 25) {
      return y + 2000;
    } else if (y < 100) {
      return y + 1900;
    }
    return y;
  }

  const noDate = '';

  if (!value) return noDate;

  if (value.startsWith('-')) return noDate;

  const dateTime = value.split('T');
  const date = dateTime[0].split('-');

  if (
    !date[0] ||
    !date[1] ||
    !date[2] ||
    date[0] === '0' ||
    date[1] === '0' ||
    date[2] === '0'
  )
    return noDate;

  return `${fixYear(date[0])}-${padZero(date[1], 2)}-${padZero(date[2], 2)}T${
    dateTime[1]
  }`;
};
