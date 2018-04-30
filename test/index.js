const fs = require('fs');
const test = require('tape');
const globrex = require('../');
const isWin = process.platform === 'win32';

const g = (glob, str, opts) => globrex(glob, opts).regex.test(str);

function match(t, pattern, ifUnix, ifWin, opts) {
   let res = globrex(pattern, opts);
   let { regex } = (opts.filepath ? res.path : res);
   console.log(res);
   console.log(regex);
   t.is(regex.toString(), isWin ? ifWin : ifUnix, '~> regex matches expectant');
   return res;
}

test('globrex: standard', t => {
   t.plan(3);
   let res = globrex('*.js');
   t.equal(typeof globrex, 'function', 'consturctor is a typeof function');
   t.equal(res instanceof Object, true, 'returns object');
   t.equal(res.regex.toString(), '/^.*\\.js$/', 'returns regex object');
   //t.equal(Array.isArray(res.segments), true, 'returns array of segments');
});

test('globrex: Standard * matching', t => {
   t.plan(12);

   t.equal(g('*', 'foo'), true, 'match everything');
   t.equal(g('*', 'foo', { flags:'g' }), true, 'match everything');

   t.equal(g('f*', 'foo'), true, 'match the end');
   t.equal(g('f*', 'foo', { flags:'g' }), true, 'match the end');

   t.equal(g('*o', 'foo'), true, 'match the start');
   t.equal(g('*o', 'foo', { flags:'g' }), true, 'match the start');

   t.equal(g('f*uck', 'firetruck'), true, 'match the middle');
   t.equal(g('f*uck', 'firetruck', { flags:'g' }), true, 'match the middle');

   t.equal(g('uc', 'firetruck'), false, 'do not match without g');
   t.equal(g('uc', 'firetruck'), false, 'match anywhere with RegExp "g"');

   t.equal(g('f*uck', 'fuck'), true, 'match zero characters');
   t.equal(g('f*uck', 'fuck', { flags:'g' }), true, 'match zero characters');
});

test('globrex: advance * matching', t => {
   t.plan(21);

   t.equal(g('*.min.js', 'http://example.com/jquery.min.js', { globstar:false }), true, 'complex match');
   t.equal(g('*.min.*', 'http://example.com/jquery.min.js', { globstar:false }), true, 'complex match');
   t.equal(g('*/js/*.js', 'http://example.com/js/jquery.min.js', { globstar:false }), true, 'complex match');

   t.equal(g('*.min.*', 'http://example.com/jquery.min.js', { flags:'g' }), true, 'complex match global');
   t.equal(g('*.min.js', 'http://example.com/jquery.min.js', { flags:'g' }), true, 'complex match global');
   t.equal(g('*/js/*.js', 'http://example.com/js/jquery.min.js', { flags:'g' }), true, 'complex match global');

   const testStr = '\\/$^+?.()=!|{},[].*';
   t.equal(g(testStr, testStr), true, 'battle test complex string - strict');
   t.equal(g(testStr, testStr, { flags:'g' }), true, 'battle test complex string - strict');

   t.equal(g('.min.', 'http://example.com/jquery.min.js'), false, 'matches without/with using RegExp "g"');
   t.equal(g('*.min.*', 'http://example.com/jquery.min.js'), true, 'matches without/with using RegExp "g"');
   t.equal(g('.min.', 'http://example.com/jquery.min.js', { flags:'g' }), true, 'matches without/with using RegExp "g"');

   t.equal(g('http:', 'http://example.com/jquery.min.js'), false, 'matches without/with using RegExp "g"');
   t.equal(g('http:*', 'http://example.com/jquery.min.js'), true, 'matches without/with using RegExp "g"');
   t.equal(g('http:', 'http://example.com/jquery.min.js', { flags:'g' }), true, 'matches without/with using RegExp "g"');

   t.equal(g('min.js', 'http://example.com/jquery.min.js'), false, 'matches without/with using RegExp "g"');
   t.equal(g('*.min.js', 'http://example.com/jquery.min.js'), true, 'matches without/with using RegExp "g"');
   t.equal(g('min.js', 'http://example.com/jquery.min.js', { flags:'g' }), true, 'matches without/with using RegExp "g"');

   t.equal(g('min', 'http://example.com/jquery.min.js', { flags:'g' }), true, 'match anywhere (globally) using RegExp "g"');
   t.equal(g('/js/', 'http://example.com/js/jquery.min.js', { flags:'g' }), true, 'match anywhere (globally) using RegExp "g"');

   t.equal(g('/js*jq*.js', 'http://example.com/js/jquery.min.js'), false);
   t.equal(g('/js*jq*.js', 'http://example.com/js/jquery.min.js', { flags:'g' }), true);
});

