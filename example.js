'use strict';

const glob = require('./src');

let pattern = '@(src|test)/+([fa]ixtures|test)/*.*';

console.log(glob(pattern))
