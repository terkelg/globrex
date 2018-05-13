const fs = require('fs');
const test = require('tape');
const globrex = require('../');
const {match, matchRegex, matchSegments} = require('./helpers');

test('globrex: standard', t => {
   t.plan(3);
   let res = globrex('*.js');
   t.equal(typeof globrex, 'function', 'consturctor is a typeof function');
   t.equal(res instanceof Object, true, 'returns object');
   t.equal(res.regex.toString(), '/^.*\\.js$/', 'returns regex object');
});

test('globrex: Standard * matching', t => {
   t.plan(12);
   t.equal(match('*', 'foo'), true, 'match everything');
   t.equal(match('*', 'foo', { flags:'g' }), true, 'match everything');
   t.equal(match('f*', 'foo'), true, 'match the end');
   t.equal(match('f*', 'foo', { flags:'g' }), true, 'match the end');
   t.equal(match('*o', 'foo'), true, 'match the start');
   t.equal(match('*o', 'foo', { flags:'g' }), true, 'match the start');
   t.equal(match('f*uck', 'firetruck'), true, 'match the middle');
   t.equal(match('f*uck', 'firetruck', { flags:'g' }), true, 'match the middle');
   t.equal(match('uc', 'firetruck'), false, 'do not match without g');
   t.equal(match('uc', 'firetruck', { flags:'g' }), true, 'match anywhere with RegExp "g"');
   t.equal(match('f*uck', 'fuck'), true, 'match zero characters');
   t.equal(match('f*uck', 'fuck', { flags:'g' }), true, 'match zero characters');
});

test('globrex: advance * matching', t => {
   t.plan(21);
   t.equal(match('*.min.js', 'http://example.com/jquery.min.js', { globstar:false }), true, 'complex match');
   t.equal(match('*.min.*', 'http://example.com/jquery.min.js', { globstar:false }), true, 'complex match');
   t.equal(match('*/js/*.js', 'http://example.com/js/jquery.min.js', { globstar:false }), true, 'complex match');
   t.equal(match('*.min.*', 'http://example.com/jquery.min.js', { flags:'g' }), true, 'complex match global');
   t.equal(match('*.min.js', 'http://example.com/jquery.min.js', { flags:'g' }), true, 'complex match global');
   t.equal(match('*/js/*.js', 'http://example.com/js/jquery.min.js', { flags:'g' }), true, 'complex match global');

   const str = '\\/$^+?.()=!|{},[].*';
   t.equal(match(str, str), true, 'battle test complex string - strict');
   t.equal(match(str, str, { flags:'g' }), true, 'battle test complex string - strict');

   t.equal(match('.min.', 'http://example.com/jquery.min.js'), false, 'matches without/with using RegExp "g"');
   t.equal(match('*.min.*', 'http://example.com/jquery.min.js'), true, 'matches without/with using RegExp "g"');
   t.equal(match('.min.', 'http://example.com/jquery.min.js', { flags:'g' }), true, 'matches without/with using RegExp "g"');
   t.equal(match('http:', 'http://example.com/jquery.min.js'), false, 'matches without/with using RegExp "g"');
   t.equal(match('http:*', 'http://example.com/jquery.min.js'), true, 'matches without/with using RegExp "g"');
   t.equal(match('http:', 'http://example.com/jquery.min.js', { flags:'g' }), true, 'matches without/with using RegExp "g"');
   t.equal(match('min.js', 'http://example.com/jquery.min.js'), false, 'matches without/with using RegExp "g"');
   t.equal(match('*.min.js', 'http://example.com/jquery.min.js'), true, 'matches without/with using RegExp "g"');
   t.equal(match('min.js', 'http://example.com/jquery.min.js', { flags:'g' }), true, 'matches without/with using RegExp "g"');
   t.equal(match('min', 'http://example.com/jquery.min.js', { flags:'g' }), true, 'match anywhere (globally) using RegExp "g"');
   t.equal(match('/js/', 'http://example.com/js/jquery.min.js', { flags:'g' }), true, 'match anywhere (globally) using RegExp "g"');
   t.equal(match('/js*jq*.js', 'http://example.com/js/jquery.min.js'), false);
   t.equal(match('/js*jq*.js', 'http://example.com/js/jquery.min.js', { flags:'g' }), true);
});

