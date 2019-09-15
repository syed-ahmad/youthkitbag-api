function padZero(value, size) {
  const s = '00000' + value;
  return s.substr(s.length - size);
}

function fixYear(value) {
  const y = +value;
  if (y < 25) {
    return y + 2000; 
  } else if (y < 100) {
    return y  + 1900;
  }
  return y;
}

exports.fixDateTime = (dateTimeValue) => {
  if (dateTimeValue.startsWith('-')) {
    return undefined;
  }
  const dateTime = dateTimeValue.split('T');
  const date = dateTime[0].split('-');
  if (!date[0] || !date[1] || !date[2]) {
    return undefined;
  }
  return `${fixYear(date[0])}-${padZero(date[1],2)}-${padZero(date[2],2)}T${dateTime[1]}`;
}