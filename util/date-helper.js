String.prototype.toFixDateTime = function() {
  const noDate = '';
  
  if(!this) return noDate;

  if (this.startsWith('-')) {
    return noDate;
  }
  const dateTime = this.split('T');
  const date = dateTime[0].split('-');

  if (!date[0] || !date[1] || !date[2] || date[0] === '0' || date[1] === '0' || date[2] === '0') {
    return noDate;
  }
  const newDate = `${fixYear(date[0])}-${padZero(date[1],2)}-${padZero(date[2],2)}T${dateTime[1]}`;
  return newDate;
}

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
