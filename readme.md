<div align="center">
  <img src="https://github.com/terkelg/eliminate/raw/master/globrex.png" alt="globrex" width="500" height="100" />
</div>

<h1 align="center">globrex</h1>

<div align="center">
  <a href="https://npmjs.org/package/globrex">
    <img src="https://img.shields.io/npm/v/globrex.svg" alt="version" />
  </a>
  <a href="https://travis-ci.org/terkelg/globrex">
    <img src="https://img.shields.io/travis/terkelg/globrex.svg" alt="travis" />
  </a>
  <a href="https://npmjs.org/package/globrex">
    <img src="https://img.shields.io/npm/dm/globrex.svg" alt="downloads" />
  </a>
</div>

<div align="center">Simple but powerful glob to regex compiler.</div>

<br />


## Installation

```
npm install globrex
```


## Usage

```js
const globrex = require('globrex');

const { regex } = globrex('p*uck');
regex.test('pot luck'); // true
regex.test('pluck'); // true
regex.test('puck'); // true
```


## API

This package support all advanced features from `extglob`.
To lean more about globbing look here:

- [mywiki.wooledge.org/glob](http://mywiki.wooledge.org/glob)
- [linuxjournal](http://www.linuxjournal.com/content/bash-extended-globbing)


## globrex(glob, opts)

Type: `function`<br>
Returns: `{ regex, string, segments }`

Transform glob strings into regex.
Returns object with the following properties:

#### obj.regex

Type: `RegExp`

JavaScript `RegExp` instance.

> **Note**: Read more about how to use [RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) on MDN.


#### obj.string

Type: `String`

Regex string representation of the glob. 

#### obj.segments

Type: `Array`

Array of `RegExp` instances seperated by `/`. This can be usable when working with paths or urls. 

Example array could be:
```
[ /^foo$/, /^bar$/, /^([^\/]*)$/, '^baz\\.(md|js|txt)$' ]
```

> **Note**: This only makes sense for POSIX paths like /foo/bar/hello.js or URLs. Not globbing on regular strings.


### glob

Type: `String`

Glob string to transform.


#### opts

Type: `Object`<br>
Default: `{ extended: false, globstar: false, strict: false, flags: '' }`

Configuration object, that enables/disable different features.


#### opts.extended

Type: `Boolean`<br>
Default: `false`

Whether we are matching so called "extended" globs (like bash) and should
support single character matching, matching ranges of characters, group
matching, etc.

> **Note**: Interprets `[a-d]` as `[abcd]`.  To match a literal `-`, include it as first or last character.


#### opts.globstar

Type: `Boolean`<br>
Default: `false`

When globstar is `false` the `'/foo/*'` is translated a regexp like
`'^\/foo\/.*$'` which will match any string beginning with `'/foo/'`.

When globstar is `true`, `'/foo/*'` is translated to regexp like
`'^\/foo\/[^/]*$'` which will match any string beginning with `'/foo/'` BUT
which **does not have** a `'/'` to the right of it.

E.g. with `'/foo/*'` these will match: `'/foo/bar'`, `'/foo/bar.txt'` but
these will not `'/foo/bar/baz'`, `'/foo/bar/baz.txt'`

> **Note**: When globstar is `true`, `'/foo/**'` is equivelant to `'/foo/*'` when globstar is `false`.


#### opts.strict

Type: `Boolean`<br>
Default: `false`

Don't be so strict.
Be forgiving about `///` and make everything after the first `/` optional.
This is how bash-globbing works.


#### opts.flags

Type: `String`<br>
Default: `''`

RegExp flags (eg `'i'` ) to pass in to RegExp constructor.

## License

MIT © [Terkel Gjervig](https://terkel.com)