test('globrex: ? match one character, no more and no less', t => {
   t.plan(15);
   t.equal(match('f?o', 'foo', { extended:true }), true)
   t.equal(match('f?o', 'fooo', { extended:true }), false)
   t.equal(match('f?oo', 'foo', { extended:true }), false)

   const tester = globstar => {
      t.equal(match('f?o', 'foo', { extended:true, globstar, flags:'g' }), true)
      t.equal(match('f?o', 'fooo', { extended:true, globstar, flags:'g' }), true)
      t.equal(match('f?o?', 'fooo', { extended:true, globstar, flags:'g' }), true)

      t.equal(match('?fo', 'fooo', { extended:true, globstar, flags:'g' }), false)
      t.equal(match('f?oo', 'foo', { extended:true, globstar, flags:'g' }), false)
      t.equal(match('foo?', 'foo', { extended:true, globstar, flags:'g' }), false)
   }

   tester(true);
   tester(false);
});

test('globrex: [] match a character range', t => {
   t.plan(13);
   t.equal(match('fo[oz]', 'foo', { extended:true }), true);
   t.equal(match('fo[oz]', 'foz', { extended:true }), true);
   t.equal(match('fo[oz]', 'fog', { extended:true }), false);
   t.equal(match('fo[a-z]', 'fob', { extended:true }), true);
   t.equal(match('fo[a-d]', 'fot', { extended:true }), false);
   t.equal(match('fo[!tz]', 'fot', { extended:true }), false);
   t.equal(match('fo[!tz]', 'fob', { extended:true }), true);

   const tester = globstar => {
      t.equal(match('fo[oz]', 'foo', { extended:true, globstar, flags:'g' }), true);
      t.equal(match('fo[oz]', 'foz', { extended:true, globstar, flags:'g' }), true);
      t.equal(match('fo[oz]', 'fog', { extended:true, globstar, flags:'g' }), false);
   }

   tester(true);
   tester(false);
})

test('globrex: [] extended character ranges', t => {
   t.plan(13);
   t.equal(match('[[:alnum:]]/bar.txt', 'a/bar.txt', { extended:true }), true);
   t.equal(match('@([[:alnum:]abc]|11)/bar.txt', '11/bar.txt', { extended:true }), true);
   t.equal(match('@([[:alnum:]abc]|11)/bar.txt', 'a/bar.txt', { extended:true }), true);
   t.equal(match('@([[:alnum:]abc]|11)/bar.txt', 'b/bar.txt', { extended:true }), true);
   t.equal(match('@([[:alnum:]abc]|11)/bar.txt', 'c/bar.txt', { extended:true }), true);
   t.equal(match('@([[:alnum:]abc]|11)/bar.txt', 'abc/bar.txt', { extended:true }), false);
   t.equal(match('@([[:alnum:]abc]|11)/bar.txt', '3/bar.txt', { extended:true }), true);
   t.equal(match('[[:digit:]]/bar.txt', '1/bar.txt', { extended:true }), true);
   t.equal(match('[[:digit:]b]/bar.txt', 'b/bar.txt', { extended:true }), true);
   t.equal(match('[![:digit:]b]/bar.txt', 'a/bar.txt', { extended:true }), true);
   t.equal(match('[[:alnum:]]/bar.txt', '!/bar.txt', { extended:true }), false);
   t.equal(match('[[:digit:]]/bar.txt', 'a/bar.txt', { extended:true }), false);
   t.equal(match('[[:digit:]b]/bar.txt', 'a/bar.txt', { extended:true }), false);
});

test('globrex: {} match a choice of different substrings', t => {
   t.plan(12);
   t.equal(match('foo{bar,baaz}', 'foobaaz', { extended:true }), true);
   t.equal(match('foo{bar,baaz}', 'foobar', { extended:true }), true);
   t.equal(match('foo{bar,baaz}', 'foobuzz', { extended:true }), false);
   t.equal(match('foo{bar,b*z}', 'foobuzz', { extended:true }), true);

   const tester = globstar => {
      t.equal(match('foo{bar,baaz}', 'foobaaz', { extended:true, globstar, flag:'g' }), true);
      t.equal(match('foo{bar,baaz}', 'foobar', { extended:true, globstar, flag:'g' }), true);
      t.equal(match('foo{bar,baaz}', 'foobuzz', { extended:true, globstar, flag:'g' }), false);
      t.equal(match('foo{bar,b*z}', 'foobuzz', { extended:true, globstar, flag:'g'}), true);
   }

   tester(true);
   tester(false);
});

