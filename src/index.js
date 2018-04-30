const isWin = process.platform === 'win32';
const SEP = isWin ? '\\\\+' : '\\/'

/**
 * Convert any glob pattern to a JavaScript Regexp object
 * @param {String} glob Glob pattern to convert
 * @param {Object} opts Configuration object
 * @param {Boolean} [opts.extended=false] Support advanced ext globbing
 * @param {Boolean} [opts.globstar=false] Support globstar
 * @param {Boolean} [opts.strict=true] be laissez faire about mutiple slashes
 * @param {String} [opts.flags=''] RegExp globs
 * @returns {Object} converted object with string, segments and RegExp object
 */
function globrex(glob, { extended = false, globstar = false, strict = false, filepath = false, flags = '' } = {}) {
    let regex = '';
    let segment = '';
    let path = { regex: '', segments: [] };

    // If we are doing extended matching, this boolean is true when we are inside
    // a group (eg {*.html,*.js}), and false otherwise.
    let inGroup = false;
    let inRange = false;

    // extglob stack. Keep track of scope
    const ext = [];

    // Helper function to build string and segments
    const add = (str, split, addLastPart) => {
        regex += str;
        if (filepath) {
            path.regex += str === '\\/' ? SEP : str;
            if (split) {
                if (addLastPart) segment += str;
                if (segment !== '') {
                    if (!flags || !~flags.indexOf('g')) segment = `^${segment}$`;
                    path.segments.push(new RegExp(segment, flags));
                }
                segment = '';
            } else {
                segment += str;
            }
        }
    }

    let c, n;
    for (var i = 0, len = glob.length; i < len; i++) {
        c = glob[i];
        n = glob[i + 1];
        switch (c) {
            case '\\':
            case '$':
            case '^':
            case '.':
            case '=':
                add('\\' + c)
                break;
            case '/':
                add('\\' + c, true);
                if (n === '/' && !strict) regex += '?'; //TODO test with win
                break;
            case '(':
                if (ext.length) {
                    add(c);
                    break;
                }
                add('\\' + c);
                break;
            case ')':
                if (ext.length) {
                    add(c);
                    let type = ext.pop();
                    if (type === '@') {
                        add('{1}');
                    } else if (type === '!') {
                        add('([^\/]*)');
                    } else {
                        add(type);
                    }
                    break;
                }
                add('\\' + c);
                break;
            case '|':
                if (ext.length) {
                    add(c);
                } else {
                    add('\\' + c);
                }
                break;
            case '+':
                if (n === '(' && extended) {
                    ext.push(c);
                } else {
                    add('\\' + c);
                }
                break;
            case '@':
                if (n === '(' && extended) {
                    ext.push(c);
                    break;
                }
            case '!':
                if (extended) {
                    if (inRange) {
                        add('^');
                        break
                    }
                    if (n === '(') {
                        ext.push(c);
                        add('(?!');
                        i++;
                        break;
                    }
                    add('\\' + c);
                    break;
                }
            case '?':
                if (extended) {
                    if (n === '(') {
                        ext.push(c);
                    } else {
                        add('.');
                    }
                    break;
                }
            case '[':
                if (inRange && n === ':') {
                    i++; // skip [
                    let value = '';
                    while(glob[++i] !== ':') value += glob[i];
                    if (value === 'alnum') add('(\\w|\\d)');
                    else if (value === 'space') add('\\s');
                    else if (value === 'digit') add('\\d');
                    i++; // skip last ]
                    break;
                }
                if (extended) {
                    inRange = true;
                    add(c);
                    break;
                }
            case ']':
                if (extended) {
                    inRange = false;
                    add(c);
                    break;
                }
            case '{':
                if (extended) {
                    inGroup = true;
                    add('(');
                    break;
                }
            case '}':
                if (extended) {
                    inGroup = false;
                    add(')');
                    break;
                }
            case ',':
                if (inGroup) {
                    add('|');
                    break;
                }
                add('\\' + c);
                break;
            case '*':
                if (n === '(' && extended) {
                    ext.push(c);
                    break;
                }
                // Move over all consecutive "*"'s.
                // Also store the previous and next characters
                let prevChar = glob[i - 1];
                let starCount = 1;
                while (glob[i + 1] === '*') {
                    starCount++;
                    i++;
                }
                let nextChar = glob[i + 1];
                if (!globstar) {
                    // globstar is disabled, so treat any number of "*" as one
                    add('.*');
                } else {
                    // globstar is enabled, so determine if this is a globstar segment
                    let isGlobstar =
                        starCount > 1 && // multiple "*"'s
                        (prevChar === '/' || prevChar === undefined) && // from the start of the segment
                        (nextChar === '/' || nextChar === undefined); // to the end of the segment
                    if (isGlobstar) {
                        // it's a globstar, so match zero or more path segments
                        add('((?:[^/]*(?:/|$))*)', true, true)
                        i++; // move over the "/"
                    } else {
                        // it's not a globstar, so only match one path segment
                        add('([^/]*)');
                    }
                }
                break;
            default:
                add(c);
        }
    }

    // When regexp 'g' flag is specified don't
    // constrain the regular expression with ^ & $
    if (!flags || !~flags.indexOf('g')) {
        regex = `^${regex}$`;
        segment = `^${segment}$`;
        if (filepath) path.regex = `^${path.regex}$`;
    }

    // Push the last segment
    if (filepath) {
        path.segments.push(new RegExp(segment, flags));
        path.regex = new RegExp(path.regex, flags);
    }

    return { regex: new RegExp(regex, flags), path };
}

module.exports = globrex;