test('globrex: ? match one character, no more and no less', t => {
   t.plan(15);

   t.equal(g('f?o', 'foo', { extended:true }), true)
   t.equal(g('f?o', 'fooo', { extended:true }), false)
   t.equal(g('f?oo', 'foo', { extended:true }), false)

   const tester = globstar => {
      t.equal(g('f?o', 'foo', { extended:true, globstar, flags:'g' }), true)
      t.equal(g('f?o', 'fooo', { extended:true, globstar, flags:'g' }), true)
      t.equal(g('f?o?', 'fooo', { extended:true, globstar, flags:'g' }), true)

      t.equal(g('?fo', 'fooo', { extended:true, globstar, flags:'g' }), false)
      t.equal(g('f?oo', 'foo', { extended:true, globstar, flags:'g' }), false)
      t.equal(g('foo?', 'foo', { extended:true, globstar, flags:'g' }), false)
   }

   tester(true);
   tester(false);
});

test('globrex: [] match a character range', t => {
   t.plan(13);

   t.equal(g('fo[oz]', 'foo', { extended:true }), true);
   t.equal(g('fo[oz]', 'foz', { extended:true }), true);
   t.equal(g('fo[oz]', 'fog', { extended:true }), false);

   t.equal(g('fo[a-z]', 'fob', { extended:true }), true);
   t.equal(g('fo[a-d]', 'fot', { extended:true }), false);

   t.equal(g('fo[!tz]', 'fot', { extended:true }), false);
   t.equal(g('fo[!tz]', 'fob', { extended:true }), true);

   const tester = globstar => {
      t.equal(g('fo[oz]', 'foo', { extended:true, globstar, flags:'g' }), true);
      t.equal(g('fo[oz]', 'foz', { extended:true, globstar, flags:'g' }), true);
      t.equal(g('fo[oz]', 'fog', { extended:true, globstar, flags:'g' }), false);
   }

   tester(true);
   tester(false);
})

test('globrex: [] extended character ranges', t => {
   t.plan(13);

   t.equal(g('[[:alnum:]]/bar.txt', 'a/bar.txt', { extended:true }), true);
   t.equal(g('@([[:alnum:]abc]|11)/bar.txt', '11/bar.txt', { extended:true }), true);
   t.equal(g('@([[:alnum:]abc]|11)/bar.txt', 'a/bar.txt', { extended:true }), true);
   t.equal(g('@([[:alnum:]abc]|11)/bar.txt', 'b/bar.txt', { extended:true }), true);
   t.equal(g('@([[:alnum:]abc]|11)/bar.txt', 'c/bar.txt', { extended:true }), true);
   t.equal(g('@([[:alnum:]abc]|11)/bar.txt', 'abc/bar.txt', { extended:true }), false);
   t.equal(g('@([[:alnum:]abc]|11)/bar.txt', '3/bar.txt', { extended:true }), true);

   t.equal(g('[[:digit:]]/bar.txt', '1/bar.txt', { extended:true }), true);
   t.equal(g('[[:digit:]b]/bar.txt', 'b/bar.txt', { extended:true }), true);
   t.equal(g('[![:digit:]b]/bar.txt', 'a/bar.txt', { extended:true }), true);

   t.equal(g('[[:alnum:]]/bar.txt', '!/bar.txt', { extended:true }), false);
   t.equal(g('[[:digit:]]/bar.txt', 'a/bar.txt', { extended:true }), false);
   t.equal(g('[[:digit:]b]/bar.txt', 'a/bar.txt', { extended:true }), false);
});