test('globrex: complex extended matches', t => {
   t.plan(15)
   t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://foo.baaz.com/jquery.min.js', { extended:true }), true);
   t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.buzz.com/index.html', { extended:true }), true);
   t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.buzz.com/index.htm', { extended:true }), false);
   t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.bar.com/index.html', { extended:true }), false);
   t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://flozz.buzz.com/index.html', { extended:true }), false);

   const tester = globstar => {
      t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://foo.baaz.com/jquery.min.js', { extended:true, globstar, flags:'g' }), true);
      t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.buzz.com/index.html', { extended:true, globstar, flags:'g' }), true);
      t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.buzz.com/index.htm', { extended:true, globstar, flags:'g' }), false);
      t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.bar.com/index.html', { extended:true, globstar, flags:'g' }), false);
      t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://flozz.buzz.com/index.html', { extended:true, globstar, flags:'g' }), false);
   }

   tester(true);
   tester(false);
});

test('globrex: standard globstar', t => {
   t.plan(6);

   const tester = globstar => {
      t.equal(match('http://foo.com/**/{*.js,*.html}', 'http://foo.com/bar/jquery.min.js', { extended: true, globstar, flags: 'g' }), true);
      t.equal(match('http://foo.com/**/{*.js,*.html}', 'http://foo.com/bar/baz/jquery.min.js', { extended: true, globstar, flags: 'g' }), true);
      t.equal(match('http://foo.com/**', 'http://foo.com/bar/baz/jquery.min.js', { extended: true, globstar, flags: 'g' }), true);
   }

   tester(true);
   tester(false);
});

test('globrex: remaining chars should match themself', t => {
   t.plan(4);

   const tester = globstar => {
      const testExtStr = '\\/$^+.()=!|,.*';
      t.equal(match(testExtStr, testExtStr, { extended:true }), true);
      t.equal(match(testExtStr, testExtStr, { extended:true, globstar, flags: 'g' }), true);
   }

   tester(true);
   tester(false);
});

