if (!Array.prototype.clean) {
  Array.prototype.clean = function(toLower) {
    'use strict';

    if (!this) return [];

    return toLower
      ? this.map(s =>
          s
            .trim()
            .replace(/ +/g, '-')
            .toLowerCase()
        )
      : this.map(s => s.trim().replace(/ +/g, '-'));
  };
}