test('globrex: {} match a choice of different substrings', t => {
   t.plan(12);

   t.equal(g('foo{bar,baaz}', 'foobaaz', { extended:true }), true);
   t.equal(g('foo{bar,baaz}', 'foobar', { extended:true }), true);
   t.equal(g('foo{bar,baaz}', 'foobuzz', { extended:true }), false);
   t.equal(g('foo{bar,b*z}', 'foobuzz', { extended: true }), true);

   const tester = globstar => {
      t.equal(g('foo{bar,baaz}', 'foobaaz', { extended:true, globstar, flag:'g' }), true);
      t.equal(g('foo{bar,baaz}', 'foobar', { extended:true, globstar, flag:'g' }), true);
      t.equal(g('foo{bar,baaz}', 'foobuzz', { extended:true, globstar, flag:'g' }), false);
      t.equal(g('foo{bar,b*z}', 'foobuzz', { extended:true, globstar, flag:'g'}), true);
   }

   tester(true);
   tester(false);
});

test('globrex: complex extended matches', t => {
   t.plan(15)

   t.equal(g('http://?o[oz].b*z.com/{*.js,*.html}', 'http://foo.baaz.com/jquery.min.js', { extended:true }), true);
   t.equal(g('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.buzz.com/index.html', { extended:true }), true);
   t.equal(g('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.buzz.com/index.htm', { extended:true }), false);
   t.equal(g('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.bar.com/index.html', { extended:true }), false);
   t.equal(g('http://?o[oz].b*z.com/{*.js,*.html}', 'http://flozz.buzz.com/index.html', { extended:true }), false);

   const tester = globstar => {
      t.equal(g('http://?o[oz].b*z.com/{*.js,*.html}', 'http://foo.baaz.com/jquery.min.js', { extended:true, globstar, flags:'g' }), true);
      t.equal(g('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.buzz.com/index.html', { extended:true, globstar, flags:'g' }), true);
      t.equal(g('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.buzz.com/index.htm', { extended:true, globstar, flags:'g' }), false);
      t.equal(g('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.bar.com/index.html', { extended:true, globstar, flags:'g' }), false);
      t.equal(g('http://?o[oz].b*z.com/{*.js,*.html}', 'http://flozz.buzz.com/index.html', { extended:true, globstar, flags:'g' }), false);
   }

   tester(true);
   tester(false);
});

test('globrex: standard globstar', t => {
   t.plan(6);

   const tester = globstar => {
      t.equal(g('http://foo.com/**/{*.js,*.html}', 'http://foo.com/bar/jquery.min.js', { extended: true, globstar, flags: 'g' }), true);
      t.equal(g('http://foo.com/**/{*.js,*.html}', 'http://foo.com/bar/baz/jquery.min.js', { extended: true, globstar, flags: 'g' }), true);
      t.equal(g('http://foo.com/**', 'http://foo.com/bar/baz/jquery.min.js', { extended: true, globstar, flags: 'g' }), true);
   }

   tester(true);
   tester(false);
});

test('globrex: remaining chars should match themself', t => {
   t.plan(4);

   const tester = globstar => {
      const testExtStr = '\\/$^+.()=!|,.*';
      t.equal(g(testExtStr, testExtStr, { extended:true }), true);
      t.equal(g(testExtStr, testExtStr, { extended:true, globstar, flags: 'g' }), true);
   }

   tester(true);
   tester(false);
});