test('globrex: globstar advance testing', t => {
   t.plan(36);
   t.equal(match('/foo/*', '/foo/bar.txt', { globstar:true }), true);
   t.equal(match('/foo/**', '/foo/bar.txt', { globstar:true }), true);
   t.equal(match('/foo/**', '/foo/bar/baz.txt', { globstar:true }), true);
   t.equal(match('/foo/**', '/foo/bar/baz.txt', { globstar:true }), true);
   t.equal(match('/foo/*/*.txt', '/foo/bar/baz.txt', { globstar:true }), true);
   t.equal(match('/foo/**/*.txt', '/foo/bar/baz.txt', { globstar:true }), true);
   t.equal(match('/foo/**/*.txt', '/foo/bar/baz/qux.txt', { globstar:true }), true);
   t.equal(match('/foo/**/bar.txt', '/foo/bar.txt', { globstar:true }), true);
   t.equal(match('/foo/**/**/bar.txt', '/foo/bar.txt', { globstar:true }), true);
   t.equal(match('/foo/**/*/baz.txt', '/foo/bar/baz.txt', { globstar:true }), true);
   t.equal(match('/foo/**/*.txt', '/foo/bar.txt', { globstar:true }), true);
   t.equal(match('/foo/**/**/*.txt', '/foo/bar.txt', { globstar:true }), true);
   t.equal(match('/foo/**/*/*.txt', '/foo/bar/baz.txt', { globstar:true }), true);
   t.equal(match('**/*.txt', '/foo/bar/baz/qux.txt', { globstar:true }), true);
   t.equal(match('**/foo.txt', 'foo.txt', { globstar:true }), true);
   t.equal(match('**/*.txt', 'foo.txt', { globstar:true }), true);
   t.equal(match('/foo/*', '/foo/bar/baz.txt', { globstar:true }), false);
   t.equal(match('/foo/*.txt', '/foo/bar/baz.txt', { globstar:true }), false);
   t.equal(match('/foo/*/*.txt', '/foo/bar/baz/qux.txt', { globstar:true }), false);
   t.equal(match('/foo/*/bar.txt', '/foo/bar.txt', { globstar:true }), false);
   t.equal(match('/foo/*/*/baz.txt', '/foo/bar/baz.txt', { globstar:true }), false);
   t.equal(match('/foo/**.txt', '/foo/bar/baz/qux.txt', { globstar:true }), false);
   t.equal(match('/foo/bar**/*.txt', '/foo/bar/baz/qux.txt', { globstar:true }), false);
   t.equal(match('/foo/bar**', '/foo/bar/baz.txt', { globstar:true }), false);
   t.equal(match('**/.txt', '/foo/bar/baz/qux.txt', { globstar:true }), false);
   t.equal(match('*/*.txt', '/foo/bar/baz/qux.txt', { globstar:true }), false);
   t.equal(match('*/*.txt', 'foo.txt', { globstar:true }), false);
   t.equal(match('http://foo.com/*', 'http://foo.com/bar/baz/jquery.min.js', { extended: true, globstar: true }), false);
   t.equal(match('http://foo.com/*', 'http://foo.com/bar/baz/jquery.min.js', { globstar: true }), false);
   t.equal(match('http://foo.com/*', 'http://foo.com/bar/baz/jquery.min.js', { globstar: false }), true);
   t.equal(match('http://foo.com/**', 'http://foo.com/bar/baz/jquery.min.js', { globstar: true }), true);
   t.equal(match("http://foo.com/*/*/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js", { globstar: true }), true);
   t.equal(match("http://foo.com/**/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js", { globstar: true }), true);
   t.equal(match("http://foo.com/*/*/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js", { globstar: false }), true);
   t.equal(match("http://foo.com/*/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js", { globstar: false }), true);
   t.equal(match("http://foo.com/*/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js", { globstar: true }), false);
});

test('globrex: extended extglob ?', t => {
   t.plan(17);
   t.equal(match('(foo).txt', '(foo).txt', { extended:true }), true);
   t.equal(match('?(foo).txt', 'foo.txt', { extended:true }), true);
   t.equal(match('?(foo).txt', '.txt', { extended:true }), true);
   t.equal(match('?(foo|bar)baz.txt', 'foobaz.txt', { extended:true }), true);
   t.equal(match('?(ba[zr]|qux)baz.txt', 'bazbaz.txt', { extended:true }), true);
   t.equal(match('?(ba[zr]|qux)baz.txt', 'barbaz.txt', { extended:true }), true);
   t.equal(match('?(ba[zr]|qux)baz.txt', 'quxbaz.txt', { extended:true }), true);
   t.equal(match('?(ba[!zr]|qux)baz.txt', 'batbaz.txt', { extended:true }), true);
   t.equal(match('?(ba*|qux)baz.txt', 'batbaz.txt', { extended:true }), true);
   t.equal(match('?(ba*|qux)baz.txt', 'batttbaz.txt', { extended:true }), true);
   t.equal(match('?(ba*|qux)baz.txt', 'quxbaz.txt', { extended:true }), true);
   t.equal(match('?(ba?(z|r)|qux)baz.txt', 'bazbaz.txt', { extended:true }), true);
   t.equal(match('?(ba?(z|?(r))|qux)baz.txt', 'bazbaz.txt', { extended:true }), true);
   t.equal(match('?(foo).txt', 'foo.txt', { extended:false }), false);
   t.equal(match('?(foo|bar)baz.txt', 'foobarbaz.txt', { extended:true }), false);
   t.equal(match('?(ba[zr]|qux)baz.txt', 'bazquxbaz.txt', { extended:true }), false);
   t.equal(match('?(ba[!zr]|qux)baz.txt', 'bazbaz.txt', { extended:true }), false);
});

