Array.prototype.toClean = function(toLower) {
  if(!this) return [];
  if (!toLower) {
    return this.map(s => s.trim().replace(/ +/g, "-"));
  }

  return this.map(s => s.trim().replace(/ +/g, "-").toLowerCase());
}
