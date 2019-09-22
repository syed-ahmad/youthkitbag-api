// express-validator custom sanitizers

// string array fields can be passed into api either as a csv string or as an array of strings
// this ensure that these elements are properly converted to an array (clean up is done per item)
exports.commaToArray = value => {
  if (value === undefined) return [];
  
  if (Array.isArray(value)) {
    return value.filter(item => item.trim().length > 0);
  }

  return value.split(',').filter(item => item.trim().length > 0);
}

exports.caseTagFormat = value => value.trim().replace(/ +/g, "-");

exports.lowTagFormat = value => value.trim().replace(/ +/g, "-").toLowerCase();

exports.lower = value => value.toLowerCase();