test('globrex: extended extglob *', t => {
   t.plan(16);
   t.equal(match('*(foo).txt', 'foo.txt', { extended:true }), true);
   t.equal(match('*foo.txt', 'bofoo.txt', { extended:true }), true);
   t.equal(match('*(foo).txt', 'foofoo.txt', { extended:true }), true);
   t.equal(match('*(foo).txt', '.txt', { extended:true }), true);
   t.equal(match('*(fooo).txt', '.txt', { extended:true }), true);
   t.equal(match('*(fooo).txt', 'foo.txt', { extended:true }), false);
   t.equal(match('*(foo|bar).txt', 'foobar.txt', { extended:true }), true);
   t.equal(match('*(foo|bar).txt', 'barbar.txt', { extended:true }), true);
   t.equal(match('*(foo|bar).txt', 'barfoobar.txt', { extended:true }), true);
   t.equal(match('*(foo|bar).txt', '.txt', { extended:true }), true);
   t.equal(match('*(foo|ba[rt]).txt', 'bat.txt', { extended:true }), true);
   t.equal(match('*(foo|b*[rt]).txt', 'blat.txt', { extended:true }), true);
   t.equal(match('*(foo|b*[rt]).txt', 'tlat.txt', { extended:true }), false);
   t.equal(match('*(*).txt', 'whatever.txt', { extended:true, globstar:true }), true);
   t.equal(match('*(foo|bar)/**/*.txt', 'foo/hello/world/bar.txt', { extended:true, globstar:true }), true);
   t.equal(match('*(foo|bar)/**/*.txt', 'foo/world/bar.txt', { extended:true, globstar: true }), true);
});

test('globrex: extended extglob +', t => {
   t.plan(4);
   t.equal(match('+(foo).txt', 'foo.txt', { extended:true }), true);
   t.equal(match('+foo.txt', '+foo.txt', { extended:true }), true);
   t.equal(match('+(foo).txt', '.txt', { extended:true }), false);
   t.equal(match('+(foo|bar).txt', 'foobar.txt', { extended:true }), true);
});

test('globrex: extended extglob @', t => {
   t.plan(6);
   t.equal(match('@(foo).txt', 'foo.txt', { extended:true }), true);
   t.equal(match('@foo.txt', '@foo.txt', { extended:true }), true);
   t.equal(match('@(foo|baz)bar.txt', 'foobar.txt', { extended:true }), true);
   t.equal(match('@(foo|baz)bar.txt', 'foobazbar.txt', { extended:true }), false);
   t.equal(match('@(foo|baz)bar.txt', 'foofoobar.txt', { extended:true }), false);
   t.equal(match('@(foo|baz)bar.txt', 'toofoobar.txt', { extended:true }), false);
});

test('globrex: extended extglob !', t => {
   t.plan(5);
   t.equal(match('!(boo).txt', 'foo.txt', { extended: true }), true);
   t.equal(match('!(foo|baz)bar.txt', 'buzbar.txt', { extended: true }), true);
   t.equal(match('!bar.txt', '!bar.txt', { extended: true }), true);
   t.equal(match('!({foo,bar})baz.txt', 'notbaz.txt', { extended: true }), true);
   t.equal(match('!({foo,bar})baz.txt', 'foobaz.txt', { extended: true }), false);
});


test('globrex: strict', t => {
   t.plan(3);
   t.equal(match('foo//bar.txt', 'foo/bar.txt'), true);
   t.equal(match('foo///bar.txt', 'foo/bar.txt'), true);
   t.equal(match('foo///bar.txt', 'foo/bar.txt', { strict:true }), false);
});