test('globrex: globstar advance testing', t => {
   t.plan(36);

   t.equal(g('/foo/*', '/foo/bar.txt', { globstar:true }), true);
   t.equal(g('/foo/**', '/foo/bar.txt', { globstar:true }), true);
   t.equal(g('/foo/**', '/foo/bar/baz.txt', { globstar:true }), true);
   t.equal(g('/foo/**', '/foo/bar/baz.txt', { globstar:true }), true);
   t.equal(g('/foo/*/*.txt', '/foo/bar/baz.txt', { globstar:true }), true);
   t.equal(g('/foo/**/*.txt', '/foo/bar/baz.txt', { globstar:true }), true);
   t.equal(g('/foo/**/*.txt', '/foo/bar/baz/qux.txt', { globstar:true }), true);
   t.equal(g('/foo/**/bar.txt', '/foo/bar.txt', { globstar:true }), true);
   t.equal(g('/foo/**/**/bar.txt', '/foo/bar.txt', { globstar:true }), true);
   t.equal(g('/foo/**/*/baz.txt', '/foo/bar/baz.txt', { globstar:true }), true);
   t.equal(g('/foo/**/*.txt', '/foo/bar.txt', { globstar:true }), true);
   t.equal(g('/foo/**/**/*.txt', '/foo/bar.txt', { globstar:true }), true);
   t.equal(g('/foo/**/*/*.txt', '/foo/bar/baz.txt', { globstar:true }), true);
   t.equal(g('**/*.txt', '/foo/bar/baz/qux.txt', { globstar:true }), true);
   t.equal(g('**/foo.txt', 'foo.txt', { globstar:true }), true);
   t.equal(g('**/*.txt', 'foo.txt', { globstar:true }), true);

   t.equal(g('/foo/*', '/foo/bar/baz.txt', { globstar:true }), false);
   t.equal(g('/foo/*.txt', '/foo/bar/baz.txt', { globstar:true }), false);
   t.equal(g('/foo/*/*.txt', '/foo/bar/baz/qux.txt', { globstar:true }), false);
   t.equal(g('/foo/*/bar.txt', '/foo/bar.txt', { globstar:true }), false);
   t.equal(g('/foo/*/*/baz.txt', '/foo/bar/baz.txt', { globstar:true }), false);
   t.equal(g('/foo/**.txt', '/foo/bar/baz/qux.txt', { globstar:true }), false);
   t.equal(g('/foo/bar**/*.txt', '/foo/bar/baz/qux.txt', { globstar:true }), false);
   t.equal(g('/foo/bar**', '/foo/bar/baz.txt', { globstar:true }), false);
   t.equal(g('**/.txt', '/foo/bar/baz/qux.txt', { globstar:true }), false);
   t.equal(g('*/*.txt', '/foo/bar/baz/qux.txt', { globstar:true }), false);
   t.equal(g('*/*.txt', 'foo.txt', { globstar:true }), false);

   t.equal(g('http://foo.com/*', 'http://foo.com/bar/baz/jquery.min.js', { extended: true, globstar: true }), false);
   t.equal(g('http://foo.com/*', 'http://foo.com/bar/baz/jquery.min.js', { globstar: true }), false);

   t.equal(g('http://foo.com/*', 'http://foo.com/bar/baz/jquery.min.js', { globstar: false }), true);
   t.equal(g('http://foo.com/**', 'http://foo.com/bar/baz/jquery.min.js', { globstar: true }), true);

   t.equal(g("http://foo.com/*/*/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js", { globstar: true }), true);
   t.equal(g("http://foo.com/**/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js", { globstar: true }), true);

   t.equal(g("http://foo.com/*/*/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js", { globstar: false }), true);
   t.equal(g("http://foo.com/*/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js", { globstar: false }), true);
   t.equal(g("http://foo.com/*/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js", { globstar: true }), false);
});

