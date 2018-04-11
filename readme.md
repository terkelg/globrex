<div align="center">
  <img src="https://github.com/terkelg/globrex/raw/master/globrex.png" alt="globrex" width="500" height="200" />
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

<div align="center">Simple but powerful glob to regular expression compiler.</div>

<br />


## Installation

```
npm install globrex --save
```


## Core Features

- **extended globbing:** transform advance `ExtGlob` features
- **simple**: no dependencies
- **paths**: split paths into multiple `RegExp` segments


## Usage

```js
const globrex = require('globrex');

const result = globrex('p*uck')
// => { regex: /^p.*uck$/, string: '^p.*uck$', segments: [ /^p.*uck$/ ] }

result.regex.test('pluck'); // true
```


## API

## globrex(glob, opts)

Type: `function`<br>
Returns: `{ regex, string, segments }`

Transform globs intp regular expressions.
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

Array of `RegExp` instances seperated by `/`. 
This can be usable when working with paths or urls. 

Example array could be:
```js
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

Enable all advanced features from `extglob`.

Matching so called "extended" globs pattern like single character matching, matching ranges of characters, group matching, etc.

> **Note**: Interprets `[a-d]` as `[abcd]`.  To match a literal `-`, include it as first or last character.


#### opts.globstar

Type: `Boolean`<br>
Default: `false`

When globstar is `false` globs like `'/foo/*'` are transformed to the following
`'^\/foo\/.*$'` which will match any string beginning with `'/foo/'`.

When the globstar option is `true`, the same `'/foo/*'` glob is transformed to
`'^\/foo\/[^/]*$'` which will match any string beginning with `'/foo/'` that **does not have** a `'/'` to the right of it. `'/foo/*'` will match: `'/foo/bar'`, `'/foo/bar.txt'` but not `'/foo/bar/baz'` or `'/foo/bar/baz.txt'.

> **Note**: When globstar is `true`, `'/foo/**'` is equivelant to `'/foo/*'` when globstar is `false`.


#### opts.strict

Type: `Boolean`<br>
Default: `false`

Be forgiving about mutiple slashes, like `///` and make everything after the first `/` optional. This is how bash glob works.


#### opts.flags

Type: `String`<br>
Default: `''`

RegExp flags (e.g. `'i'` ) to pass to the RegExp constructor.


## References

Learn more about globbing here:
- [mywiki.wooledge.org/glob](http://mywiki.wooledge.org/glob)
- [linuxjournal](http://www.linuxjournal.com/content/bash-extended-globbing)


## License

MIT © [Terkel Gjervig](https://terkel.com)