test('globrex: filepath path-regex', t => {
   let opts = { extended:true, filepath:true }, res, pattern;

   res = globrex('', opts);
   t.is(res.hasOwnProperty('path'), true);
   t.is(res.path.hasOwnProperty('regex'), true);
   t.is(res.path.hasOwnProperty('segments'), true);
   t.is(Array.isArray(res.path.segments), true);

   pattern = 'foo/bar/baz.js';
   res = matchRegex(t, pattern, '/^foo\\/bar\\/baz\\.js$/', '/^foo\\\\+bar\\\\+baz\\.js$/', opts);
   t.is(res.path.segments.length, 3);

   res = matchRegex(t, '../foo/bar.js', '/^\\.\\.\\/foo\\/bar\\.js$/', '/^\\.\\.\\\\+foo\\\\+bar\\.js$/', opts);
   t.is(res.path.segments.length, 3);

   res = matchRegex(t, '*/bar.js', '/^.*\\/bar\\.js$/', '/^.*\\\\+bar\\.js$/', opts);
   t.is(res.path.segments.length, 2);

   opts.globstar = true;
   res = matchRegex(t, '**/bar.js', '/^((?:[^\\/]*(?:\\/|$))*)bar\\.js$/', '/^((?:[^\\\\]*(?:\\\\|$))*)bar\\.js$/', opts);
   t.is(res.path.segments.length, 2);

   t.end(); 
})

test('globrex: filepath path segments', t => {
   let opts = { extended:true }, res, win, unix;

   unix = [/^foo$/, /^bar$/, /^([^\/]*)$/, /^baz\.(md|js|txt)$/];
   win = [/^foo$/, /^bar$/, /^([^\\]*)$/, /^baz\.(md|js|txt)$/];
   matchSegments(t, 'foo/bar/*/baz.{md,js,txt}', unix, win, {...opts, globstar:true});

   unix = [/^foo$/, /^.*$/, /^baz\.md$/];
   win = [/^foo$/, /^.*$/, /^baz\.md$/];
   matchSegments(t, 'foo/*/baz.md', unix, win, opts);
   
   unix = [/^foo$/, /^.*$/, /^baz\.md$/];
   win = [/^foo$/, /^.*$/, /^baz\.md$/];
   matchSegments(t, 'foo/**/baz.md', unix, win, opts);

   unix = [/^foo$/, /^((?:[^\/]*(?:\/|$))*)$/, /^baz\.md$/];
   win = [/^foo$/, /^((?:[^\\]*(?:\\|$))*)$/, /^baz\.md$/];
   matchSegments(t, 'foo/**/baz.md', unix, win, {...opts, globstar:true});

   unix = [/^foo$/, /^.*$/, /^.*\.md$/];
   win = [/^foo$/, /^.*$/, /^.*\.md$/];
   matchSegments(t, 'foo/**/*.md', unix, win, opts);

   unix = [/^foo$/, /^((?:[^\/]*(?:\/|$))*)$/, /^([^\/]*)\.md$/];
   win = [/^foo$/, /^((?:[^\\]*(?:\\|$))*)$/, /^([^\\]*)\.md$/];
   matchSegments(t, 'foo/**/*.md', unix, win, {...opts, globstar:true});

   unix = [/^foo$/, /^:$/, /^b:az$/];
   win = [/^foo$/, /^:$/, /^b:az$/];
   matchSegments(t, 'foo/:/b:az', unix, win, opts);
   
   unix = [/^foo$/, /^baz\.md$/];
   win = [/^foo$/, /^baz\.md$/];
   matchSegments(t, 'foo///baz.md', unix, win, {...opts, strict:true});
   
   unix = [/^foo$/, /^baz\.md$/];
   win = [/^foo$/, /^baz\.md$/];
   matchSegments(t, 'foo///baz.md', unix, win, {...opts, strict:false});
   
   t.end();
});

test('globrex: stress testing', t => {
   t.plan(8);
   t.equal(match('**/*/?yfile.{md,js,txt}', 'foo/bar/baz/myfile.md', { extended:true }), true);
   t.equal(match('**/*/?yfile.{md,js,txt}', 'foo/baz/myfile.md', { extended:true }), true);
   t.equal(match('**/*/?yfile.{md,js,txt}', 'foo/baz/tyfile.js', { extended:true }), true);
   t.equal(match('[[:digit:]_.]/file.js', '1/file.js', { extended:true }), true);
   t.equal(match('[[:digit:]_.]/file.js', '2/file.js', { extended:true }), true);
   t.equal(match('[[:digit:]_.]/file.js', '_/file.js', { extended:true }), true);
   t.equal(match('[[:digit:]_.]/file.js', './file.js', { extended:true }), true);
   t.equal(match('[[:digit:]_.]/file.js', 'z/file.js', { extended:true }), false);
});