test('globrex: extended extglob ?', t => {
   t.plan(17);

   // Matches zero or ONE occurrence of the given patterns.

   // if no sign, match litteral
   t.equal(g('(foo).txt', '(foo).txt', { extended:true }), true);

   t.equal(g('?(foo).txt', 'foo.txt', { extended:true }), true);
   t.equal(g('?(foo).txt', '.txt', { extended:true }), true);
   t.equal(g('?(foo|bar)baz.txt', 'foobaz.txt', { extended:true }), true);

   t.equal(g('?(ba[zr]|qux)baz.txt', 'bazbaz.txt', { extended:true }), true);
   t.equal(g('?(ba[zr]|qux)baz.txt', 'barbaz.txt', { extended:true }), true);
   t.equal(g('?(ba[zr]|qux)baz.txt', 'quxbaz.txt', { extended:true }), true);
   t.equal(g('?(ba[!zr]|qux)baz.txt', 'batbaz.txt', { extended:true }), true);

   t.equal(g('?(ba*|qux)baz.txt', 'batbaz.txt', { extended:true }), true);
   t.equal(g('?(ba*|qux)baz.txt', 'batttbaz.txt', { extended:true }), true);
   t.equal(g('?(ba*|qux)baz.txt', 'quxbaz.txt', { extended:true }), true);

   t.equal(g('?(ba?(z|r)|qux)baz.txt', 'bazbaz.txt', { extended:true }), true);
   t.equal(g('?(ba?(z|?(r))|qux)baz.txt', 'bazbaz.txt', { extended:true }), true);

   t.equal(g('?(foo).txt', 'foo.txt', { extended:false }), false);
   t.equal(g('?(foo|bar)baz.txt', 'foobarbaz.txt', { extended:true }), false);
   t.equal(g('?(ba[zr]|qux)baz.txt', 'bazquxbaz.txt', { extended:true }), false);
   t.equal(g('?(ba[!zr]|qux)baz.txt', 'bazbaz.txt', { extended:true }), false);
});

test('globrex: extended extglob *', t => {
   t.plan(16);

   // Matches zero or MORE occurrences of the given patterns.

   t.equal(g('*(foo).txt', 'foo.txt', { extended:true }), true);
   t.equal(g('*foo.txt', 'bofoo.txt', { extended:true }), true);
   t.equal(g('*(foo).txt', 'foofoo.txt', { extended:true }), true);
   t.equal(g('*(foo).txt', '.txt', { extended:true }), true);

   t.equal(g('*(fooo).txt', '.txt', { extended:true }), true);
   t.equal(g('*(fooo).txt', 'foo.txt', { extended:true }), false);

   t.equal(g('*(foo|bar).txt', 'foobar.txt', { extended:true }), true);
   t.equal(g('*(foo|bar).txt', 'barbar.txt', { extended:true }), true);
   t.equal(g('*(foo|bar).txt', 'barfoobar.txt', { extended:true }), true);
   t.equal(g('*(foo|bar).txt', '.txt', { extended:true }), true);
   t.equal(g('*(foo|ba[rt]).txt', 'bat.txt', { extended:true }), true);

   t.equal(g('*(foo|b*[rt]).txt', 'blat.txt', { extended:true }), true);
   t.equal(g('*(foo|b*[rt]).txt', 'tlat.txt', { extended:true }), false);

   t.equal(g('*(*).txt', 'whatever.txt', { extended:true, globstar:true }), true);
   t.equal(g('*(foo|bar)/**/*.txt', 'foo/hello/world/bar.txt', { extended:true, globstar:true }), true);
   t.equal(g('*(foo|bar)/**/*.txt', 'foo/world/bar.txt', { extended:true, globstar: true }), true);
});

test('globrex: extended extglob +', t => {
   t.plan(4);
   // Matches one or more occurrences of the given patterns.
   t.equal(g('+(foo).txt', 'foo.txt', { extended:true }), true);
   t.equal(g('+foo.txt', '+foo.txt', { extended:true }), true);
   t.equal(g('+(foo).txt', '.txt', { extended:true }), false);
   t.equal(g('+(foo|bar).txt', 'foobar.txt', { extended:true }), true);
});

test('globrex: extended extglob @', t => {
   t.plan(6);
   // Matches one of the given patterns.
   t.equal(g('@(foo).txt', 'foo.txt', { extended:true }), true);
   t.equal(g('@foo.txt', '@foo.txt', { extended:true }), true);
   t.equal(g('@(foo|baz)bar.txt', 'foobar.txt', { extended:true }), true);
   t.equal(g('@(foo|baz)bar.txt', 'foobazbar.txt', { extended:true }), false);
   t.equal(g('@(foo|baz)bar.txt', 'foofoobar.txt', { extended:true }), false);
   t.equal(g('@(foo|baz)bar.txt', 'toofoobar.txt', { extended:true }), false);
});

