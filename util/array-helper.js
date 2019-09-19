if (!Array.prototype.clean){
  Array.prototype.clean = function(toLower) {
    'use strict';

    if(!this) return [];

    const arr = this.map(s => s.trim().replace(/ +/g, "-"));

    if (!toLower) return arr;

    return arr.toLowerCase();
  }
}