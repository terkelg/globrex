const globrex = require('../../');
const isWin = process.platform === 'win32';

function match(glob, strUnix, strWin, opts = {}) {
   if (typeof strWin === 'object') {
      opts = strWin;
      strWin = false;
   }
   let res = globrex(glob, opts);
   return res.regex.test(isWin && strWin ? strWin : strUnix);
}

function matchRegex(t, pattern, ifUnix, ifWin, opts) {
   const res = globrex(pattern, opts);
   const {regex} = (opts.filepath ? res.path : res);
   t.is(regex.toString(), isWin ? ifWin : ifUnix, '~> regex matches expectant');
   return res;
}

function matchSegments(t, pattern, ifUnix, ifWin, opts) {
   const res = globrex(pattern, {filepath:true, ...opts});
   const str = res.path.segments.join(' ');
   const exp = (isWin ? ifWin : ifUnix).join(' ');
   t.is(str, exp);
   return res;
}

module.exports = { match, matchRegex, matchSegments };