test('globrex: extended extglob !', t => {
   t.plan(5);
   // Matches anything except one of the given patterns.
   t.equal(g('!(boo).txt', 'foo.txt', { extended: true }), true);
   t.equal(g('!(foo|baz)bar.txt', 'buzbar.txt', { extended: true }), true);
   t.equal(g('!bar.txt', '!bar.txt', { extended: true }), true);
   t.equal(g('!({foo,bar})baz.txt', 'notbaz.txt', { extended: true }), true);
   t.equal(g('!({foo,bar})baz.txt', 'foobaz.txt', { extended: true }), false);
});


test('globrex: strict', t => {
   t.plan(3);

   t.equal(g('foo//bar.txt', 'foo/bar.txt'), true);
   t.equal(g('foo///bar.txt', 'foo/bar.txt'), true);
   t.equal(g('foo///bar.txt', 'foo/bar.txt', { strict:true }), false);
});


test('globrex: filepath path-regex', t => {
   let opts = { extended:true, filepath:true };

   let res = match(t, 'foo/bar/baz.js', '/^foo\\/bar\\/baz\\.js$/', '/^foo\\\\+bar\\\\+baz\\.js$/', opts);
   t.is(`${res.regex}`, '/^foo\\/bar\\/baz\\.js$/');

   // TEST STAR PATTERN
   // UPDATE README

   t.end(); 
})

test('globrex: filepath path segments', t => {
   let opts = { extended:true, filepath:true }, res;

   res = globrex('foo/bar/*/baz.{md,js,txt}', { ...opts, globstar:true });
   t.equal(res.path.segments.join('  '), `/^foo$/  /^bar$/  /^([^\\/]*)$/  /^baz\\.(md|js|txt)$/`);
   //t.equal(`${res.regex}`, `/^foo\\/bar\\/([^\\/]*)\\/baz\\.(md|js|txt)$/`);

   res = globrex('foo/*/baz.md', opts);
   t.equal(res.path.segments.join('  '), `/^foo$/  /^.*$/  /^baz\\.md$/`);
   //t.equal(`${res.regex}`, `/^foo\\/.*\\/baz\\.md$/`);

   res = globrex('foo/**/baz.md', opts);
   t.equal(res.path.segments.join('  '), `/^foo$/  /^.*$/  /^baz\\.md$/`);
   //t.equal(`${res.regex}`, `/^foo\\/.*\\/baz\\.md$/`);

   res = globrex('foo/**/baz.md', { ...opts, globstar:true });
   t.equal(res.path.segments.join('  '), `/^foo$/  /^((?:[^\\/]*(?:\\/|$))*)$/  /^baz\\.md$/`);
   //t.equal(`${res.regex}`, `/^foo\\/((?:[^\\/]*(?:\\/|$))*)baz\\.md$/`);

   res = globrex('foo/**/*.md', opts);
   t.equal(res.path.segments.join('  '), `/^foo$/  /^.*$/  /^.*\\.md$/`);
   //t.equal(`${res.regex}`, `/^foo\\/.*\\/.*\\.md$/`);

   res = globrex('foo/**/*.md', { ...opts, globstar:true });
   t.equal(res.path.segments.join('  '), `/^foo$/  /^((?:[^\\/]*(?:\\/|$))*)$/  /^([^\\/]*)\\.md$/`);
   //t.equal(`${res.regex}`, `/^foo\\/((?:[^\\/]*(?:\\/|$))*)([^\\/]*)\\.md$/`);

   res = globrex('foo/:/b:az',  opts);
   t.equal(res.path.segments.join('  '), `/^foo$/  /^:$/  /^b:az$/`);
   //t.equal(`${res.regex}`, `/^foo\\/:\\/b:az$/`);

   res = globrex('foo///baz.md', { ...opts, strict:true });
   t.equal(res.path.segments.join('  '), `/^foo$/  /^baz\\.md$/`);
   //t.equal(`${res.regex}`, `/^foo\\/\\/\\/baz\\.md$/`);

   res = globrex('foo///baz.md', { ...opts, strict:false });
   t.equal(res.path.segments.join('  '), `/^foo$/  /^baz\\.md$/`);
   //t.equal(`${res.regex}`, `/^foo\\/?\\/?\\/baz\\.md$/`);
   
   t.end();
});

/*
test('globrex: path segments option windows', t => {
    t.plan(15);

    const res1 = globrex(`C:\\Users\\foo\\bar\\baz`, { windows:true });
    t.equal(res1.segments.join('  '), `/^C:$/  /^Users$/  /^foo$/  /^bar$/  /^baz$/`);
    t.equal(`${res1.regex}`, `/^C:\\\\Users\\\\foo\\\\bar\\\\baz$/`);
    t.equal(res1.regex.test(`C:\\Users\\foo\\bar\\baz`), true);

    const res2 = globrex(`Users\\foo\\bar\\baz`, { windows:true });
    t.equal(res2.segments.join('  '), `/^Users$/  /^foo$/  /^bar$/  /^baz$/`);
    t.equal(`${res2.regex}`, `/^Users\\\\foo\\\\bar\\\\baz$/`);

    const res3 = globrex(`Users\\foo\\bar.{md,js}`, { windows:true, extended:true });
    t.equal(res3.segments.join('  '), `/^Users$/  /^foo$/  /^bar\\.(md|js)$/`);
    t.equal(`${res3.regex}`, `/^Users\\\\foo\\\\bar\\.(md|js)$/`);
    t.equal(res3.regex.test(`Users\\foo\\bar.js`), true);
    t.equal(res3.regex.test(`Users\\foo\\bar.mp3`), false);

    const res4 = globrex(`Users\\\\foo\\bar.{md,js}`, { windows:true, extended:true, strict:false });
    t.equal(res4.segments.join('  '), `/^Users$/  /^foo$/  /^bar\\.(md|js)$/`);
    t.equal(`${res4.regex}`, `/^Users\\\\?\\\\foo\\\\bar\\.(md|js)$/`);

    const res5 = globrex(`Users\\\\foo\\bar.{md,js}`, { windows:true, extended:true, strict:true });
    t.equal(res5.segments.join('  '), `/^Users$/  /^foo$/  /^bar\\.(md|js)$/`);
    t.equal(`${res5.regex}`, `/^Users\\\\\\\\foo\\\\bar\\.(md|js)$/`);

    const res6 = globrex(`/Users\\\\foo\\bar.{md,js}`, { windows:true, extended:true });
    t.equal(res6.segments.join('  '), `/^\\/Users$/  /^foo$/  /^bar\\.(md|js)$/`);
    t.equal(`${res6.regex}`, `/^\\/Users\\\\?\\\\foo\\\\bar\\.(md|js)$/`);
});
*/

test('globrex: stress testing', t => {
   t.plan(8);

   t.equal(g('**/*/?yfile.{md,js,txt}', 'foo/bar/baz/myfile.md', { extended:true }), true);
   t.equal(g('**/*/?yfile.{md,js,txt}', 'foo/baz/myfile.md', { extended:true }), true);
   t.equal(g('**/*/?yfile.{md,js,txt}', 'foo/baz/tyfile.js', { extended:true }), true);

   t.equal(g('[[:digit:]_.]/file.js', '1/file.js', { extended:true }), true);
   t.equal(g('[[:digit:]_.]/file.js', '2/file.js', { extended:true }), true);
   t.equal(g('[[:digit:]_.]/file.js', '_/file.js', { extended:true }), true);
   t.equal(g('[[:digit:]_.]/file.js', './file.js', { extended:true }), true);
   t.equal(g('[[:digit:]_.]/file.js', 'z/file.js', { extended:true }), false);
});
