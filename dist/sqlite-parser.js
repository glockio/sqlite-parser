/*!
 * sqlite-parser - v0.12.1
 * @copyright 2016 Code School (http://codeschool.com)
 * @author Nick Wronski <nick@javascript.com>
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.sqliteParser = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * sqlite-parser
 */
var parser = require('./lib/parser');
function sqliteParser(source, callback) {
  try {
    callback(null, parser.parse(source));
  } catch (e) {
    callback(e);
  }
}

sqliteParser['NAME'] = 'sqlite-parser';
sqliteParser['VERSION'] = '0.12.1';

module.exports = sqliteParser;

},{"./lib/parser":3}],2:[function(require,module,exports){
/**
 * sqlite-parser utilities
 */
var slice = [].slice;

function makeArray(arr) {
  return !isArray(arr) ? (isOkay(arr) ? [arr] : []) : arr;
}

function typed(obj) {
  return Object.prototype.toString.call(obj);
}

function isPlain(obj) {
  return typed(obj) === '[object Object]';
}

function isPattern(obj) {
  return typed(obj) === '[object RegExp]';
}

function isFunc(obj) {
  return typed(obj) === '[object Function]';
}

function isString(obj) {
  return typed(obj) === '[object String]';
}

function isArray(obj) {
  return Array.isArray ? Array.isArray(obj) : (typed(obj) === '[object Array]');
}

function isOkay(obj) {
  return obj != null;
}

function collapse(arr) {
  var i, len, n, obj, ref, v;
  if (isArray(arr) && arr.length) {
    obj = {};
    for (i = 0, len = arr.length; i < len; i++) {
      ref = arr[i], n = ref.name, v = ref.value;
      obj[n] = v;
    }
    return obj;
  } else {
    return {};
  }
}

function compose(args, glue) {
  var conc = isArray(glue), res, start = conc ? [] : '';
  if (!isOkay(glue)) {
    glue = ' ';
  }
  res = args.reduce(function (prev, cur) {
    return conc ? (isOkay(cur) ? prev.concat(cur) : prev) :
                  (prev + (isOkay(cur) ? textNode(cur) + glue : ''));
  }, start);
  return conc ? res : res.trim();
}

function stack(arr) {
  return (isArray(arr) ?
    arr.map(function (elem) {
      return elem[1];
    }) : []);
}

function nodeToString(node) {
  var elem = ((isArray(node) || isString(node)) ? node : []);
  if (isArray(elem)) {
    if (elem.length && isArray(elem[0])) {
      elem = stack(elem);
    }
    elem = elem.join('');
  }
  return elem;
}

function textNode(elem) {
  /*
   * A text node has
   * - no leading or trailing whitespace
   */
  return nodeToString(elem).trim();
}

function textMerge() {
  return compose.call(this, slice.call(arguments, 0), '');
}

function unescape(str, quoteChar) {
  var re;
  if (quoteChar == null) {
    quoteChar = '\'';
  }
  re = new RegExp(quoteChar + '{2}', 'g');
  return nodeToString(str).replace(re, quoteChar);
}

function extend() {
  var first = arguments[0],
      rest = slice.call(arguments, 1);

  rest.forEach(function (next) {
    if (isOkay(next) && isPlain(next)) {
      var key;
      for (key in next) {
        if (next.hasOwnProperty(key)) {
          first[key] = next[key];
        }
      }
    }
  });

  return first;
}

function has(thing, item) {
  var k, v, len;
  if (isArray(thing)) {
    if (isString(item)) {
      // thing is an array, find substring item
      return thing.indexOf(item) !== -1;
    } else {
      // thing is an array, find item in array
      return findWhere(thing, item) !== undefined;
    }
  } else if (isPlain(thing)) {
    if (isFunc(item)) {
      return item(thing);
    } else if (isPlain(item)) {
      // item is an object, find each prop key and value in item within thing
      for (k in item) {
        v = item[k];
        if (!(thing.hasOwnProperty(k) && thing[k] === v)) {
          return false;
        }
      }
      return true;
    } else if (isArray(item)) {
      // item is an array, find each string prop within thing
      for (i = 0, len = item.length; i < len; i++) {
        k = item[i];
        if (!thing.hasOwnProperty(k)) {
          return false;
        }
      }
      return true;
    } else {
      // thing is an object, item is a string, find item string in thing
      return thing.hasOwnProperty(item);
    }
  }
  return false;
}

function findWhere(arr, props) {
  var i, len, val;
  for (i = 0, len = arr.length; i < len; i++) {
    val = arr[i];
    if (has(val, props)) {
      return val;
    }
  }
  return null;
}

function key(elem) {
  return textNode(elem).toLowerCase();
}

function keyify(arr, glue) {
  return key(compose(arr, glue));
}

function listify() {
  return compose.call(this, slice.call(arguments, 0), []);
}

function findLastIndex(arr, props) {
  return findLast(arr, props, true);
}

function findLast(arr, props, index) {
  var elem, i;
  for (i = arr.length - 1; i >= 0; i += -1) {
    elem = arr[i];
    if (has(elem, props)) {
      return index ? i : elem;
    }
  }
  return index ? -1 : null;
}

function takeWhile(arr, func) {
  var elem, i, len;
  for (i = 0, len = arr.length; i < len; i++) {
    elem = arr[i];
    if (!func(elem)) {
      break;
    }
  }
  return arr.slice(0, i);
}

function isArrayOkay(arr) {
  if (isArray(arr)) {
    return arr.length > 0 && isOkay(arr[0]);
  }
  return false;
}

module.exports = {
  // Array methods
  'stack':                stack,
  'collapse':             collapse,
  'compose':              compose,
  'findWhere':            findWhere,
  'has':                  has,
  'findLastIndex':        findLastIndex,
  'findLast':             findLast,
  'takeWhile':            takeWhile,
  'isArrayOkay':          isArrayOkay,
  'listify':              listify,
  // String methods
  'nodeToString':         nodeToString,
  'textNode':             textNode,
  'unescape':             unescape,
  'key':                  key,
  'keyify':               keyify,
  'textMerge':            textMerge,
  // Type detection
  'typed':                typed,
  'isPlain':              isPlain,
  'isPattern':            isPattern,
  'isFunc':               isFunc,
  'isString':             isString,
  'isArray':              isArray,
  'isOkay':								isOkay,
  // Misc methods
  'extend':               extend,
  'makeArray':            makeArray
};

},{}],3:[function(require,module,exports){
module.exports = (function() {
  "use strict";

  /*
   * Generated by PEG.js 0.9.0.
   *
   * http://pegjs.org/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function peg$SyntaxError(message, expected, location) {
    this.message  = message;
    this.expected = expected;
    this.location = location;
    this.name     = "SyntaxError";

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, peg$SyntaxError);
    }
  }

  peg$subclass(peg$SyntaxError, Error);

  function peg$parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},
        parser  = this,

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = function(s) {
            return util.extend({}, s);
          },
        peg$c1 = function(f, b) {
            return {
              'statement': util.listify(f, b)
            };
          },
        peg$c2 = function(s) { return s; },
        peg$c3 = { type: "other", description: "Expression" },
        peg$c4 = function(t) { return t; },
        peg$c5 = { type: "other", description: "Logical Expression Group" },
        peg$c6 = function(l, o, r) {
            return {
              'type': 'expression',
              'format': 'binary',
              'variant': 'operation',
              'operation': util.key(o),
              'left': l,
              'right': r
            };
          },
        peg$c7 = { type: "other", description: "Wrapped Expression" },
        peg$c8 = function(n) { return n; },
        peg$c9 = { type: "other", description: "Unary Expression" },
        peg$c10 = function(o, e) {
            return {
              'type': 'expression',
              'format': 'unary',
              'variant': 'operation',
              'expression': e,
              'operator': util.key(o)
            };
          },
        peg$c11 = { type: "other", description: "CAST Expression" },
        peg$c12 = function(s, e, a) {
            return {
              'type': 'expression',
              'format': 'unary',
              'variant': util.key(s),
              'expression': e,
              'as': a
            };
          },
        peg$c13 = { type: "other", description: "Type Alias" },
        peg$c14 = function(d) { return d; },
        peg$c15 = { type: "other", description: "EXISTS Expression" },
        peg$c16 = function(n, e) {
            return {
              'type': 'expression',
              'format': 'unary',
              'variant': 'exists',
              'expression': e,
              'operator': util.key(n)
            };
          },
        peg$c17 = { type: "other", description: "EXISTS Keyword" },
        peg$c18 = function(n, x) { return util.compose([n, x]); },
        peg$c19 = { type: "other", description: "CASE Expression" },
        peg$c20 = function(t, e, w, s) {
            return {
              'type': 'expression',
              'format': 'binary',
              'variant': util.key(t),
              'expression': e,
              'condition': util.listify(w, s)
            };
          },
        peg$c21 = { type: "other", description: "WHEN Clause" },
        peg$c22 = function(s, w, t) {
            return {
              'type': 'condition',
              'format': util.key(s),
              'when': w,
              'then': t
            };
          },
        peg$c23 = { type: "other", description: "ELSE Clause" },
        peg$c24 = function(s, e) {
            return {
              'type': 'condition',
              'format': util.key(s),
              'else': e
            };
          },
        peg$c25 = { type: "other", description: "RAISE Expression" },
        peg$c26 = function(s, a) {
            return util.extend({
              'type': 'expression',
              'format': 'unary',
              'variant': util.key(s),
              'expression': a
            }, a);
          },
        peg$c27 = { type: "other", description: "RAISE Expression Arguments" },
        peg$c28 = function(a) {
            return util.extend({
              'type': 'error'
            }, a);
          },
        peg$c29 = { type: "other", description: "IGNORE Keyword" },
        peg$c30 = function(f) {
            return {
              'action': util.key(f)
            };
          },
        peg$c31 = function(f, m) {
            return {
              'action': util.key(f),
              'message': m
            };
          },
        peg$c32 = { type: "other", description: "COLLATE Expression" },
        peg$c33 = function(v, s, c) {
            return util.extend(v, {
              'collate': c
            });
          },
        peg$c34 = { type: "other", description: "Comparison Expression" },
        peg$c35 = function(v, n, m, e, x) {
            return util.extend({
              'type': 'expression',
              'format': 'binary',
              'variant': 'operation',
              'operation': util.keyify([n, m]),
              'left': v,
              'right': e
            }, x);
          },
        peg$c36 = { type: "other", description: "ESCAPE Expression" },
        peg$c37 = function(s, e) {
            return {
              'escape': e
            };
          },
        peg$c38 = { type: "other", description: "NULL Expression" },
        peg$c39 = function(v, n) {
            return {
              'type': 'expression',
              'format': 'unary',
              'variant': 'operation',
              'expression': v,
              'operation': n
            };
          },
        peg$c40 = { type: "other", description: "NULL Keyword" },
        peg$c41 = "is",
        peg$c42 = { type: "literal", value: "IS", description: "\"IS\"i" },
        peg$c43 = function(i, n) { return util.keyify([i, n]); },
        peg$c44 = { type: "other", description: "IS Keyword" },
        peg$c45 = function(n) { return util.textNode(n); },
        peg$c46 = "not",
        peg$c47 = { type: "literal", value: "NOT", description: "\"NOT\"i" },
        peg$c48 = function(t) { return util.key(t); },
        peg$c49 = { type: "other", description: "BETWEEN Expression" },
        peg$c50 = function(v, n, b, e1, s, e2) {
            return {
              'type': 'expression',
              'format': 'binary',
              'variant': 'operation',
              'operation': util.keyify([n, b]),
              'left': v,
              'right': {
                'type': 'expression',
                'format': 'binary',
                'variant': 'operation',
                'operation': util.key(s),
                'left': e1,
                'right': e2
              }
            };
          },
        peg$c51 = { type: "other", description: "IN Expression" },
        peg$c52 = function(v, n, i, e) {
            return {
              'type': 'expression',
              'format': 'binary',
              'variant': 'operation',
              'operation': util.keyify([n, i]),
              'left': v,
              'right': e
            };
          },
        peg$c53 = function(e) { return e; },
        peg$c54 = { type: "other", description: "Type Definition" },
        peg$c55 = function(n, a) {
            return util.extend({
              'type': 'datatype',
              'variant': n[0],
              'affinity': n[1],
              'args': [] // datatype definition arguments
            }, a);
          },
        peg$c56 = { type: "other", description: "Type Definition Arguments" },
        peg$c57 = function(a1, a2) {
            return {
              'args': util.listify(a1, a2)
            };
          },
        peg$c58 = { type: "other", description: "Null Literal" },
        peg$c59 = function(n) {
            return {
              'type': 'literal',
              'variant': 'null',
              'value': util.key(n)
            };
          },
        peg$c60 = { type: "other", description: "Date Literal" },
        peg$c61 = function(d) {
            return {
              'type': 'literal',
              'variant': 'date',
              'value': util.key(d)
            };
          },
        peg$c62 = { type: "other", description: "String Literal" },
        peg$c63 = function(s) {
            return {
              'type': 'literal',
              'variant': 'string',
              'value': s
            };
          },
        peg$c64 = { type: "other", description: "Single-quoted String Literal" },
        peg$c65 = function(s) {
            /**
              * @note Unescaped the pairs of literal single quotation marks
              * @note Not sure if the BLOB type should be un-escaped
              */
            return util.unescape(s, "'");
          },
        peg$c66 = "''",
        peg$c67 = { type: "literal", value: "''", description: "\"''\"" },
        peg$c68 = /^[^']/,
        peg$c69 = { type: "class", value: "[^\\']", description: "[^\\']" },
        peg$c70 = { type: "other", description: "Blob Literal" },
        peg$c71 = /^[x]/i,
        peg$c72 = { type: "class", value: "[x]i", description: "[x]i" },
        peg$c73 = function(b) {
            return {
              'type': 'literal',
              'variant': 'blob',
              'value': b
            };
          },
        peg$c74 = { type: "other", description: "Number Sign" },
        peg$c75 = function(s, n) {
            if (util.isOkay(s)) {
              n['value'] = util.textMerge(s, n['value']);
            }
            return n;
          },
        peg$c76 = function(d, e) {
            return {
              'type': 'literal',
              'variant': 'decimal',
              'value': util.textMerge(d, e)
            };
          },
        peg$c77 = { type: "other", description: "Decimal Literal" },
        peg$c78 = function(f, b) { return util.textMerge(f, b); },
        peg$c79 = function(t, d) { return util.textMerge(t, d); },
        peg$c80 = { type: "other", description: "Decimal Literal Exponent" },
        peg$c81 = "e",
        peg$c82 = { type: "literal", value: "E", description: "\"E\"i" },
        peg$c83 = /^[+\-]/,
        peg$c84 = { type: "class", value: "[\\+\\-]", description: "[\\+\\-]" },
        peg$c85 = function(e, s, d) { return util.textMerge(e, s, d); },
        peg$c86 = { type: "other", description: "Hexidecimal Literal" },
        peg$c87 = "0x",
        peg$c88 = { type: "literal", value: "0x", description: "\"0x\"i" },
        peg$c89 = function(f, b) {
            return {
              'type': 'literal',
              'variant': 'hexidecimal',
              'value': util.textMerge(f, b)
            };
          },
        peg$c90 = /^[0-9a-f]/i,
        peg$c91 = { type: "class", value: "[0-9a-f]i", description: "[0-9a-f]i" },
        peg$c92 = /^[0-9]/,
        peg$c93 = { type: "class", value: "[0-9]", description: "[0-9]" },
        peg$c94 = { type: "other", description: "Bind Parameter" },
        peg$c95 = function(b) {
            return util.extend({
              'type': 'variable'
            }, b);
          },
        peg$c96 = { type: "other", description: "Numbered Bind Parameter" },
        peg$c97 = /^[1-9]/,
        peg$c98 = { type: "class", value: "[1-9]", description: "[1-9]" },
        peg$c99 = function(q, id) {
            return {
              'format': 'numbered',
              'name': util.textMerge(q, id)
            };
          },
        peg$c100 = { type: "other", description: "Named Bind Parameter" },
        peg$c101 = /^[:@]/,
        peg$c102 = { type: "class", value: "[\\:\\@]", description: "[\\:\\@]" },
        peg$c103 = function(s, name) {
            return {
              'format': 'named',
              'name': util.textMerge(s, name)
            };
          },
        peg$c104 = { type: "other", description: "TCL Bind Parameter" },
        peg$c105 = "$",
        peg$c106 = { type: "literal", value: "$", description: "\"$\"" },
        peg$c107 = ":",
        peg$c108 = { type: "literal", value: ":", description: "\":\"" },
        peg$c109 = function(d, name, s) {
            return util.extend({
              'format': 'tcl',
              'name': util.textMerge(d, name)
            }, s);
          },
        peg$c110 = function(sfx) {
            return {
              'suffix': sfx
            };
          },
        peg$c111 = { type: "other", description: "Binary Expression" },
        peg$c112 = function(v, o, e) {
            return {
              'type': 'expression',
              'format': 'binary',
              'variant': 'operation',
              'operation': util.key(o),
              'left': v,
              'right': e
            };
          },
        peg$c113 = function(c) { return util.key(c); },
        peg$c114 = { type: "other", description: "Expression List" },
        peg$c115 = function(f, rest) {
            return util.listify(f, rest);
          },
        peg$c116 = { type: "other", description: "Function Call" },
        peg$c117 = function(n, a) {
            return util.extend({
              'type': 'function',
              'name': n,
              'args': []
            }, a);
          },
        peg$c118 = { type: "other", description: "Function Call Arguments" },
        peg$c119 = function(s) {
            return {
              'args': [{
                'type': 'identifier',
                'variant': 'star',
                'name': s
              }]
            };
          },
        peg$c120 = function(d, e) {
            return util.extend({
              'args': e
            }, d);
          },
        peg$c121 = function(s) {
            return {
              'filter': util.key(s)
            };
          },
        peg$c122 = { type: "other", description: "Error Message" },
        peg$c123 = function(m) { return m; },
        peg$c124 = { type: "other", description: "Statement" },
        peg$c125 = function(m, s) {
            return util.extend(s, m);
          },
        peg$c126 = { type: "other", description: "QUERY PLAN" },
        peg$c127 = function(e, q) {
            return {
              'explain': util.isOkay(e)
            };
          },
        peg$c128 = { type: "other", description: "QUERY PLAN Keyword" },
        peg$c129 = function(q, p) { return util.compose([q, p]); },
        peg$c130 = { type: "other", description: "Transaction" },
        peg$c131 = function(b, s, e) {
            return util.extend({
              'type': 'statement',
              'variant': 'transaction'
            }, b, s);
          },
        peg$c132 = { type: "other", description: "END Transaction Statement" },
        peg$c133 = function(s, t) {
            return util.keyify([s, t]);
          },
        peg$c134 = { type: "other", description: "BEGIN Transaction Statement" },
        peg$c135 = function(s, m, t) {
            return util.extend({}, m);
          },
        peg$c136 = function(m) {
            return {
              'defer': util.key(m)
            };
          },
        peg$c137 = { type: "other", description: "ROLLBACK Statement" },
        peg$c138 = function(s, n) {
            return {
              'type': 'statement',
              'variant': util.key(s),
              'to': n
            };
          },
        peg$c139 = { type: "other", description: "TO Clause" },
        peg$c140 = function(s) { return util.key(s); },
        peg$c141 = { type: "other", description: "SAVEPOINT Statement" },
        peg$c142 = function(s, n) {
            return {
              'type': 'statement',
              'variant': s,
              'target': n
            };
          },
        peg$c143 = { type: "other", description: "RELEASE Statement" },
        peg$c144 = function(s, a, n) {
            return {
              'type': 'statement',
              'variant': util.key(s),
              'target': n
            };
          },
        peg$c145 = { type: "other", description: "ALTER TABLE Statement" },
        peg$c146 = function(s, n, e) {
            return {
              'type': 'statement',
              'variant': util.key(s)
            };
          },
        peg$c147 = { type: "other", description: "ALTER TABLE Keyword" },
        peg$c148 = function(a, t) { return util.compose([a, t]); },
        peg$c149 = { type: "other", description: "RENAME TO Keyword" },
        peg$c150 = function(s, n) {
            return {
              'action': util.key(s),
              'name': n
            };
          },
        peg$c151 = { type: "other", description: "ADD COLUMN Keyword" },
        peg$c152 = function(s, d) {
            return {
              'action': util.key(s),
              'definition': d
            };
          },
        peg$c153 = function(w, s) { return util.extend(s, w); },
        peg$c154 = { type: "other", description: "WITH Clause" },
        peg$c155 = function(w) {
            return w;
          },
        peg$c156 = function(s, v, t) {
            var recursive = {
              'variant': util.isOkay(v) ? 'recursive' : 'common'
            };
            if (util.isArrayOkay(t)) {
              // Add 'recursive' property into each table expression
              t = t.map(function (elem) {
                return util.extend(elem, recursive);
              });
            }
            return {
              'with': t
            };
          },
        peg$c157 = function(f, r) { return util.listify(f, r); },
        peg$c158 = { type: "other", description: "Common Table Expression" },
        peg$c159 = function(t, s) {
            return util.extend({
              'type': 'expression',
              'format': 'table',
              'variant': 'common',
              'target': t
            }, s);
          },
        peg$c160 = function(s) {
            return {
              'expression': s
            };
          },
        peg$c161 = { type: "other", description: "DETACH Statement" },
        peg$c162 = function(d, b, n) {
            return {
              'type': 'statement',
              'variant': util.key(d),
              'target': n
            };
          },
        peg$c163 = { type: "other", description: "VACUUM Statement" },
        peg$c164 = function(v) {
            return {
              'type': 'statement',
              'variant': 'vacuum'
            };
          },
        peg$c165 = { type: "other", description: "ANALYZE Statement" },
        peg$c166 = function(s, a) {
            return util.extend({
              'type': 'statement',
              'variant': util.key(s)
            }, a);
          },
        peg$c167 = function(n) {
            return {
              'target': n['name']
            };
          },
        peg$c168 = { type: "other", description: "REINDEX Statement" },
        peg$c169 = function(a) {
            return {
              'target': a['name']
            };
          },
        peg$c170 = { type: "other", description: "PRAGMA Statement" },
        peg$c171 = function(s, n, v) {
            return {
              'type': 'statement',
              'variant': util.key(s),
              'target': n,
              'args': (util.isOkay(v) ? util.makeArray(v) : [])
            };
          },
        peg$c172 = function(v) { return v; },
        peg$c173 = function(v) { return /^(yes|no|false|true|0|1)$/i.test(v) },
        peg$c174 = function(v) {
            return {
              'type': 'literal',
              'variant': 'boolean',
              'normalized': (/^(yes|true|1)$/i.test(v) ? '1' : '0'),
              'value': v
            };
          },
        peg$c175 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'name',
              'name': n
            };
          },
        peg$c176 = { type: "other", description: "SELECT Statement" },
        peg$c177 = function(s, o, l) {
            return util.extend(s, o, l);
          },
        peg$c178 = { type: "other", description: "ORDER BY Clause" },
        peg$c179 = function(d) {
            return {
              'order': d
            };
          },
        peg$c180 = { type: "other", description: "LIMIT Clause" },
        peg$c181 = function(s, e, d) {
            return {
              'limit': util.extend({
                'type': 'expression',
                'variant': 'limit',
                'start': e
              }, d)
            };
          },
        peg$c182 = { type: "other", description: "OFFSET Clause" },
        peg$c183 = function(o, e) {
            return {
              'offset': e
            };
          },
        peg$c184 = function(s, u) {
            if (util.isArrayOkay(u)) {
              return {
                'type': 'statement',
                'variant': 'compound',
                'statement': s,
                'compound': u
              };
            } else {
              return s;
            }
          },
        peg$c185 = { type: "other", description: "Union Operation" },
        peg$c186 = function(c, s) {
            return {
              'type': 'compound',
              'variant': c,
              'statement': s
            };
          },
        peg$c187 = function(s, f, w, g) {
            return util.extend({
              'type': 'statement',
              'variant': 'select',
            }, s, f, w, g);
          },
        peg$c188 = { type: "other", description: "SELECT Results Clause" },
        peg$c189 = function(d, t) {
            return util.extend({
              'result': t
            }, d);
          },
        peg$c190 = { type: "other", description: "SELECT Results Modifier" },
        peg$c191 = function(s) {
            return {
              'distinct': true
            };
          },
        peg$c192 = function(s) {
            return {};
          },
        peg$c193 = { type: "other", description: "FROM Clause" },
        peg$c194 = function(s) {
            return {
              'from': s
            };
          },
        peg$c195 = { type: "other", description: "WHERE Clause" },
        peg$c196 = function(s, e) {
            return {
              'where': util.makeArray(e)
            };
          },
        peg$c197 = { type: "other", description: "GROUP BY Clause" },
        peg$c198 = function(s, e, h) {
            return util.extend({
              'group': util.makeArray(e)
            }, h);
          },
        peg$c199 = { type: "other", description: "HAVING Clause" },
        peg$c200 = function(s, e) {
            return {
              'having': e
            };
          },
        peg$c201 = function(q, s) {
            return {
              'type': 'identifier',
              'variant': 'star',
              'name': util.textMerge(q, s)
            };
          },
        peg$c202 = function(n, s) { return util.textMerge(n, s); },
        peg$c203 = function(e, a) {
            return util.extend(e, a);
          },
        peg$c204 = function(f, t) { return util.listify(f, t); },
        peg$c205 = { type: "other", description: "Qualified Table" },
        peg$c206 = function(d, i) {
            return util.extend(d, i);
          },
        peg$c207 = { type: "other", description: "Qualified Table Identifier" },
        peg$c208 = function(n, a) {
            return util.extend(n, a);
          },
        peg$c209 = { type: "other", description: "Qualfied Table Index" },
        peg$c210 = function(s, n) {
            return {
              'index': n
            };
          },
        peg$c211 = function(n, i) {
            // TODO: Not sure what should happen here
            return {
              'index': util.keyify([n, i])
            };
          },
        peg$c212 = { type: "other", description: "SELECT Source" },
        peg$c213 = function(l) { return l; },
        peg$c214 = { type: "other", description: "Subquery" },
        peg$c215 = function(s, a) {
            return util.extend(s, a);
          },
        peg$c216 = { type: "other", description: "Alias" },
        peg$c217 = function(a, n) {
            return {
              'alias': n
            };
          },
        peg$c218 = function(t, j) {
            return {
              'type': 'map',
              'variant': 'join',
              'source': t,
              'map': j
            };
          },
        peg$c219 = { type: "other", description: "JOIN Operation" },
        peg$c220 = function(o, n, c) {
            return {
              'type': 'join',
              'variant': util.key(o),
              'source': n,
              'constraint': c
            };
          },
        peg$c221 = { type: "other", description: "JOIN Operator" },
        peg$c222 = function(n, t, j) { return util.compose([n, t, j]); },
        peg$c223 = function(t, o) { return util.compose([t, o]); },
        peg$c224 = function(t) { return util.textNode(t); },
        peg$c225 = { type: "other", description: "JOIN Constraint" },
        peg$c226 = function(c) {
            return util.extend({
              'type': 'constraint',
              'variant': 'join'
            }, c);
          },
        peg$c227 = { type: "other", description: "Join ON Clause" },
        peg$c228 = function(s, e) {
            return {
              'format': util.key(s),
              'on': e
            };
          },
        peg$c229 = { type: "other", description: "Join USING Clause" },
        peg$c230 = function(s, e) {
            return {
              'format': util.key(s),
              'using': e
            };
          },
        peg$c231 = { type: "other", description: "VALUES Clause" },
        peg$c232 = function(s, l) {
            return util.extend({
              'type': 'statement',
              'variant': 'select'
            }, l);
          },
        peg$c233 = function(f, b) {
            return {
              'result': util.listify(f, b)
            };
          },
        peg$c234 = function(i) { return i; },
        peg$c235 = { type: "other", description: "Ordering Expression" },
        peg$c236 = function(e, c, d) {
            return util.extend({
              'type': 'expression',
              'variant': 'order',
              'expression': e
            }, c, d);
          },
        peg$c237 = { type: "other", description: "Star" },
        peg$c238 = { type: "other", description: "Fallback Type" },
        peg$c239 = function(k) { return k; },
        peg$c240 = { type: "other", description: "INSERT Statement" },
        peg$c241 = function(k, t) {
            return util.extend({
              'type': 'statement',
              'variant': 'insert'
            }, k, t);
          },
        peg$c242 = { type: "other", description: "INSERT Keyword" },
        peg$c243 = function(a, m) {
            return util.extend({
              'action': util.key(a)
            }, m);
          },
        peg$c244 = { type: "other", description: "REPLACE Keyword" },
        peg$c245 = function(a) {
            return {
              'action': util.key(a)
            };
          },
        peg$c246 = { type: "other", description: "INSERT OR Modifier" },
        peg$c247 = function(s, m) {
            return {
              'or': util.key(m)
            };
          },
        peg$c248 = function(i, r) {
            return util.extend({
              'into': i
            }, r);
          },
        peg$c249 = { type: "other", description: "INTO Clause" },
        peg$c250 = function(s, t) {
            return t;
          },
        peg$c251 = { type: "other", description: "INTO Keyword" },
        peg$c252 = function(r) {
            return {
              'result': r
            };
          },
        peg$c253 = { type: "other", description: "Column List" },
        peg$c254 = function(f, b) {
            return {
              'columns': util.listify(f, b)
            };
          },
        peg$c255 = function(c) { return c; },
        peg$c256 = { type: "other", description: "Column Name" },
        peg$c257 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'column',
              'name': n
            };
          },
        peg$c258 = function(s, r) { return r; },
        peg$c259 = { type: "other", description: "VALUES Keyword" },
        peg$c260 = function(f, b) { return util.listify(f, b); },
        peg$c261 = { type: "other", description: "Insert Values List" },
        peg$c262 = function(e) {
            return {
              'type': 'values',
              'variant': 'list',
              'values': e
            };
          },
        peg$c263 = { type: "other", description: "DEFAULT VALUES Clause" },
        peg$c264 = function(d, v) {
            return {
              'type': 'values',
              'variant': 'default'
              // TODO: Not sure what should go here
              // , 'values': null
            };
          },
        peg$c265 = { type: "other", description: "Compound Operator" },
        peg$c266 = { type: "other", description: "UNION Operator" },
        peg$c267 = function(s, a) { return util.compose([s, a]); },
        peg$c268 = function(a) { return a; },
        peg$c269 = { type: "other", description: "UPDATE Statement" },
        peg$c270 = function(s, f, t, u, w, o, l) {
            return util.extend({
              'type': 'statement',
              'variant': s,
              'into': t
            }, f, u, w, o, l);
          },
        peg$c271 = { type: "other", description: "UPDATE Keyword" },
        peg$c272 = { type: "other", description: "UPDATE OR Modifier" },
        peg$c273 = function(t) {
            return {
              'or': util.key(t)
            };
          },
        peg$c274 = { type: "other", description: "SET Clause" },
        peg$c275 = function(c) {
            return {
              'set': c
            };
          },
        peg$c276 = { type: "other", description: "Column Assignment" },
        peg$c277 = function(f, e) {
            return {
              'type': 'assignment',
              'target': f,
              'value': e
            };
          },
        peg$c278 = { type: "other", description: "DELETE Statement" },
        peg$c279 = function(s, t, w, o, l) {
            return util.extend({
              'type': 'statement',
              'variant': s,
              'from': t
            }, w, o, l);
          },
        peg$c280 = { type: "other", description: "DELETE Keyword" },
        peg$c281 = { type: "other", description: "CREATE Statement" },
        peg$c282 = { type: "other", description: "CREATE TABLE Statement" },
        peg$c283 = function(s, ne, id, r) {
            return util.extend({
              'type': 'statement',
              'name': id
            }, s, r, ne);
          },
        peg$c284 = function(s, tmp, t) {
            return util.extend({
              'variant': s,
              'format': util.key(t)
            }, tmp);
          },
        peg$c285 = function(t) {
            return {
              'temporary': util.isOkay(t)
            };
          },
        peg$c286 = { type: "other", description: "IF NOT EXISTS Modifier" },
        peg$c287 = function(i, n, e) {
            return {
              'condition': util.makeArray({
                'type': 'condition',
                'condition': util.keyify([i, n, e])
              })
            };
          },
        peg$c288 = { type: "other", description: "Table Definition" },
        peg$c289 = function(s, t, r) {
            return util.extend({
              'definition': util.listify(s, t)
            }, r);
          },
        peg$c290 = function(r, w) {
            return {
              'optimization': [{
                'type': 'optimization',
                'value': util.keyify([r, w])
              }]
            };
          },
        peg$c291 = function(f) { return f; },
        peg$c292 = { type: "other", description: "Column Definition" },
        peg$c293 = function(n, t, c) {
            return util.extend({
              'type': 'definition',
              'variant': 'column',
              'name': n,
              'definition': (util.isOkay(c) ? c : []),
            }, t);
          },
        peg$c294 = { type: "other", description: "Column Datatype" },
        peg$c295 = function(t) {
            return {
              'datatype': t
            };
          },
        peg$c296 = { type: "other", description: "Column Constraint" },
        peg$c297 = function(n, c) {
            return util.extend(c, n);
          },
        peg$c298 = { type: "other", description: "Column Constraint Name" },
        peg$c299 = function(n) {
            return {
              'name': n
            };
          },
        peg$c300 = { type: "other", description: "FOREIGN KEY Column Constraint" },
        peg$c301 = function(f) {
            return util.extend({
              'variant': 'foreign key'
            }, f);
          },
        peg$c302 = { type: "other", description: "PRIMARY KEY Column Constraint" },
        peg$c303 = function(p, d, c, a) {
            return util.extend(p, c, d, a);
          },
        peg$c304 = { type: "other", description: "PRIMARY KEY Keyword" },
        peg$c305 = function(s, k) {
            return {
              'type': 'constraint',
              'variant': util.keyify([s, k])
            };
          },
        peg$c306 = { type: "other", description: "AUTOINCREMENT Keyword" },
        peg$c307 = function(a) {
            return {
              'autoIncrement': true
            };
          },
        peg$c308 = function(s, c) {
            return util.extend({
              'type': 'constraint',
              'variant': s
            }, c);
          },
        peg$c309 = { type: "other", description: "UNIQUE Column Constraint" },
        peg$c310 = { type: "other", description: "NULL Column Constraint" },
        peg$c311 = function(n, l) { return util.compose([n, l]); },
        peg$c312 = { type: "other", description: "CHECK Column Constraint" },
        peg$c313 = { type: "other", description: "DEFAULT Column Constraint" },
        peg$c314 = function(s, v) {
            return {
              'type': 'constraint',
              'variant': util.key(s),
              'value': v
            };
          },
        peg$c315 = { type: "other", description: "COLLATE Column Constraint" },
        peg$c316 = function(c) {
            return {
              'type': 'constraint',
              'variant': 'collate',
              'collate': c
            };
          },
        peg$c317 = { type: "other", description: "Table Constraint" },
        peg$c318 = function(n, c) {
            return util.extend({
              'type': 'definition',
              'variant': 'constraint'
            }, c, n);
          },
        peg$c319 = { type: "other", description: "Table Constraint Name" },
        peg$c320 = { type: "other", description: "CHECK Table Constraint" },
        peg$c321 = function(c) {
            return {
              'definition': util.makeArray(c)
            };
          },
        peg$c322 = { type: "other", description: "PRIMARY KEY Table Constraint" },
        peg$c323 = function(k, c, t) {
            return {
              'definition': util.makeArray(util.extend(k, t)),
              'columns': c
            };
          },
        peg$c324 = function(s) {
            return {
              'type': 'constraint',
              'variant': util.key(s)
            };
          },
        peg$c325 = function(p, k) { return util.compose([p, k]); },
        peg$c326 = { type: "other", description: "UNIQUE Keyword" },
        peg$c327 = function(u) { return util.textNode(u); },
        peg$c328 = { type: "other", description: "PRIMARY KEY Columns" },
        peg$c329 = { type: "other", description: "Indexed Column" },
        peg$c330 = function(e, c, d) {
            return util.extend({
              'type': 'identifier',
              'variant': 'column',
              'format': 'indexed',
              'name': e
            }, c, d);
          },
        peg$c331 = { type: "other", description: "Column Collation" },
        peg$c332 = function(n) {
            return {
              'collate': n
            };
          },
        peg$c333 = { type: "other", description: "Column Direction" },
        peg$c334 = function(t) {
            return {
              'direction': util.key(t),
            };
          },
        peg$c335 = function(s, t) {
            return {
              'conflict': util.key(t)
            };
          },
        peg$c336 = { type: "other", description: "ON CONFLICT Keyword" },
        peg$c337 = function(o, c) { return util.keyify([o, c]); },
        peg$c338 = function(k, c) {
            return {
              'type': 'constraint',
              'variant': util.key(k),
              'expression': c
            };
          },
        peg$c339 = { type: "other", description: "FOREIGN KEY Table Constraint" },
        peg$c340 = function(k, l, c) {
            return util.extend({
              'definition': util.makeArray(util.extend(k, c))
            }, l);
          },
        peg$c341 = { type: "other", description: "FOREIGN KEY Keyword" },
        peg$c342 = function(f, k) {
            return {
              'type': 'constraint',
              'variant': util.keyify([f, k])
            };
          },
        peg$c343 = function(r, a, d) {
            return util.extend({
              'type': 'constraint',
              'action': a,
              'defer': d
            }, r);
          },
        peg$c344 = { type: "other", description: "REFERENCES Clause" },
        peg$c345 = function(s, t) {
            return {
              'references': t
            };
          },
        peg$c346 = function(f, b) { return util.collect([f, b], []); },
        peg$c347 = { type: "other", description: "FOREIGN KEY Action Clause" },
        peg$c348 = function(m, a, n) {
            return {
              'type': 'action',
              'variant': util.key(m),
              'action': util.key(n)
            };
          },
        peg$c349 = { type: "other", description: "FOREIGN KEY Action" },
        peg$c350 = function(s, v) { return util.compose([s, v]); },
        peg$c351 = function(c) { return util.textNode(c); },
        peg$c352 = function(n, a) { return util.compose([n, a]); },
        peg$c353 = function(m, n) {
            return {
              'type': 'action',
              'variant': util.key(m),
              'action': n
            };
          },
        peg$c354 = { type: "other", description: "DEFERRABLE Clause" },
        peg$c355 = function(n, d, i) { return util.keyify([n, d, i]); },
        peg$c356 = function(i, d) { return util.compose([i, d]); },
        peg$c357 = function(s) {
            return {
              'definition': util.makeArray(s)
            };
          },
        peg$c358 = { type: "other", description: "CREATE INDEX Statement" },
        peg$c359 = function(s, ne, n, o, w) {
            return util.extend({
              'type': 'statement',
              'target': n,
              'on': o,
            }, s, ne, w);
          },
        peg$c360 = function(s, u, i) {
            return util.extend({
              'variant': util.key(s),
              'format': util.key(i)
            }, u);
          },
        peg$c361 = function(u) {
            return {
              'unique': true
            };
          },
        peg$c362 = { type: "other", description: "ON Clause" },
        peg$c363 = function(o, t, c) {
            return {
              'target': t,
              'columns': c
            };
          },
        peg$c364 = { type: "other", description: "CREATE TRIGGER Statement" },
        peg$c365 = function(s, ne, n, cd, o, me, wh, a) {
            return util.extend({
              'type': 'statement',
              'target': n,
              'on': o,
              'event': cd,
              'by': (util.isOkay(me) ? me : 'row'),
              'action': util.makeArray(a)
            }, s, ne, wh);
          },
        peg$c366 = function(s, tmp, t) {
            return util.extend({
              'variant': util.key(s),
              'format': util.key(t)
            }, tmp);
          },
        peg$c367 = { type: "other", description: "Conditional Clause" },
        peg$c368 = function(m, d) {
            return util.extend({
              'type': 'event'
            }, m, d);
          },
        peg$c369 = function(m) {
            return {
              'occurs': util.key(m)
            };
          },
        peg$c370 = function(i, o) { return util.compose([i, o]); },
        peg$c371 = { type: "other", description: "Conditional Action" },
        peg$c372 = function(o) {
            return {
              'event': util.key(o)
            };
          },
        peg$c373 = function(s, f) {
            return {
              'event': util.key(s),
              'of': f
            };
          },
        peg$c374 = function(s, c) { return c; },
        peg$c375 = "statement",
        peg$c376 = { type: "literal", value: "STATEMENT", description: "\"STATEMENT\"i" },
        peg$c377 = function(f, e, r) { return util.key(r); },
        peg$c378 = function(w, e) { return e; },
        peg$c379 = { type: "other", description: "Actions Clause" },
        peg$c380 = function(s, a, e) { return a; },
        peg$c381 = { type: "other", description: "CREATE VIEW Statement" },
        peg$c382 = function(s, ne, n, r) {
            return util.extend({
              'type': 'statement',
              'target': n,
              'result': r
            }, s, ne);
          },
        peg$c383 = function(s, tmp, v) {
            return util.extend({
              'variant': util.key(s),
              'format': util.key(v)
            }, tmp);
          },
        peg$c384 = { type: "other", description: "CREATE VIRTUAL TABLE Statement" },
        peg$c385 = function(s, ne, n, m) {
            return util.extend({
              'type': 'statement',
              'target': n,
              'result': m
            }, s, ne);
          },
        peg$c386 = function(s, v, t) {
            return {
              'variant': util.key(s),
              'format': util.key(v)
            };
          },
        peg$c387 = function(m, a) {
            return util.extend({
              'type': 'module',
              'name': m,
              'args': []
            }, a);
          },
        peg$c388 = { type: "other", description: "Module Arguments" },
        peg$c389 = function(f) {
            return {
              'args': f
            };
          },
        peg$c390 = { type: "other", description: "DROP Statement" },
        peg$c391 = function(s, q) {
            /**
             * @note Manually copy in the correct variant for the target
             */
            return util.extend({
              'type': 'statement',
              'target': util.extend(q, {
                          'variant': s['format']
                        })
            }, s);
          },
        peg$c392 = { type: "other", description: "DROP Keyword" },
        peg$c393 = function(s, t, i) {
             return util.extend({
               'variant': util.key(s),
               'format': t,
               'condition': []
             }, i);
          },
        peg$c394 = { type: "other", description: "DROP Type" },
        peg$c395 = function(c) {
            return {
              'condition': util.makeArray(c)
            };
          },
        peg$c396 = { type: "other", description: "IF EXISTS Keyword" },
        peg$c397 = function(i, e) {
            return {
              'type': 'condition',
              'condition': util.keyify([i, e])
            };
          },
        peg$c398 = { type: "other", description: "Unary Operator" },
        peg$c399 = { type: "other", description: "Binary Operator" },
        peg$c400 = function(o) { return util.key(o); },
        peg$c401 = { type: "other", description: "Or" },
        peg$c402 = { type: "other", description: "Add" },
        peg$c403 = { type: "other", description: "Subtract" },
        peg$c404 = { type: "other", description: "Multiply" },
        peg$c405 = { type: "other", description: "Modulo" },
        peg$c406 = { type: "other", description: "Shift Left" },
        peg$c407 = { type: "other", description: "Shift Right" },
        peg$c408 = { type: "other", description: "Logical AND" },
        peg$c409 = { type: "other", description: "Logical OR" },
        peg$c410 = { type: "other", description: "Less Than" },
        peg$c411 = { type: "other", description: "Greater Than" },
        peg$c412 = { type: "other", description: "Less Than Or Equal" },
        peg$c413 = { type: "other", description: "Greater Than Or Equal" },
        peg$c414 = { type: "other", description: "Equal" },
        peg$c415 = { type: "other", description: "Not Equal" },
        peg$c416 = { type: "other", description: "IS" },
        peg$c417 = function(m) { return util.key(m); },
        peg$c418 = { type: "other", description: "Database Identifier" },
        peg$c419 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'database',
              'name': n
            };
          },
        peg$c420 = { type: "other", description: "Table Identifier" },
        peg$c421 = function(d, n) {
            return {
              'type': 'identifier',
              'variant': 'table',
              'name': util.textMerge(d, n)
            };
          },
        peg$c422 = function(n, d) { return util.textMerge(n, d); },
        peg$c423 = { type: "other", description: "Column Identifier" },
        peg$c424 = function(q, n) {
            return {
              'type': 'identifier',
              'variant': 'column',
              'name': util.textMerge(q, n)
            };
          },
        peg$c425 = function() { return ''; },
        peg$c426 = function(d, t) { return util.textMerge(d, t); },
        peg$c427 = { type: "other", description: "Collation Identifier" },
        peg$c428 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'collation',
              'name': n
            };
          },
        peg$c429 = { type: "other", description: "Savepoint Indentifier" },
        peg$c430 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'savepoint',
              'name': n
            };
          },
        peg$c431 = { type: "other", description: "Index Identifier" },
        peg$c432 = function(d, n) {
            return {
              'type': 'identifier',
              'variant': 'index',
              'name': util.textMerge(d, n)
            };
          },
        peg$c433 = { type: "other", description: "Trigger Identifier" },
        peg$c434 = function(d, n) {
            return {
              'type': 'identifier',
              'variant': 'trigger',
              'name': util.textMerge(d, n)
            };
          },
        peg$c435 = { type: "other", description: "View Identifier" },
        peg$c436 = function(d, n) {
            return {
              'type': 'identifier',
              'variant': 'view',
              'name': util.textMerge(d, n)
            };
          },
        peg$c437 = { type: "other", description: "Pragma Identifier" },
        peg$c438 = function(d, n) {
            return {
              'type': 'identifier',
              'variant': 'pragma',
              'name': util.textMerge(d, n)
            };
          },
        peg$c439 = { type: "other", description: "CTE Identifier" },
        peg$c440 = function(n, a) {
            return util.extend({
              'type': 'identifier',
              'variant': 'expression',
              'format': 'table',
              'name': n,
              'columns': []
            }, a);
          },
        peg$c441 = { type: "other", description: "Table Constraint Identifier" },
        peg$c442 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'constraint',
              'format': 'table',
              'name': n
            };
          },
        peg$c443 = { type: "other", description: "Column Constraint Identifier" },
        peg$c444 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'constraint',
              'format': 'column',
              'name': n
            };
          },
        peg$c445 = { type: "other", description: "Datatype Name" },
        peg$c446 = function(t) { return [t, 'text']; },
        peg$c447 = function(t) { return [t, 'real']; },
        peg$c448 = function(t) { return [t, 'numeric']; },
        peg$c449 = function(t) { return [t, 'integer']; },
        peg$c450 = function(t) { return [t, 'none']; },
        peg$c451 = { type: "other", description: "TEXT Datatype Name" },
        peg$c452 = "n",
        peg$c453 = { type: "literal", value: "N", description: "\"N\"i" },
        peg$c454 = "var",
        peg$c455 = { type: "literal", value: "VAR", description: "\"VAR\"i" },
        peg$c456 = "char",
        peg$c457 = { type: "literal", value: "CHAR", description: "\"CHAR\"i" },
        peg$c458 = "tiny",
        peg$c459 = { type: "literal", value: "TINY", description: "\"TINY\"i" },
        peg$c460 = "medium",
        peg$c461 = { type: "literal", value: "MEDIUM", description: "\"MEDIUM\"i" },
        peg$c462 = "long",
        peg$c463 = { type: "literal", value: "LONG", description: "\"LONG\"i" },
        peg$c464 = "text",
        peg$c465 = { type: "literal", value: "TEXT", description: "\"TEXT\"i" },
        peg$c466 = "clob",
        peg$c467 = { type: "literal", value: "CLOB", description: "\"CLOB\"i" },
        peg$c468 = { type: "other", description: "REAL Datatype Name" },
        peg$c469 = "float",
        peg$c470 = { type: "literal", value: "FLOAT", description: "\"FLOAT\"i" },
        peg$c471 = "real",
        peg$c472 = { type: "literal", value: "REAL", description: "\"REAL\"i" },
        peg$c473 = { type: "other", description: "DOUBLE Datatype Name" },
        peg$c474 = "double",
        peg$c475 = { type: "literal", value: "DOUBLE", description: "\"DOUBLE\"i" },
        peg$c476 = function(d, p) { return util.compose([d, p]); },
        peg$c477 = "precision",
        peg$c478 = { type: "literal", value: "PRECISION", description: "\"PRECISION\"i" },
        peg$c479 = function(p) { return p; },
        peg$c480 = { type: "other", description: "NUMERIC Datatype Name" },
        peg$c481 = "numeric",
        peg$c482 = { type: "literal", value: "NUMERIC", description: "\"NUMERIC\"i" },
        peg$c483 = "decimal",
        peg$c484 = { type: "literal", value: "DECIMAL", description: "\"DECIMAL\"i" },
        peg$c485 = "boolean",
        peg$c486 = { type: "literal", value: "BOOLEAN", description: "\"BOOLEAN\"i" },
        peg$c487 = "date",
        peg$c488 = { type: "literal", value: "DATE", description: "\"DATE\"i" },
        peg$c489 = "time",
        peg$c490 = { type: "literal", value: "TIME", description: "\"TIME\"i" },
        peg$c491 = "stamp",
        peg$c492 = { type: "literal", value: "STAMP", description: "\"STAMP\"i" },
        peg$c493 = { type: "other", description: "INTEGER Datatype Name" },
        peg$c494 = "int",
        peg$c495 = { type: "literal", value: "INT", description: "\"INT\"i" },
        peg$c496 = "2",
        peg$c497 = { type: "literal", value: "2", description: "\"2\"" },
        peg$c498 = "4",
        peg$c499 = { type: "literal", value: "4", description: "\"4\"" },
        peg$c500 = "8",
        peg$c501 = { type: "literal", value: "8", description: "\"8\"" },
        peg$c502 = "eger",
        peg$c503 = { type: "literal", value: "EGER", description: "\"EGER\"i" },
        peg$c504 = "big",
        peg$c505 = { type: "literal", value: "BIG", description: "\"BIG\"i" },
        peg$c506 = "small",
        peg$c507 = { type: "literal", value: "SMALL", description: "\"SMALL\"i" },
        peg$c508 = { type: "other", description: "BLOB Datatype Name" },
        peg$c509 = "blob",
        peg$c510 = { type: "literal", value: "BLOB", description: "\"BLOB\"i" },
        peg$c511 = /^[a-z0-9$_]/i,
        peg$c512 = { type: "class", value: "[a-z0-9\\$\\_]i", description: "[a-z0-9\\$\\_]i" },
        peg$c513 = function(n) { return util.key(n); },
        peg$c514 = "]",
        peg$c515 = { type: "literal", value: "]", description: "\"]\"" },
        peg$c516 = /^[^\]]/,
        peg$c517 = { type: "class", value: "[^\\]]", description: "[^\\]]" },
        peg$c518 = "\"",
        peg$c519 = { type: "literal", value: "\"", description: "'\"'" },
        peg$c520 = function(n) { return util.unescape(n, '"'); },
        peg$c521 = "\"\"",
        peg$c522 = { type: "literal", value: "\"\"", description: "'\"\"'" },
        peg$c523 = /^[^"]/,
        peg$c524 = { type: "class", value: "[^\\\"]", description: "[^\\\"]" },
        peg$c525 = "'",
        peg$c526 = { type: "literal", value: "'", description: "\"'\"" },
        peg$c527 = function(n) { return util.unescape(n, "'"); },
        peg$c528 = "`",
        peg$c529 = { type: "literal", value: "`", description: "'`'" },
        peg$c530 = function(n) { return util.unescape(n, '`'); },
        peg$c531 = "``",
        peg$c532 = { type: "literal", value: "``", description: "'``'" },
        peg$c533 = /^[^`]/,
        peg$c534 = { type: "class", value: "[^\\`]", description: "[^\\`]" },
        peg$c535 = { type: "other", description: "Open Bracket" },
        peg$c536 = "[",
        peg$c537 = { type: "literal", value: "[", description: "\"[\"" },
        peg$c538 = { type: "other", description: "Close Bracket" },
        peg$c539 = { type: "other", description: "Open Parenthesis" },
        peg$c540 = "(",
        peg$c541 = { type: "literal", value: "(", description: "\"(\"" },
        peg$c542 = { type: "other", description: "Close Parenthesis" },
        peg$c543 = ")",
        peg$c544 = { type: "literal", value: ")", description: "\")\"" },
        peg$c545 = { type: "other", description: "Comma" },
        peg$c546 = ",",
        peg$c547 = { type: "literal", value: ",", description: "\",\"" },
        peg$c548 = { type: "other", description: "Period" },
        peg$c549 = ".",
        peg$c550 = { type: "literal", value: ".", description: "\".\"" },
        peg$c551 = { type: "other", description: "Asterisk" },
        peg$c552 = "*",
        peg$c553 = { type: "literal", value: "*", description: "\"*\"" },
        peg$c554 = { type: "other", description: "Question Mark" },
        peg$c555 = "?",
        peg$c556 = { type: "literal", value: "?", description: "\"?\"" },
        peg$c557 = { type: "other", description: "Single Quote" },
        peg$c558 = { type: "other", description: "Double Quote" },
        peg$c559 = { type: "other", description: "Backtick" },
        peg$c560 = { type: "literal", value: "`", description: "\"`\"" },
        peg$c561 = { type: "other", description: "Tilde" },
        peg$c562 = "~",
        peg$c563 = { type: "literal", value: "~", description: "\"~\"" },
        peg$c564 = { type: "other", description: "Plus" },
        peg$c565 = "+",
        peg$c566 = { type: "literal", value: "+", description: "\"+\"" },
        peg$c567 = { type: "other", description: "Minus" },
        peg$c568 = "-",
        peg$c569 = { type: "literal", value: "-", description: "\"-\"" },
        peg$c570 = "=",
        peg$c571 = { type: "literal", value: "=", description: "\"=\"" },
        peg$c572 = { type: "other", description: "Ampersand" },
        peg$c573 = "&",
        peg$c574 = { type: "literal", value: "&", description: "\"&\"" },
        peg$c575 = { type: "other", description: "Pipe" },
        peg$c576 = "|",
        peg$c577 = { type: "literal", value: "|", description: "\"|\"" },
        peg$c578 = "%",
        peg$c579 = { type: "literal", value: "%", description: "\"%\"" },
        peg$c580 = "<",
        peg$c581 = { type: "literal", value: "<", description: "\"<\"" },
        peg$c582 = ">",
        peg$c583 = { type: "literal", value: ">", description: "\">\"" },
        peg$c584 = { type: "other", description: "Exclamation" },
        peg$c585 = "!",
        peg$c586 = { type: "literal", value: "!", description: "\"!\"" },
        peg$c587 = { type: "other", description: "Semicolon" },
        peg$c588 = ";",
        peg$c589 = { type: "literal", value: ";", description: "\";\"" },
        peg$c590 = { type: "other", description: "Colon" },
        peg$c591 = { type: "other", description: "Forward Slash" },
        peg$c592 = "/",
        peg$c593 = { type: "literal", value: "/", description: "\"/\"" },
        peg$c594 = { type: "other", description: "Backslash" },
        peg$c595 = "\\",
        peg$c596 = { type: "literal", value: "\\", description: "\"\\\\\"" },
        peg$c597 = "abort",
        peg$c598 = { type: "literal", value: "ABORT", description: "\"ABORT\"i" },
        peg$c599 = "action",
        peg$c600 = { type: "literal", value: "ACTION", description: "\"ACTION\"i" },
        peg$c601 = "add",
        peg$c602 = { type: "literal", value: "ADD", description: "\"ADD\"i" },
        peg$c603 = "after",
        peg$c604 = { type: "literal", value: "AFTER", description: "\"AFTER\"i" },
        peg$c605 = "all",
        peg$c606 = { type: "literal", value: "ALL", description: "\"ALL\"i" },
        peg$c607 = "alter",
        peg$c608 = { type: "literal", value: "ALTER", description: "\"ALTER\"i" },
        peg$c609 = "analyze",
        peg$c610 = { type: "literal", value: "ANALYZE", description: "\"ANALYZE\"i" },
        peg$c611 = "and",
        peg$c612 = { type: "literal", value: "AND", description: "\"AND\"i" },
        peg$c613 = "as",
        peg$c614 = { type: "literal", value: "AS", description: "\"AS\"i" },
        peg$c615 = "asc",
        peg$c616 = { type: "literal", value: "ASC", description: "\"ASC\"i" },
        peg$c617 = "attach",
        peg$c618 = { type: "literal", value: "ATTACH", description: "\"ATTACH\"i" },
        peg$c619 = "autoincrement",
        peg$c620 = { type: "literal", value: "AUTOINCREMENT", description: "\"AUTOINCREMENT\"i" },
        peg$c621 = "before",
        peg$c622 = { type: "literal", value: "BEFORE", description: "\"BEFORE\"i" },
        peg$c623 = "begin",
        peg$c624 = { type: "literal", value: "BEGIN", description: "\"BEGIN\"i" },
        peg$c625 = "between",
        peg$c626 = { type: "literal", value: "BETWEEN", description: "\"BETWEEN\"i" },
        peg$c627 = "by",
        peg$c628 = { type: "literal", value: "BY", description: "\"BY\"i" },
        peg$c629 = "cascade",
        peg$c630 = { type: "literal", value: "CASCADE", description: "\"CASCADE\"i" },
        peg$c631 = "case",
        peg$c632 = { type: "literal", value: "CASE", description: "\"CASE\"i" },
        peg$c633 = "cast",
        peg$c634 = { type: "literal", value: "CAST", description: "\"CAST\"i" },
        peg$c635 = "check",
        peg$c636 = { type: "literal", value: "CHECK", description: "\"CHECK\"i" },
        peg$c637 = "collate",
        peg$c638 = { type: "literal", value: "COLLATE", description: "\"COLLATE\"i" },
        peg$c639 = "column",
        peg$c640 = { type: "literal", value: "COLUMN", description: "\"COLUMN\"i" },
        peg$c641 = "commit",
        peg$c642 = { type: "literal", value: "COMMIT", description: "\"COMMIT\"i" },
        peg$c643 = "conflict",
        peg$c644 = { type: "literal", value: "CONFLICT", description: "\"CONFLICT\"i" },
        peg$c645 = "constraint",
        peg$c646 = { type: "literal", value: "CONSTRAINT", description: "\"CONSTRAINT\"i" },
        peg$c647 = "create",
        peg$c648 = { type: "literal", value: "CREATE", description: "\"CREATE\"i" },
        peg$c649 = "cross",
        peg$c650 = { type: "literal", value: "CROSS", description: "\"CROSS\"i" },
        peg$c651 = "current_date",
        peg$c652 = { type: "literal", value: "CURRENT_DATE", description: "\"CURRENT_DATE\"i" },
        peg$c653 = "current_time",
        peg$c654 = { type: "literal", value: "CURRENT_TIME", description: "\"CURRENT_TIME\"i" },
        peg$c655 = "current_timestamp",
        peg$c656 = { type: "literal", value: "CURRENT_TIMESTAMP", description: "\"CURRENT_TIMESTAMP\"i" },
        peg$c657 = "database",
        peg$c658 = { type: "literal", value: "DATABASE", description: "\"DATABASE\"i" },
        peg$c659 = "default",
        peg$c660 = { type: "literal", value: "DEFAULT", description: "\"DEFAULT\"i" },
        peg$c661 = "deferrable",
        peg$c662 = { type: "literal", value: "DEFERRABLE", description: "\"DEFERRABLE\"i" },
        peg$c663 = "deferred",
        peg$c664 = { type: "literal", value: "DEFERRED", description: "\"DEFERRED\"i" },
        peg$c665 = "delete",
        peg$c666 = { type: "literal", value: "DELETE", description: "\"DELETE\"i" },
        peg$c667 = "desc",
        peg$c668 = { type: "literal", value: "DESC", description: "\"DESC\"i" },
        peg$c669 = "detach",
        peg$c670 = { type: "literal", value: "DETACH", description: "\"DETACH\"i" },
        peg$c671 = "distinct",
        peg$c672 = { type: "literal", value: "DISTINCT", description: "\"DISTINCT\"i" },
        peg$c673 = "drop",
        peg$c674 = { type: "literal", value: "DROP", description: "\"DROP\"i" },
        peg$c675 = "each",
        peg$c676 = { type: "literal", value: "EACH", description: "\"EACH\"i" },
        peg$c677 = "else",
        peg$c678 = { type: "literal", value: "ELSE", description: "\"ELSE\"i" },
        peg$c679 = "end",
        peg$c680 = { type: "literal", value: "END", description: "\"END\"i" },
        peg$c681 = "escape",
        peg$c682 = { type: "literal", value: "ESCAPE", description: "\"ESCAPE\"i" },
        peg$c683 = "except",
        peg$c684 = { type: "literal", value: "EXCEPT", description: "\"EXCEPT\"i" },
        peg$c685 = "exclusive",
        peg$c686 = { type: "literal", value: "EXCLUSIVE", description: "\"EXCLUSIVE\"i" },
        peg$c687 = "exists",
        peg$c688 = { type: "literal", value: "EXISTS", description: "\"EXISTS\"i" },
        peg$c689 = "explain",
        peg$c690 = { type: "literal", value: "EXPLAIN", description: "\"EXPLAIN\"i" },
        peg$c691 = "fail",
        peg$c692 = { type: "literal", value: "FAIL", description: "\"FAIL\"i" },
        peg$c693 = "for",
        peg$c694 = { type: "literal", value: "FOR", description: "\"FOR\"i" },
        peg$c695 = "foreign",
        peg$c696 = { type: "literal", value: "FOREIGN", description: "\"FOREIGN\"i" },
        peg$c697 = "from",
        peg$c698 = { type: "literal", value: "FROM", description: "\"FROM\"i" },
        peg$c699 = "full",
        peg$c700 = { type: "literal", value: "FULL", description: "\"FULL\"i" },
        peg$c701 = "glob",
        peg$c702 = { type: "literal", value: "GLOB", description: "\"GLOB\"i" },
        peg$c703 = "group",
        peg$c704 = { type: "literal", value: "GROUP", description: "\"GROUP\"i" },
        peg$c705 = "having",
        peg$c706 = { type: "literal", value: "HAVING", description: "\"HAVING\"i" },
        peg$c707 = "if",
        peg$c708 = { type: "literal", value: "IF", description: "\"IF\"i" },
        peg$c709 = "ignore",
        peg$c710 = { type: "literal", value: "IGNORE", description: "\"IGNORE\"i" },
        peg$c711 = "immediate",
        peg$c712 = { type: "literal", value: "IMMEDIATE", description: "\"IMMEDIATE\"i" },
        peg$c713 = "in",
        peg$c714 = { type: "literal", value: "IN", description: "\"IN\"i" },
        peg$c715 = "index",
        peg$c716 = { type: "literal", value: "INDEX", description: "\"INDEX\"i" },
        peg$c717 = "indexed",
        peg$c718 = { type: "literal", value: "INDEXED", description: "\"INDEXED\"i" },
        peg$c719 = "initially",
        peg$c720 = { type: "literal", value: "INITIALLY", description: "\"INITIALLY\"i" },
        peg$c721 = "inner",
        peg$c722 = { type: "literal", value: "INNER", description: "\"INNER\"i" },
        peg$c723 = "insert",
        peg$c724 = { type: "literal", value: "INSERT", description: "\"INSERT\"i" },
        peg$c725 = "instead",
        peg$c726 = { type: "literal", value: "INSTEAD", description: "\"INSTEAD\"i" },
        peg$c727 = "intersect",
        peg$c728 = { type: "literal", value: "INTERSECT", description: "\"INTERSECT\"i" },
        peg$c729 = "into",
        peg$c730 = { type: "literal", value: "INTO", description: "\"INTO\"i" },
        peg$c731 = "isnull",
        peg$c732 = { type: "literal", value: "ISNULL", description: "\"ISNULL\"i" },
        peg$c733 = "join",
        peg$c734 = { type: "literal", value: "JOIN", description: "\"JOIN\"i" },
        peg$c735 = "key",
        peg$c736 = { type: "literal", value: "KEY", description: "\"KEY\"i" },
        peg$c737 = "left",
        peg$c738 = { type: "literal", value: "LEFT", description: "\"LEFT\"i" },
        peg$c739 = "like",
        peg$c740 = { type: "literal", value: "LIKE", description: "\"LIKE\"i" },
        peg$c741 = "limit",
        peg$c742 = { type: "literal", value: "LIMIT", description: "\"LIMIT\"i" },
        peg$c743 = "match",
        peg$c744 = { type: "literal", value: "MATCH", description: "\"MATCH\"i" },
        peg$c745 = "natural",
        peg$c746 = { type: "literal", value: "NATURAL", description: "\"NATURAL\"i" },
        peg$c747 = "no",
        peg$c748 = { type: "literal", value: "NO", description: "\"NO\"i" },
        peg$c749 = "notnull",
        peg$c750 = { type: "literal", value: "NOTNULL", description: "\"NOTNULL\"i" },
        peg$c751 = "null",
        peg$c752 = { type: "literal", value: "NULL", description: "\"NULL\"i" },
        peg$c753 = "of",
        peg$c754 = { type: "literal", value: "OF", description: "\"OF\"i" },
        peg$c755 = "offset",
        peg$c756 = { type: "literal", value: "OFFSET", description: "\"OFFSET\"i" },
        peg$c757 = "on",
        peg$c758 = { type: "literal", value: "ON", description: "\"ON\"i" },
        peg$c759 = "or",
        peg$c760 = { type: "literal", value: "OR", description: "\"OR\"i" },
        peg$c761 = "order",
        peg$c762 = { type: "literal", value: "ORDER", description: "\"ORDER\"i" },
        peg$c763 = "outer",
        peg$c764 = { type: "literal", value: "OUTER", description: "\"OUTER\"i" },
        peg$c765 = "plan",
        peg$c766 = { type: "literal", value: "PLAN", description: "\"PLAN\"i" },
        peg$c767 = "pragma",
        peg$c768 = { type: "literal", value: "PRAGMA", description: "\"PRAGMA\"i" },
        peg$c769 = "primary",
        peg$c770 = { type: "literal", value: "PRIMARY", description: "\"PRIMARY\"i" },
        peg$c771 = "query",
        peg$c772 = { type: "literal", value: "QUERY", description: "\"QUERY\"i" },
        peg$c773 = "raise",
        peg$c774 = { type: "literal", value: "RAISE", description: "\"RAISE\"i" },
        peg$c775 = "recursive",
        peg$c776 = { type: "literal", value: "RECURSIVE", description: "\"RECURSIVE\"i" },
        peg$c777 = "references",
        peg$c778 = { type: "literal", value: "REFERENCES", description: "\"REFERENCES\"i" },
        peg$c779 = "regexp",
        peg$c780 = { type: "literal", value: "REGEXP", description: "\"REGEXP\"i" },
        peg$c781 = "reindex",
        peg$c782 = { type: "literal", value: "REINDEX", description: "\"REINDEX\"i" },
        peg$c783 = "release",
        peg$c784 = { type: "literal", value: "RELEASE", description: "\"RELEASE\"i" },
        peg$c785 = "rename",
        peg$c786 = { type: "literal", value: "RENAME", description: "\"RENAME\"i" },
        peg$c787 = "replace",
        peg$c788 = { type: "literal", value: "REPLACE", description: "\"REPLACE\"i" },
        peg$c789 = "restrict",
        peg$c790 = { type: "literal", value: "RESTRICT", description: "\"RESTRICT\"i" },
        peg$c791 = "right",
        peg$c792 = { type: "literal", value: "RIGHT", description: "\"RIGHT\"i" },
        peg$c793 = "rollback",
        peg$c794 = { type: "literal", value: "ROLLBACK", description: "\"ROLLBACK\"i" },
        peg$c795 = "row",
        peg$c796 = { type: "literal", value: "ROW", description: "\"ROW\"i" },
        peg$c797 = "rowid",
        peg$c798 = { type: "literal", value: "ROWID", description: "\"ROWID\"i" },
        peg$c799 = "savepoint",
        peg$c800 = { type: "literal", value: "SAVEPOINT", description: "\"SAVEPOINT\"i" },
        peg$c801 = "select",
        peg$c802 = { type: "literal", value: "SELECT", description: "\"SELECT\"i" },
        peg$c803 = "set",
        peg$c804 = { type: "literal", value: "SET", description: "\"SET\"i" },
        peg$c805 = "table",
        peg$c806 = { type: "literal", value: "TABLE", description: "\"TABLE\"i" },
        peg$c807 = "temp",
        peg$c808 = { type: "literal", value: "TEMP", description: "\"TEMP\"i" },
        peg$c809 = "temporary",
        peg$c810 = { type: "literal", value: "TEMPORARY", description: "\"TEMPORARY\"i" },
        peg$c811 = "then",
        peg$c812 = { type: "literal", value: "THEN", description: "\"THEN\"i" },
        peg$c813 = "to",
        peg$c814 = { type: "literal", value: "TO", description: "\"TO\"i" },
        peg$c815 = "transaction",
        peg$c816 = { type: "literal", value: "TRANSACTION", description: "\"TRANSACTION\"i" },
        peg$c817 = "trigger",
        peg$c818 = { type: "literal", value: "TRIGGER", description: "\"TRIGGER\"i" },
        peg$c819 = "union",
        peg$c820 = { type: "literal", value: "UNION", description: "\"UNION\"i" },
        peg$c821 = "unique",
        peg$c822 = { type: "literal", value: "UNIQUE", description: "\"UNIQUE\"i" },
        peg$c823 = "update",
        peg$c824 = { type: "literal", value: "UPDATE", description: "\"UPDATE\"i" },
        peg$c825 = "using",
        peg$c826 = { type: "literal", value: "USING", description: "\"USING\"i" },
        peg$c827 = "vacuum",
        peg$c828 = { type: "literal", value: "VACUUM", description: "\"VACUUM\"i" },
        peg$c829 = "values",
        peg$c830 = { type: "literal", value: "VALUES", description: "\"VALUES\"i" },
        peg$c831 = "view",
        peg$c832 = { type: "literal", value: "VIEW", description: "\"VIEW\"i" },
        peg$c833 = "virtual",
        peg$c834 = { type: "literal", value: "VIRTUAL", description: "\"VIRTUAL\"i" },
        peg$c835 = "when",
        peg$c836 = { type: "literal", value: "WHEN", description: "\"WHEN\"i" },
        peg$c837 = "where",
        peg$c838 = { type: "literal", value: "WHERE", description: "\"WHERE\"i" },
        peg$c839 = "with",
        peg$c840 = { type: "literal", value: "WITH", description: "\"WITH\"i" },
        peg$c841 = "without",
        peg$c842 = { type: "literal", value: "WITHOUT", description: "\"WITHOUT\"i" },
        peg$c843 = function(r) { return util.key(r); },
        peg$c844 = function() { return null; },
        peg$c845 = { type: "other", description: "Line Comment" },
        peg$c846 = "--",
        peg$c847 = { type: "literal", value: "--", description: "\"--\"" },
        peg$c848 = { type: "other", description: "Block Comment" },
        peg$c849 = "/*",
        peg$c850 = { type: "literal", value: "/*", description: "\"/*\"" },
        peg$c851 = "*/",
        peg$c852 = { type: "literal", value: "*/", description: "\"*/\"" },
        peg$c853 = { type: "any", description: "any character" },
        peg$c854 = { type: "other", description: "Whitespace" },
        peg$c855 = /^[ \t]/,
        peg$c856 = { type: "class", value: "[ \\t]", description: "[ \\t]" },
        peg$c857 = { type: "other", description: "New Line" },
        peg$c858 = /^[\n\x0B\f\r]/,
        peg$c859 = { type: "class", value: "[\\n\\v\\f\\r]", description: "[\\n\\v\\f\\r]" },
        peg$c860 = "__TODO__",
        peg$c861 = { type: "literal", value: "__TODO__", description: "\"__TODO__\"" },

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1, seenCR: false }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$savedPos, peg$currPos);
    }

    function location() {
      return peg$computeLocation(peg$savedPos, peg$currPos);
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function error(message) {
      throw peg$buildException(
        message,
        null,
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos],
          p, ch;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }

        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column,
          seenCR: details.seenCR
        };

        while (p < pos) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }

          p++;
        }

        peg$posDetailsCache[pos] = details;
        return details;
      }
    }

    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, location) {
      function cleanupExpected(expected) {
        var i, j;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        if (expected.length > 0) {
          for (i = 1, j = 1; i < expected.length; i++) {
            if (expected[i - 1] !== expected[i]) {
              expected[j] = expected[i];
              j++;
            }
          }
          expected.length = j;
        }
      }

      function buildMessage(expected) {
        var expectedDescs = new Array(expected.length),
            expectedDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        return "Expected " + expectedDesc + ".";
      }

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new peg$SyntaxError(
        message !== null ? message : buildMessage(expected),
        expected,
        location
      );
    }

    function peg$parsestart() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseo();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_list();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c0(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_list() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parsesemi_optional();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parsestmt_list_tail();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parsestmt_list_tail();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesemi_optional();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c1(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsesemi_optional() {
      var s0, s1;

      s0 = [];
      s1 = peg$parsesym_semi();
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parsesym_semi();
      }

      return s0;
    }

    function peg$parsesemi_required() {
      var s0, s1;

      s0 = [];
      s1 = peg$parsesym_semi();
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          s1 = peg$parsesym_semi();
        }
      } else {
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_list_tail() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesemi_required();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c2(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseexpression() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_concat();
      if (s1 === peg$FAILED) {
        s1 = peg$parseexpression_types();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c4(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c3); }
      }

      return s0;
    }

    function peg$parseexpression_types() {
      var s0;

      s0 = peg$parseexpression_wrapped();
      if (s0 === peg$FAILED) {
        s0 = peg$parseexpression_unary();
        if (s0 === peg$FAILED) {
          s0 = peg$parseexpression_node();
          if (s0 === peg$FAILED) {
            s0 = peg$parseexpression_value();
          }
        }
      }

      return s0;
    }

    function peg$parseexpression_concat() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_types();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsebinary_loop_concat();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseexpression();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c6(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c5); }
      }

      return s0;
    }

    function peg$parseexpression_wrapped() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c8(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c7); }
      }

      return s0;
    }

    function peg$parseexpression_value() {
      var s0;

      s0 = peg$parseexpression_cast();
      if (s0 === peg$FAILED) {
        s0 = peg$parseexpression_exists();
        if (s0 === peg$FAILED) {
          s0 = peg$parseexpression_case();
          if (s0 === peg$FAILED) {
            s0 = peg$parseexpression_raise();
            if (s0 === peg$FAILED) {
              s0 = peg$parsebind_parameter();
              if (s0 === peg$FAILED) {
                s0 = peg$parsefunction_call();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseliteral_value();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseid_column();
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseexpression_unary() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseoperator_unary();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression_types();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c10(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c9); }
      }

      return s0;
    }

    function peg$parseexpression_cast() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCAST();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_popen();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseexpression();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsetype_alias();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseo();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parsesym_pclose();
                    if (s8 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c12(s1, s4, s6);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c11); }
      }

      return s0;
    }

    function peg$parsetype_alias() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseAS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetype_definition();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c14(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c13); }
      }

      return s0;
    }

    function peg$parseexpression_exists() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_exists_ne();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseselect_wrapped();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c16(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c15); }
      }

      return s0;
    }

    function peg$parseexpression_exists_ne() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_is_not();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseEXISTS();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c18(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c17); }
      }

      return s0;
    }

    function peg$parseexpression_case() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCASE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = [];
              s6 = peg$parseexpression_case_when();
              if (s6 !== peg$FAILED) {
                while (s6 !== peg$FAILED) {
                  s5.push(s6);
                  s6 = peg$parseexpression_case_when();
                }
              } else {
                s5 = peg$FAILED;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseexpression_case_else();
                  if (s7 === peg$FAILED) {
                    s7 = null;
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseo();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parseEND();
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parseo();
                        if (s10 !== peg$FAILED) {
                          peg$savedPos = s0;
                          s1 = peg$c20(s1, s3, s5, s7);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c19); }
      }

      return s0;
    }

    function peg$parseexpression_case_when() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseWHEN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseTHEN();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseexpression();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseo();
                    if (s8 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c22(s1, s3, s7);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c21); }
      }

      return s0;
    }

    function peg$parseexpression_case_else() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseELSE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c24(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c23); }
      }

      return s0;
    }

    function peg$parseexpression_raise() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseRAISE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_popen();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseexpression_raise_args();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsesym_pclose();
                  if (s7 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c26(s1, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c25); }
      }

      return s0;
    }

    function peg$parseexpression_raise_args() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseraise_args_ignore();
      if (s1 === peg$FAILED) {
        s1 = peg$parseraise_args_message();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c28(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c27); }
      }

      return s0;
    }

    function peg$parseraise_args_ignore() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseIGNORE();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c30(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c29); }
      }

      return s0;
    }

    function peg$parseraise_args_message() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseROLLBACK();
      if (s1 === peg$FAILED) {
        s1 = peg$parseABORT();
        if (s1 === peg$FAILED) {
          s1 = peg$parseFAIL();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_comma();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseerror_message();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c31(s1, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseexpression_node() {
      var s0;

      s0 = peg$parseexpression_collate();
      if (s0 === peg$FAILED) {
        s0 = peg$parseexpression_compare();
        if (s0 === peg$FAILED) {
          s0 = peg$parseexpression_null();
          if (s0 === peg$FAILED) {
            s0 = peg$parseexpression_between();
            if (s0 === peg$FAILED) {
              s0 = peg$parseexpression_in();
              if (s0 === peg$FAILED) {
                s0 = peg$parsestmt_select();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseoperation_binary();
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseexpression_collate() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseCOLLATE();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseid_collation();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c33(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c32); }
      }

      return s0;
    }

    function peg$parseexpression_compare() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseLIKE();
            if (s4 === peg$FAILED) {
              s4 = peg$parseGLOB();
              if (s4 === peg$FAILED) {
                s4 = peg$parseREGEXP();
                if (s4 === peg$FAILED) {
                  s4 = peg$parseMATCH();
                }
              }
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseexpression();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseo();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseexpression_escape();
                    if (s8 === peg$FAILED) {
                      s8 = null;
                    }
                    if (s8 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c35(s1, s3, s4, s6, s8);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c34); }
      }

      return s0;
    }

    function peg$parseexpression_escape() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseESCAPE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c37(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c36); }
      }

      return s0;
    }

    function peg$parseexpression_null() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_null_nodes();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c39(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c38); }
      }

      return s0;
    }

    function peg$parseexpression_null_nodes() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c41) {
        s1 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c42); }
      }
      if (s1 === peg$FAILED) {
        s1 = peg$parseexpression_is_not_join();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseNULL();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c43(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c40); }
      }

      return s0;
    }

    function peg$parseexpression_isnt() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseIS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c43(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c44); }
      }

      return s0;
    }

    function peg$parseexpression_is_not() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseNOT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c45(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseexpression_is_not_join() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c46) {
        s1 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c47); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c48(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseexpression_between() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseBETWEEN();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseexpression();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseo();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseAND();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parseo();
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parseexpression();
                        if (s10 !== peg$FAILED) {
                          peg$savedPos = s0;
                          s1 = peg$c50(s1, s3, s4, s6, s8, s10);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c49); }
      }

      return s0;
    }

    function peg$parseexpression_in() {
      var s0, s1, s2, s3, s4, s5, s6;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseIN();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseexpression_in_target();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c52(s1, s3, s4, s6);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c51); }
      }

      return s0;
    }

    function peg$parseexpression_in_target() {
      var s0;

      s0 = peg$parseexpression_list_or_select();
      if (s0 === peg$FAILED) {
        s0 = peg$parseid_table();
      }

      return s0;
    }

    function peg$parseexpression_list_or_select() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_select();
        if (s2 === peg$FAILED) {
          s2 = peg$parseexpression_list();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c53(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetype_definition() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsedatatype_types();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetype_definition_args();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c55(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c54); }
      }

      return s0;
    }

    function peg$parsetype_definition_args() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseliteral_number_signed();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsedefinition_args_loop();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesym_pclose();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c57(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c56); }
      }

      return s0;
    }

    function peg$parsedefinition_args_loop() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseliteral_number_signed();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c8(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseliteral_value() {
      var s0;

      s0 = peg$parseliteral_number();
      if (s0 === peg$FAILED) {
        s0 = peg$parseliteral_string();
        if (s0 === peg$FAILED) {
          s0 = peg$parseliteral_blob();
          if (s0 === peg$FAILED) {
            s0 = peg$parseliteral_null();
            if (s0 === peg$FAILED) {
              s0 = peg$parseliteral_date();
            }
          }
        }
      }

      return s0;
    }

    function peg$parseliteral_null() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseNULL();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c59(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c58); }
      }

      return s0;
    }

    function peg$parseliteral_date() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCURRENT_DATE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseCURRENT_TIMESTAMP();
        if (s1 === peg$FAILED) {
          s1 = peg$parseCURRENT_TIME();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c61(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c60); }
      }

      return s0;
    }

    function peg$parseliteral_string() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseliteral_string_single();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c63(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c62); }
      }

      return s0;
    }

    function peg$parseliteral_string_single() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_sglquote();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseliteral_string_schar();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseliteral_string_schar();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_sglquote();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c65(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c64); }
      }

      return s0;
    }

    function peg$parseliteral_string_schar() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c66) {
        s0 = peg$c66;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c67); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c68.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c69); }
        }
      }

      return s0;
    }

    function peg$parseliteral_blob() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (peg$c71.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c72); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseliteral_string_single();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c73(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c70); }
      }

      return s0;
    }

    function peg$parsenumber_sign() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_plus();
      if (s1 === peg$FAILED) {
        s1 = peg$parsesym_minus();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c2(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c74); }
      }

      return s0;
    }

    function peg$parseliteral_number_signed() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsenumber_sign();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseliteral_number();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c75(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseliteral_number() {
      var s0;

      s0 = peg$parseliteral_number_decimal();
      if (s0 === peg$FAILED) {
        s0 = peg$parseliteral_number_hex();
      }

      return s0;
    }

    function peg$parseliteral_number_decimal() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsenumber_decimal_node();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsenumber_decimal_exponent();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c76(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsenumber_decimal_node() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsenumber_decimal_full();
      if (s0 === peg$FAILED) {
        s0 = peg$parsenumber_decimal_fraction();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c77); }
      }

      return s0;
    }

    function peg$parsenumber_decimal_full() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsenumber_digit();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsenumber_digit();
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsenumber_decimal_fraction();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c78(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsenumber_decimal_fraction() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_dot();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsenumber_digit();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsenumber_digit();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c79(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsenumber_decimal_exponent() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 1).toLowerCase() === peg$c81) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c82); }
      }
      if (s1 !== peg$FAILED) {
        if (peg$c83.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c84); }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsenumber_digit();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsenumber_digit();
            }
          } else {
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c85(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c80); }
      }

      return s0;
    }

    function peg$parseliteral_number_hex() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c87) {
        s1 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c88); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsenumber_hex();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsenumber_hex();
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c89(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c86); }
      }

      return s0;
    }

    function peg$parsenumber_hex() {
      var s0;

      if (peg$c90.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c91); }
      }

      return s0;
    }

    function peg$parsenumber_digit() {
      var s0;

      if (peg$c92.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c93); }
      }

      return s0;
    }

    function peg$parsebind_parameter() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsebind_parameter_numbered();
      if (s1 === peg$FAILED) {
        s1 = peg$parsebind_parameter_named();
        if (s1 === peg$FAILED) {
          s1 = peg$parsebind_parameter_tcl();
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c95(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c94); }
      }

      return s0;
    }

    function peg$parsebind_parameter_numbered() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_quest();
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        if (peg$c97.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c98); }
        }
        if (s3 !== peg$FAILED) {
          s4 = [];
          if (peg$c92.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c93); }
          }
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            if (peg$c92.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c93); }
            }
          }
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c99(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c96); }
      }

      return s0;
    }

    function peg$parsebind_parameter_named() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      if (peg$c101.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c102); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_char();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_char();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c103(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c100); }
      }

      return s0;
    }

    function peg$parsebind_parameter_tcl() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 36) {
        s1 = peg$c105;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c106); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_char();
        if (s3 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 58) {
            s3 = peg$c107;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c108); }
          }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_char();
            if (s3 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 58) {
                s3 = peg$c107;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c108); }
              }
            }
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsetcl_suffix();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c109(s1, s2, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c104); }
      }

      return s0;
    }

    function peg$parsetcl_suffix() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsename_dblquoted();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c110(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseoperation_binary() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseoperator_binary();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseexpression_types();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c112(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c111); }
      }

      return s0;
    }

    function peg$parsebinary_loop_concat() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseAND();
      if (s1 === peg$FAILED) {
        s1 = peg$parseOR();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c113(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseexpression_list() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseexpression_list_rest();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseexpression_list_rest();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c115(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c114); }
      }

      return s0;
    }

    function peg$parseexpression_list_rest() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c53(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsefunction_call() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename_unquoted();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_popen();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsefunction_call_args();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesym_pclose();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c117(s1, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c116); }
      }

      return s0;
    }

    function peg$parsefunction_call_args() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseselect_star();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c119(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseargs_list_distinct();
        if (s1 === peg$FAILED) {
          s1 = null;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseexpression_list();
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c120(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c118); }
      }

      return s0;
    }

    function peg$parseargs_list_distinct() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseDISTINCT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c121(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseerror_message() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseliteral_string();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c123(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c122); }
      }

      return s0;
    }

    function peg$parsestmt() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsestmt_modifier();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_nodes();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c125(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c124); }
      }

      return s0;
    }

    function peg$parsestmt_modifier() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseEXPLAIN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsemodifier_query();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c127(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c126); }
      }

      return s0;
    }

    function peg$parsemodifier_query() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseQUERY();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsePLAN();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c129(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c128); }
      }

      return s0;
    }

    function peg$parsestmt_nodes() {
      var s0;

      s0 = peg$parsestmt_crud();
      if (s0 === peg$FAILED) {
        s0 = peg$parsestmt_create();
        if (s0 === peg$FAILED) {
          s0 = peg$parsestmt_drop();
          if (s0 === peg$FAILED) {
            s0 = peg$parsestmt_transaction();
            if (s0 === peg$FAILED) {
              s0 = peg$parsestmt_alter();
              if (s0 === peg$FAILED) {
                s0 = peg$parsestmt_rollback();
                if (s0 === peg$FAILED) {
                  s0 = peg$parsestmt_savepoint();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parsestmt_release();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parsestmt_sqlite();
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsestmt_transaction() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsestmt_begin();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_list();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_commit();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c131(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c130); }
      }

      return s0;
    }

    function peg$parsestmt_commit() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCOMMIT();
      if (s1 === peg$FAILED) {
        s1 = peg$parseEND();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecommit_transaction();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c133(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c132); }
      }

      return s0;
    }

    function peg$parsestmt_begin() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseBEGIN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_begin_modifier();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsecommit_transaction();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c135(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c134); }
      }

      return s0;
    }

    function peg$parsecommit_transaction() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseTRANSACTION();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c4(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_begin_modifier() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseDEFERRED();
      if (s1 === peg$FAILED) {
        s1 = peg$parseIMMEDIATE();
        if (s1 === peg$FAILED) {
          s1 = peg$parseEXCLUSIVE();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c136(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_rollback() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseROLLBACK();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecommit_transaction();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parserollback_savepoint();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c138(s1, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c137); }
      }

      return s0;
    }

    function peg$parserollback_savepoint() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseTO();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesavepoint_alt();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseid_savepoint();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c8(s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c139); }
      }

      return s0;
    }

    function peg$parsesavepoint_alt() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseSAVEPOINT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c140(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_savepoint() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesavepoint_alt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseid_savepoint();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c142(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c141); }
      }

      return s0;
    }

    function peg$parsestmt_release() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseRELEASE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesavepoint_alt();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseid_savepoint();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c144(s1, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c143); }
      }

      return s0;
    }

    function peg$parsestmt_alter() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsealter_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseid_table();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsealter_action();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c146(s1, s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c145); }
      }

      return s0;
    }

    function peg$parsealter_start() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseALTER();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseTABLE();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c148(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c147); }
      }

      return s0;
    }

    function peg$parsealter_action() {
      var s0;

      s0 = peg$parsealter_action_rename();
      if (s0 === peg$FAILED) {
        s0 = peg$parsealter_action_add();
      }

      return s0;
    }

    function peg$parsealter_action_rename() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseRENAME();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseTO();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseid_table();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c150(s1, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c149); }
      }

      return s0;
    }

    function peg$parsealter_action_add() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseADD();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseaction_add_modifier();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesource_def_column();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c152(s1, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c151); }
      }

      return s0;
    }

    function peg$parseaction_add_modifier() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseCOLUMN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c140(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_crud() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsestmt_core_with();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_crud_types();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c153(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_core_with() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseclause_with();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c155(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c154); }
      }

      return s0;
    }

    function peg$parseclause_with() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseWITH();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseclause_with_recursive();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseclause_with_tables();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c156(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseclause_with_recursive() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseRECURSIVE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c140(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseclause_with_tables() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseexpression_cte();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseclause_with_loop();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseclause_with_loop();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c157(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseclause_with_loop() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression_cte();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c53(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseexpression_cte() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_cte();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseselect_alias();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c159(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c158); }
      }

      return s0;
    }

    function peg$parseselect_alias() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseAS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseselect_wrapped();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c160(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_wrapped() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_select();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c2(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_sqlite() {
      var s0;

      s0 = peg$parsestmt_detach();
      if (s0 === peg$FAILED) {
        s0 = peg$parsestmt_vacuum();
        if (s0 === peg$FAILED) {
          s0 = peg$parsestmt_analyze();
          if (s0 === peg$FAILED) {
            s0 = peg$parsestmt_reindex();
            if (s0 === peg$FAILED) {
              s0 = peg$parsestmt_pragma();
            }
          }
        }
      }

      return s0;
    }

    function peg$parsestmt_detach() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseDETACH();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = peg$parseDATABASE();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseo();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseid_database();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c162(s1, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c161); }
      }

      return s0;
    }

    function peg$parsestmt_vacuum() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseVACUUM();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c164(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c163); }
      }

      return s0;
    }

    function peg$parsestmt_analyze() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseANALYZE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseanalyze_arg();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c166(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c165); }
      }

      return s0;
    }

    function peg$parseanalyze_arg() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseid_table();
      if (s1 === peg$FAILED) {
        s1 = peg$parseid_index();
        if (s1 === peg$FAILED) {
          s1 = peg$parseid_database();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c167(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_reindex() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseREINDEX();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsereindex_arg();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c166(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c168); }
      }

      return s0;
    }

    function peg$parsereindex_arg() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseid_table();
      if (s1 === peg$FAILED) {
        s1 = peg$parseid_index();
        if (s1 === peg$FAILED) {
          s1 = peg$parseid_collation();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c169(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_pragma() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsePRAGMA();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_pragma();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsepragma_expression();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c171(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c170); }
      }

      return s0;
    }

    function peg$parsepragma_expression() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsesym_equal();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsepragma_value();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c172(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsesym_popen();
        if (s1 !== peg$FAILED) {
          s2 = peg$parsepragma_value();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseo();
            if (s3 !== peg$FAILED) {
              s4 = peg$parsesym_pclose();
              if (s4 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c172(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parsepragma_value() {
      var s0;

      s0 = peg$parsepragma_value_bool();
      if (s0 === peg$FAILED) {
        s0 = peg$parsepragma_value_literal();
        if (s0 === peg$FAILED) {
          s0 = peg$parsepragma_value_name();
        }
      }

      return s0;
    }

    function peg$parsepragma_value_literal() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseliteral_number_signed();
      if (s1 === peg$FAILED) {
        s1 = peg$parseliteral_string();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c172(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsepragma_value_bool() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = peg$currPos;
        s2 = peg$c173(s1);
        if (s2) {
          s2 = void 0;
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c174(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsepragma_value_name() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c175(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsestmt_crud_types() {
      var s0;

      s0 = peg$parsestmt_select();
      if (s0 === peg$FAILED) {
        s0 = peg$parsestmt_insert();
        if (s0 === peg$FAILED) {
          s0 = peg$parsestmt_update();
          if (s0 === peg$FAILED) {
            s0 = peg$parsestmt_delete();
          }
        }
      }

      return s0;
    }

    function peg$parsestmt_select() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseselect_loop();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_core_order();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsestmt_core_limit();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c177(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c176); }
      }

      return s0;
    }

    function peg$parsestmt_core_order() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseORDER();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseBY();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsestmt_core_order_list();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c179(s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c178); }
      }

      return s0;
    }

    function peg$parsestmt_core_limit() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseLIMIT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsestmt_core_limit_offset();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c181(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c180); }
      }

      return s0;
    }

    function peg$parsestmt_core_limit_offset() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parselimit_offset_variant();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c183(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c182); }
      }

      return s0;
    }

    function peg$parselimit_offset_variant() {
      var s0;

      s0 = peg$parselimit_offset_variant_name();
      if (s0 === peg$FAILED) {
        s0 = peg$parsesym_comma();
      }

      return s0;
    }

    function peg$parselimit_offset_variant_name() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseOFFSET();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c140(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_loop() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseselect_parts();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseselect_loop_union();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseselect_loop_union();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c184(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_loop_union() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseoperator_compound();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseselect_parts();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c186(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c185); }
      }

      return s0;
    }

    function peg$parseselect_parts() {
      var s0;

      s0 = peg$parseselect_parts_core();
      if (s0 === peg$FAILED) {
        s0 = peg$parseselect_parts_values();
      }

      return s0;
    }

    function peg$parseselect_parts_core() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseselect_core_select();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseselect_core_from();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_core_where();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseselect_core_group();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c187(s1, s2, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_core_select() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseSELECT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseselect_modifier();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseselect_target();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c189(s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c188); }
      }

      return s0;
    }

    function peg$parseselect_modifier() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parseselect_modifier_distinct();
      if (s0 === peg$FAILED) {
        s0 = peg$parseselect_modifier_all();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c190); }
      }

      return s0;
    }

    function peg$parseselect_modifier_distinct() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseDISTINCT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c191(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_modifier_all() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseALL();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c192(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_target() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseselect_node();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseselect_target_loop();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseselect_target_loop();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c157(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_target_loop() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseselect_node();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c8(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_core_from() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseFROM();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseselect_source();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c194(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c193); }
      }

      return s0;
    }

    function peg$parsestmt_core_where() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseWHERE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c196(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c195); }
      }

      return s0;
    }

    function peg$parseselect_core_group() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseGROUP();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseBY();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseexpression_list();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseselect_core_having();
                  if (s7 === peg$FAILED) {
                    s7 = null;
                  }
                  if (s7 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c198(s1, s5, s7);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c197); }
      }

      return s0;
    }

    function peg$parseselect_core_having() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseHAVING();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c200(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c199); }
      }

      return s0;
    }

    function peg$parseselect_node() {
      var s0;

      s0 = peg$parseselect_node_star();
      if (s0 === peg$FAILED) {
        s0 = peg$parseselect_node_aliased();
      }

      return s0;
    }

    function peg$parseselect_node_star() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseselect_node_star_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseselect_star();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c201(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_node_star_qualified() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_dot();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c202(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_node_aliased() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseexpression();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsealias();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c203(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_source() {
      var s0;

      s0 = peg$parseselect_join_loop();
      if (s0 === peg$FAILED) {
        s0 = peg$parseselect_source_loop();
      }

      return s0;
    }

    function peg$parseselect_source_loop() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsetable_or_sub();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsesource_loop_tail();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsesource_loop_tail();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c204(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsesource_loop_tail() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsetable_or_sub();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c4(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetable_or_sub() {
      var s0;

      s0 = peg$parsetable_or_sub_sub();
      if (s0 === peg$FAILED) {
        s0 = peg$parsetable_qualified();
        if (s0 === peg$FAILED) {
          s0 = peg$parsetable_or_sub_select();
        }
      }

      return s0;
    }

    function peg$parsetable_qualified() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsetable_qualified_id();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetable_or_sub_index_node();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c206(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c205); }
      }

      return s0;
    }

    function peg$parsetable_qualified_id() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsealias();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c208(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c207); }
      }

      return s0;
    }

    function peg$parsetable_or_sub_index_node() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parseindex_node_indexed();
      if (s0 === peg$FAILED) {
        s0 = peg$parseindex_node_none();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c209); }
      }

      return s0;
    }

    function peg$parseindex_node_indexed() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parseINDEXED();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseBY();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsename();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c210(s1, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseindex_node_none() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseexpression_is_not();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseINDEXED();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c211(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetable_or_sub_sub() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseselect_source();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c213(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c212); }
      }

      return s0;
    }

    function peg$parsetable_or_sub_select() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseselect_wrapped();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsealias();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c215(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c214); }
      }

      return s0;
    }

    function peg$parsealias() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseAS();
      if (s2 !== peg$FAILED) {
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parsename_char();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = void 0;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseo();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c217(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c216); }
      }

      return s0;
    }

    function peg$parseselect_join_loop() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsetable_or_sub();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseselect_join_clause();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parseselect_join_clause();
            }
          } else {
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c218(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_join_clause() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsejoin_operator();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetable_or_sub();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsejoin_condition();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c220(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c219); }
      }

      return s0;
    }

    function peg$parsejoin_operator() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsejoin_operator_natural();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsejoin_operator_types();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseJOIN();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c222(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c221); }
      }

      return s0;
    }

    function peg$parsejoin_operator_natural() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseNATURAL();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c45(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsejoin_operator_types() {
      var s0;

      s0 = peg$parseoperator_types_hand();
      if (s0 === peg$FAILED) {
        s0 = peg$parseoperator_types_misc();
      }

      return s0;
    }

    function peg$parseoperator_types_hand() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseLEFT();
      if (s1 === peg$FAILED) {
        s1 = peg$parseRIGHT();
        if (s1 === peg$FAILED) {
          s1 = peg$parseFULL();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetypes_hand_outer();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c223(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetypes_hand_outer() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseOUTER();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c224(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseoperator_types_misc() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseINNER();
      if (s1 === peg$FAILED) {
        s1 = peg$parseCROSS();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c224(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsejoin_condition() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsejoin_condition_on();
      if (s1 === peg$FAILED) {
        s1 = peg$parsejoin_condition_using();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c226(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c225); }
      }

      return s0;
    }

    function peg$parsejoin_condition_on() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseON();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c228(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c227); }
      }

      return s0;
    }

    function peg$parsejoin_condition_using() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseUSING();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseloop_columns();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c230(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c229); }
      }

      return s0;
    }

    function peg$parseselect_parts_values() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseVALUES();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseinsert_values_list();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c232(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c231); }
      }

      return s0;
    }

    function peg$parsestmt_core_order_list() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsestmt_core_order_list_item();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_core_order_list_loop();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c233(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_core_order_list_loop() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_core_order_list_item();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c234(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_core_order_list_item() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecolumn_collate();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseprimary_column_dir();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c236(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c235); }
      }

      return s0;
    }

    function peg$parseselect_star() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_star();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c237); }
      }

      return s0;
    }

    function peg$parsestmt_fallback_types() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseREPLACE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseROLLBACK();
        if (s1 === peg$FAILED) {
          s1 = peg$parseABORT();
          if (s1 === peg$FAILED) {
            s1 = peg$parseFAIL();
            if (s1 === peg$FAILED) {
              s1 = peg$parseIGNORE();
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c239(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c238); }
      }

      return s0;
    }

    function peg$parsestmt_insert() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseinsert_keyword();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseinsert_target();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c241(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c240); }
      }

      return s0;
    }

    function peg$parseinsert_keyword() {
      var s0;

      s0 = peg$parseinsert_keyword_ins();
      if (s0 === peg$FAILED) {
        s0 = peg$parseinsert_keyword_repl();
      }

      return s0;
    }

    function peg$parseinsert_keyword_ins() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseINSERT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseinsert_keyword_mod();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c243(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c242); }
      }

      return s0;
    }

    function peg$parseinsert_keyword_repl() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseREPLACE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c245(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c244); }
      }

      return s0;
    }

    function peg$parseinsert_keyword_mod() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseOR();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_fallback_types();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c247(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c246); }
      }

      return s0;
    }

    function peg$parseinsert_target() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseinsert_into();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseinsert_results();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c248(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseinsert_into() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseinsert_into_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseid_cte();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c250(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c249); }
      }

      return s0;
    }

    function peg$parseinsert_into_start() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseINTO();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c251); }
      }

      return s0;
    }

    function peg$parseinsert_results() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseinsert_value();
      if (s1 === peg$FAILED) {
        s1 = peg$parseinsert_select();
        if (s1 === peg$FAILED) {
          s1 = peg$parseinsert_default();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c252(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c231); }
      }

      return s0;
    }

    function peg$parseloop_columns() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseloop_name();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parseloop_column_tail();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parseloop_column_tail();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesym_pclose();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c254(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c253); }
      }

      return s0;
    }

    function peg$parseloop_column_tail() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseloop_name();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c255(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseloop_name() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c257(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c256); }
      }

      return s0;
    }

    function peg$parseinsert_value() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseinsert_value_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseinsert_values_list();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c258(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c231); }
      }

      return s0;
    }

    function peg$parseinsert_value_start() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseVALUES();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c140(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c259); }
      }

      return s0;
    }

    function peg$parseinsert_values_list() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseinsert_values();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseinsert_values_loop();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseinsert_values_loop();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c260(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseinsert_values_loop() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseinsert_values();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c53(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseinsert_values() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression_list();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c262(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c261); }
      }

      return s0;
    }

    function peg$parseinsert_select() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsestmt_select();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c188); }
      }

      return s0;
    }

    function peg$parseinsert_default() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseDEFAULT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseVALUES();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c264(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c263); }
      }

      return s0;
    }

    function peg$parseoperator_compound() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecompound_union();
      if (s1 === peg$FAILED) {
        s1 = peg$parseINTERSECT();
        if (s1 === peg$FAILED) {
          s1 = peg$parseEXCEPT();
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c140(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c265); }
      }

      return s0;
    }

    function peg$parsecompound_union() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseUNION();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecompound_union_all();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c267(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c266); }
      }

      return s0;
    }

    function peg$parsecompound_union_all() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseALL();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c268(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_update() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseupdate_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseupdate_fallback();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetable_qualified();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseupdate_set();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsestmt_core_where();
                if (s6 === peg$FAILED) {
                  s6 = null;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsestmt_core_order();
                  if (s7 === peg$FAILED) {
                    s7 = null;
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseo();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parsestmt_core_limit();
                      if (s9 === peg$FAILED) {
                        s9 = null;
                      }
                      if (s9 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c270(s1, s2, s3, s5, s6, s7, s9);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c269); }
      }

      return s0;
    }

    function peg$parseupdate_start() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseUPDATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c140(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c271); }
      }

      return s0;
    }

    function peg$parseupdate_fallback() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseOR();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_fallback_types();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c273(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c272); }
      }

      return s0;
    }

    function peg$parseupdate_set() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseSET();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseupdate_columns();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c275(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c274); }
      }

      return s0;
    }

    function peg$parseupdate_columns() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseupdate_column();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseupdate_columns_tail();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseupdate_columns_tail();
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c260(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseupdate_columns_tail() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseo();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_comma();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseupdate_column();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c255(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseupdate_column() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_column();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_equal();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseexpression_types();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c277(s1, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c276); }
      }

      return s0;
    }

    function peg$parsestmt_delete() {
      var s0, s1, s2, s3, s4, s5, s6;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsedelete_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsetable_qualified();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsestmt_core_where();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsestmt_core_order();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parsestmt_core_limit();
                if (s6 === peg$FAILED) {
                  s6 = null;
                }
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c279(s1, s2, s4, s5, s6);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c278); }
      }

      return s0;
    }

    function peg$parsedelete_start() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseDELETE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseFROM();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c140(s1);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c280); }
      }

      return s0;
    }

    function peg$parsestmt_create() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsecreate_table_only();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecreate_index_only();
        if (s0 === peg$FAILED) {
          s0 = peg$parsecreate_trigger_only();
          if (s0 === peg$FAILED) {
            s0 = peg$parsecreate_view_only();
            if (s0 === peg$FAILED) {
              s0 = peg$parsecreate_virtual_only();
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c281); }
      }

      return s0;
    }

    function peg$parsecreate_start() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseCREATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c140(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_table_only() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = peg$parsecreate_start();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseINDEX();
        if (s4 === peg$FAILED) {
          s4 = peg$parseTRIGGER();
          if (s4 === peg$FAILED) {
            s4 = peg$parseVIEW();
            if (s4 === peg$FAILED) {
              s4 = peg$parseVIRTUAL();
            }
          }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_table();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c255(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_index_only() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = peg$parsecreate_start();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseTABLE();
        if (s4 === peg$FAILED) {
          s4 = peg$parseTRIGGER();
          if (s4 === peg$FAILED) {
            s4 = peg$parseVIEW();
            if (s4 === peg$FAILED) {
              s4 = peg$parseVIRTUAL();
            }
          }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_index();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c255(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_trigger_only() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = peg$parsecreate_start();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseTABLE();
        if (s4 === peg$FAILED) {
          s4 = peg$parseINDEX();
          if (s4 === peg$FAILED) {
            s4 = peg$parseVIEW();
            if (s4 === peg$FAILED) {
              s4 = peg$parseVIRTUAL();
            }
          }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_trigger();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c255(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_view_only() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = peg$parsecreate_start();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseTABLE();
        if (s4 === peg$FAILED) {
          s4 = peg$parseINDEX();
          if (s4 === peg$FAILED) {
            s4 = peg$parseTRIGGER();
            if (s4 === peg$FAILED) {
              s4 = peg$parseVIRTUAL();
            }
          }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_view();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c255(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_virtual_only() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = peg$parsecreate_start();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseTABLE();
        if (s4 === peg$FAILED) {
          s4 = peg$parseINDEX();
          if (s4 === peg$FAILED) {
            s4 = peg$parseTRIGGER();
            if (s4 === peg$FAILED) {
              s4 = peg$parseVIEW();
            }
          }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_virtual();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c255(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_table() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecreate_table_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_ine();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_table();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsecreate_table_source();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c283(s1, s2, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c282); }
      }

      return s0;
    }

    function peg$parsecreate_table_start() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsecreate_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_tmp();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseTABLE();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c284(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_core_tmp() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseTEMPORARY();
      if (s1 === peg$FAILED) {
        s1 = peg$parseTEMP();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c285(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_core_ine() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseIF();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseEXISTS();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c287(s1, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c286); }
      }

      return s0;
    }

    function peg$parsecreate_table_source() {
      var s0;

      s0 = peg$parsetable_source_def();
      if (s0 === peg$FAILED) {
        s0 = peg$parsetable_source_select();
      }

      return s0;
    }

    function peg$parsetable_source_def() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesource_def_loop();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsesource_tbl_loop();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsesource_tbl_loop();
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesource_def_rowid();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c289(s2, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c288); }
      }

      return s0;
    }

    function peg$parsesource_def_rowid() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseWITHOUT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseROWID();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c290(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsesource_def_loop() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsesource_def_column();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsesource_def_tail();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsesource_def_tail();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c260(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsesource_def_tail() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesource_def_column();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c4(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsesource_tbl_loop() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsetable_constraint();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c291(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsesource_def_column() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$currPos;
        peg$silentFails++;
        s4 = peg$parsename_char();
        peg$silentFails--;
        if (s4 === peg$FAILED) {
          s3 = void 0;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parseo();
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecolumn_type();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsecolumn_constraints();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c293(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c292); }
      }

      return s0;
    }

    function peg$parsecolumn_type() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsetype_definition();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c295(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c294); }
      }

      return s0;
    }

    function peg$parsecolumn_constraints() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsecolumn_constraint();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsecolumn_constraint_tail();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsecolumn_constraint_tail();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c260(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecolumn_constraint_tail() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseo();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecolumn_constraint();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c255(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecolumn_constraint() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecolumn_constraint_name();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecolumn_constraint_types();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c297(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c296); }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_name() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCONSTRAINT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsename();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c299(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c298); }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_types() {
      var s0;

      s0 = peg$parsecolumn_constraint_primary();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecolumn_constraint_null();
        if (s0 === peg$FAILED) {
          s0 = peg$parsecolumn_constraint_check();
          if (s0 === peg$FAILED) {
            s0 = peg$parsecolumn_constraint_default();
            if (s0 === peg$FAILED) {
              s0 = peg$parsecolumn_constraint_collate();
              if (s0 === peg$FAILED) {
                s0 = peg$parsecolumn_constraint_foreign();
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_foreign() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseforeign_clause();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c301(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c300); }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_primary() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecol_primary_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseprimary_column_dir();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseprimary_conflict();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsecol_primary_auto();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c303(s1, s2, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c302); }
      }

      return s0;
    }

    function peg$parsecol_primary_start() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsePRIMARY();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseKEY();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c305(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c304); }
      }

      return s0;
    }

    function peg$parsecol_primary_auto() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseAUTOINCREMENT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c307(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c306); }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_null() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseconstraint_null_types();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseprimary_conflict();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c308(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseconstraint_null_types() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseconstraint_null_value();
      if (s1 === peg$FAILED) {
        s1 = peg$parseUNIQUE();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c48(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c309); }
      }

      return s0;
    }

    function peg$parseconstraint_null_value() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_is_not();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseNULL();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c311(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c310); }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_check() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parseconstraint_check();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c312); }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_default() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseDEFAULT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_wrapped();
          if (s3 === peg$FAILED) {
            s3 = peg$parseliteral_number_signed();
            if (s3 === peg$FAILED) {
              s3 = peg$parseliteral_value();
            }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c314(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c313); }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_collate() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecolumn_collate();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c316(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c315); }
      }

      return s0;
    }

    function peg$parsetable_constraint() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsetable_constraint_name();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetable_constraint_types();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c318(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c317); }
      }

      return s0;
    }

    function peg$parsetable_constraint_name() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCONSTRAINT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsename();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c299(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c319); }
      }

      return s0;
    }

    function peg$parsetable_constraint_types() {
      var s0;

      s0 = peg$parsetable_constraint_foreign();
      if (s0 === peg$FAILED) {
        s0 = peg$parsetable_constraint_primary();
        if (s0 === peg$FAILED) {
          s0 = peg$parsetable_constraint_check();
        }
      }

      return s0;
    }

    function peg$parsetable_constraint_check() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseconstraint_check();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c321(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c320); }
      }

      return s0;
    }

    function peg$parsetable_constraint_primary() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseprimary_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseprimary_columns();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseprimary_conflict();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c323(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c322); }
      }

      return s0;
    }

    function peg$parseprimary_start() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseprimary_start_normal();
      if (s1 === peg$FAILED) {
        s1 = peg$parseprimary_start_unique();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c324(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseprimary_start_normal() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsePRIMARY();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseKEY();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c325(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c304); }
      }

      return s0;
    }

    function peg$parseprimary_start_unique() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseUNIQUE();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c327(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c326); }
      }

      return s0;
    }

    function peg$parseprimary_columns() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseprimary_column();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parseprimary_column_tail();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parseprimary_column_tail();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesym_pclose();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c260(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c328); }
      }

      return s0;
    }

    function peg$parseprimary_column() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecolumn_collate();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseprimary_column_dir();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c330(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c329); }
      }

      return s0;
    }

    function peg$parsecolumn_collate() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCOLLATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_collation();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c332(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c331); }
      }

      return s0;
    }

    function peg$parseprimary_column_dir() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseASC();
      if (s1 === peg$FAILED) {
        s1 = peg$parseDESC();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c334(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c333); }
      }

      return s0;
    }

    function peg$parseprimary_column_tail() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseprimary_column();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c255(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseprimary_conflict() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseprimary_conflict_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_fallback_types();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c335(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseprimary_conflict_start() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseON();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseCONFLICT();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c337(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c336); }
      }

      return s0;
    }

    function peg$parseconstraint_check() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseCHECK();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_wrapped();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c338(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetable_constraint_foreign() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseforeign_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseloop_columns();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseforeign_clause();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c340(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c339); }
      }

      return s0;
    }

    function peg$parseforeign_start() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseFOREIGN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseKEY();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c342(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c341); }
      }

      return s0;
    }

    function peg$parseforeign_clause() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseforeign_references();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseforeign_actions();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseforeign_deferrable();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c343(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseforeign_references() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseREFERENCES();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_cte();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c345(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c344); }
      }

      return s0;
    }

    function peg$parseforeign_actions() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseforeign_action();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseforeign_actions_tail();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseforeign_actions_tail();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c346(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseforeign_actions_tail() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseforeign_action();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c268(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseforeign_action() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parseforeign_action_on();
      if (s0 === peg$FAILED) {
        s0 = peg$parseforeign_action_match();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c347); }
      }

      return s0;
    }

    function peg$parseforeign_action_on() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseON();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseDELETE();
          if (s3 === peg$FAILED) {
            s3 = peg$parseUPDATE();
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseaction_on_action();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c348(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseaction_on_action() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parseon_action_set();
      if (s0 === peg$FAILED) {
        s0 = peg$parseon_action_cascade();
        if (s0 === peg$FAILED) {
          s0 = peg$parseon_action_none();
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c349); }
      }

      return s0;
    }

    function peg$parseon_action_set() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseSET();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseNULL();
          if (s3 === peg$FAILED) {
            s3 = peg$parseDEFAULT();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c350(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseon_action_cascade() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseCASCADE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseRESTRICT();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c351(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseon_action_none() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseNO();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseACTION();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c352(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseforeign_action_match() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseMATCH();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsename();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c353(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseforeign_deferrable() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_is_not();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseDEFERRABLE();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsedeferrable_initially();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c355(s1, s2, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c354); }
      }

      return s0;
    }

    function peg$parsedeferrable_initially() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseINITIALLY();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseDEFERRED();
          if (s3 === peg$FAILED) {
            s3 = peg$parseIMMEDIATE();
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c356(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetable_source_select() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsecreate_as_select();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c357(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecreate_index() {
      var s0, s1, s2, s3, s4, s5, s6;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecreate_index_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_ine();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_index();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseindex_on();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsestmt_core_where();
                if (s6 === peg$FAILED) {
                  s6 = null;
                }
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c359(s1, s2, s3, s5, s6);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c358); }
      }

      return s0;
    }

    function peg$parsecreate_index_start() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsecreate_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseindex_unique();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseINDEX();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c360(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseindex_unique() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseUNIQUE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c361(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseindex_on() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseON();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsename();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseprimary_columns();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c363(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c362); }
      }

      return s0;
    }

    function peg$parsecreate_trigger() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecreate_trigger_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_ine();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_trigger();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsetrigger_conditions();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseON();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseo();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parsename();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parseo();
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parsetrigger_foreach();
                        if (s10 === peg$FAILED) {
                          s10 = null;
                        }
                        if (s10 !== peg$FAILED) {
                          s11 = peg$parsetrigger_when();
                          if (s11 === peg$FAILED) {
                            s11 = null;
                          }
                          if (s11 !== peg$FAILED) {
                            s12 = peg$parsetrigger_action();
                            if (s12 !== peg$FAILED) {
                              peg$savedPos = s0;
                              s1 = peg$c365(s1, s2, s3, s5, s8, s10, s11, s12);
                              s0 = s1;
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c364); }
      }

      return s0;
    }

    function peg$parsecreate_trigger_start() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsecreate_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_tmp();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseTRIGGER();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c366(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetrigger_conditions() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsetrigger_apply_mods();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsetrigger_do();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c368(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c367); }
      }

      return s0;
    }

    function peg$parsetrigger_apply_mods() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseBEFORE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseAFTER();
        if (s1 === peg$FAILED) {
          s1 = peg$parsetrigger_apply_instead();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c369(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetrigger_apply_instead() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseINSTEAD();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseOF();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c370(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetrigger_do() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsetrigger_do_on();
      if (s0 === peg$FAILED) {
        s0 = peg$parsetrigger_do_update();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c371); }
      }

      return s0;
    }

    function peg$parsetrigger_do_on() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseDELETE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseINSERT();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c372(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetrigger_do_update() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseUPDATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsedo_update_of();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c373(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsedo_update_of() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseOF();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsedo_update_columns();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c374(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsedo_update_columns() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseloop_name();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseloop_column_tail();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseloop_column_tail();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c260(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetrigger_foreach() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parseFOR();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseEACH();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseROW();
              if (s5 === peg$FAILED) {
                if (input.substr(peg$currPos, 9).toLowerCase() === peg$c375) {
                  s5 = input.substr(peg$currPos, 9);
                  peg$currPos += 9;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c376); }
                }
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c377(s1, s3, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetrigger_when() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseWHEN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c378(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c21); }
      }

      return s0;
    }

    function peg$parsetrigger_action() {
      var s0, s1, s2, s3, s4, s5, s6;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseBEGIN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseaction_loop();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseEND();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c380(s1, s3, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c379); }
      }

      return s0;
    }

    function peg$parseaction_loop() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseaction_loop_stmt();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parseaction_loop_stmt();
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c213(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseaction_loop_stmt() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsestmt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesemi_required();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c2(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_view() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecreate_view_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_ine();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_view();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsecreate_as_select();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c382(s1, s2, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c381); }
      }

      return s0;
    }

    function peg$parsecreate_view_start() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsecreate_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_tmp();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseVIEW();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c383(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_as_select() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseAS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_select();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c258(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_virtual() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecreate_virtual_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_ine();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_table();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseUSING();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsevirtual_module();
                  if (s7 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c385(s1, s2, s3, s7);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c384); }
      }

      return s0;
    }

    function peg$parsecreate_virtual_start() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parsecreate_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseVIRTUAL();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseTABLE();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c386(s1, s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsevirtual_module() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsename_unquoted();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsevirtual_args();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c387(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsevirtual_args() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsevirtual_arg_types();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c389(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c388); }
      }

      return s0;
    }

    function peg$parsevirtual_arg_types() {
      var s0;

      s0 = peg$parsevirtual_arg_list();
      if (s0 === peg$FAILED) {
        s0 = peg$parsevirtual_arg_def();
      }

      return s0;
    }

    function peg$parsevirtual_arg_list() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = peg$parsename();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseo();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsetype_definition();
          if (s5 === peg$FAILED) {
            s5 = peg$parsecolumn_constraint();
          }
          if (s5 !== peg$FAILED) {
            s3 = [s3, s4, s5];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression_list();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c213(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsevirtual_arg_def() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsesource_def_loop();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c213(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsestmt_drop() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsedrop_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseid_table();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c391(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c390); }
      }

      return s0;
    }

    function peg$parsedrop_start() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseDROP();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsedrop_types();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsedrop_conditions();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c393(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c392); }
      }

      return s0;
    }

    function peg$parsedrop_types() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseTABLE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseINDEX();
        if (s1 === peg$FAILED) {
          s1 = peg$parseTRIGGER();
          if (s1 === peg$FAILED) {
            s1 = peg$parseVIEW();
          }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c48(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c394); }
      }

      return s0;
    }

    function peg$parsedrop_conditions() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsedrop_ie();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c395(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsedrop_ie() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseIF();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseEXISTS();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c397(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c396); }
      }

      return s0;
    }

    function peg$parseoperator_unary() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_tilde();
      if (s0 === peg$FAILED) {
        s0 = peg$parsesym_minus();
        if (s0 === peg$FAILED) {
          s0 = peg$parsesym_plus();
          if (s0 === peg$FAILED) {
            s0 = peg$parseexpression_is_not();
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c398); }
      }

      return s0;
    }

    function peg$parseoperator_binary() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsebinary_nodes();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c400(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c399); }
      }

      return s0;
    }

    function peg$parsebinary_nodes() {
      var s0;

      s0 = peg$parsebinary_concat();
      if (s0 === peg$FAILED) {
        s0 = peg$parseexpression_isnt();
        if (s0 === peg$FAILED) {
          s0 = peg$parsebinary_multiply();
          if (s0 === peg$FAILED) {
            s0 = peg$parsebinary_mod();
            if (s0 === peg$FAILED) {
              s0 = peg$parsebinary_plus();
              if (s0 === peg$FAILED) {
                s0 = peg$parsebinary_minus();
                if (s0 === peg$FAILED) {
                  s0 = peg$parsebinary_left();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parsebinary_right();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parsebinary_and();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parsebinary_or();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parsebinary_lte();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parsebinary_lt();
                            if (s0 === peg$FAILED) {
                              s0 = peg$parsebinary_gte();
                              if (s0 === peg$FAILED) {
                                s0 = peg$parsebinary_gt();
                                if (s0 === peg$FAILED) {
                                  s0 = peg$parsebinary_lang();
                                  if (s0 === peg$FAILED) {
                                    s0 = peg$parsebinary_notequal();
                                    if (s0 === peg$FAILED) {
                                      s0 = peg$parsebinary_equal();
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsebinary_concat() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_pipe();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_pipe();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c401); }
      }

      return s0;
    }

    function peg$parsebinary_plus() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_plus();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c402); }
      }

      return s0;
    }

    function peg$parsebinary_minus() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_minus();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c403); }
      }

      return s0;
    }

    function peg$parsebinary_multiply() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_star();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c404); }
      }

      return s0;
    }

    function peg$parsebinary_mod() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_mod();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c405); }
      }

      return s0;
    }

    function peg$parsebinary_left() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_lt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_lt();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c406); }
      }

      return s0;
    }

    function peg$parsebinary_right() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_gt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_gt();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c407); }
      }

      return s0;
    }

    function peg$parsebinary_and() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_amp();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c408); }
      }

      return s0;
    }

    function peg$parsebinary_or() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_pipe();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c409); }
      }

      return s0;
    }

    function peg$parsebinary_lt() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_lt();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c410); }
      }

      return s0;
    }

    function peg$parsebinary_gt() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_gt();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c411); }
      }

      return s0;
    }

    function peg$parsebinary_lte() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_lt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_equal();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c412); }
      }

      return s0;
    }

    function peg$parsebinary_gte() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_gt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_equal();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c413); }
      }

      return s0;
    }

    function peg$parsebinary_equal() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_equal();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_equal();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c414); }
      }

      return s0;
    }

    function peg$parsebinary_notequal() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_excl();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_equal();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsesym_lt();
        if (s1 !== peg$FAILED) {
          s2 = peg$parsesym_gt();
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c415); }
      }

      return s0;
    }

    function peg$parsebinary_lang() {
      var s0;

      s0 = peg$parsebinary_lang_isnt();
      if (s0 === peg$FAILED) {
        s0 = peg$parsebinary_lang_misc();
      }

      return s0;
    }

    function peg$parsebinary_lang_isnt() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseIS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c43(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c416); }
      }

      return s0;
    }

    function peg$parsebinary_lang_misc() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseIN();
      if (s1 === peg$FAILED) {
        s1 = peg$parseLIKE();
        if (s1 === peg$FAILED) {
          s1 = peg$parseGLOB();
          if (s1 === peg$FAILED) {
            s1 = peg$parseMATCH();
            if (s1 === peg$FAILED) {
              s1 = peg$parseREGEXP();
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c417(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseid_database() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c419(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c418); }
      }

      return s0;
    }

    function peg$parseid_table() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c421(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c420); }
      }

      return s0;
    }

    function peg$parseid_table_qualified() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_dot();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c422(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseid_column() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecolumn_qualifiers();
      if (s1 === peg$FAILED) {
        s1 = peg$parseid_column_qualified();
        if (s1 === peg$FAILED) {
          s1 = peg$parsecolumn_unqualified();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c424(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c423); }
      }

      return s0;
    }

    function peg$parsecolumn_unqualified() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseo();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c425();
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecolumn_qualifiers() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseid_column_qualified();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c426(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseid_column_qualified() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_dot();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c79(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseid_collation() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename_unquoted();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c428(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c427); }
      }

      return s0;
    }

    function peg$parseid_savepoint() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c430(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c429); }
      }

      return s0;
    }

    function peg$parseid_index() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c432(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c431); }
      }

      return s0;
    }

    function peg$parseid_trigger() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c434(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c433); }
      }

      return s0;
    }

    function peg$parseid_view() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c436(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c435); }
      }

      return s0;
    }

    function peg$parseid_pragma() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c438(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c437); }
      }

      return s0;
    }

    function peg$parseid_cte() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_expression();
      if (s1 === peg$FAILED) {
        s1 = peg$parseid_table();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c14(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c439); }
      }

      return s0;
    }

    function peg$parseid_table_expression() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseloop_columns();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c440(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseid_constraint_table() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c442(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c441); }
      }

      return s0;
    }

    function peg$parseid_constraint_column() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c444(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c443); }
      }

      return s0;
    }

    function peg$parsedatatype_types() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsedatatype_text();
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c446(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsedatatype_real();
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          peg$silentFails++;
          s3 = peg$parsename_char();
          peg$silentFails--;
          if (s3 === peg$FAILED) {
            s2 = void 0;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c447(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsedatatype_numeric();
          if (s1 !== peg$FAILED) {
            s2 = peg$currPos;
            peg$silentFails++;
            s3 = peg$parsename_char();
            peg$silentFails--;
            if (s3 === peg$FAILED) {
              s2 = void 0;
            } else {
              peg$currPos = s2;
              s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c448(s1);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsedatatype_integer();
            if (s1 !== peg$FAILED) {
              s2 = peg$currPos;
              peg$silentFails++;
              s3 = peg$parsename_char();
              peg$silentFails--;
              if (s3 === peg$FAILED) {
                s2 = void 0;
              } else {
                peg$currPos = s2;
                s2 = peg$FAILED;
              }
              if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c449(s1);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parsedatatype_none();
              if (s1 !== peg$FAILED) {
                s2 = peg$currPos;
                peg$silentFails++;
                s3 = peg$parsename_char();
                peg$silentFails--;
                if (s3 === peg$FAILED) {
                  s2 = void 0;
                } else {
                  peg$currPos = s2;
                  s2 = peg$FAILED;
                }
                if (s2 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c450(s1);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c445); }
      }

      return s0;
    }

    function peg$parsedatatype_text() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.substr(peg$currPos, 1).toLowerCase() === peg$c452) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c453); }
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      if (s2 !== peg$FAILED) {
        if (input.substr(peg$currPos, 3).toLowerCase() === peg$c454) {
          s3 = input.substr(peg$currPos, 3);
          peg$currPos += 3;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c455); }
        }
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        if (s3 !== peg$FAILED) {
          if (input.substr(peg$currPos, 4).toLowerCase() === peg$c456) {
            s4 = input.substr(peg$currPos, 4);
            peg$currPos += 4;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c457); }
          }
          if (s4 !== peg$FAILED) {
            s2 = [s2, s3, s4];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        if (input.substr(peg$currPos, 4).toLowerCase() === peg$c458) {
          s2 = input.substr(peg$currPos, 4);
          peg$currPos += 4;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c459); }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 6).toLowerCase() === peg$c460) {
            s2 = input.substr(peg$currPos, 6);
            peg$currPos += 6;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c461); }
          }
          if (s2 === peg$FAILED) {
            if (input.substr(peg$currPos, 4).toLowerCase() === peg$c462) {
              s2 = input.substr(peg$currPos, 4);
              peg$currPos += 4;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c463); }
            }
          }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 4).toLowerCase() === peg$c464) {
            s3 = input.substr(peg$currPos, 4);
            peg$currPos += 4;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c465); }
          }
          if (s3 !== peg$FAILED) {
            s2 = [s2, s3];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 4).toLowerCase() === peg$c466) {
            s1 = input.substr(peg$currPos, 4);
            peg$currPos += 4;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c467); }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c48(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c451); }
      }

      return s0;
    }

    function peg$parsedatatype_real() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsedatatype_real_double();
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 5).toLowerCase() === peg$c469) {
          s1 = input.substr(peg$currPos, 5);
          peg$currPos += 5;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c470); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 4).toLowerCase() === peg$c471) {
            s1 = input.substr(peg$currPos, 4);
            peg$currPos += 4;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c472); }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c48(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c468); }
      }

      return s0;
    }

    function peg$parsedatatype_real_double() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c474) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c475); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsereal_double_precision();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c476(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c473); }
      }

      return s0;
    }

    function peg$parsereal_double_precision() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsee();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 9).toLowerCase() === peg$c477) {
          s2 = input.substr(peg$currPos, 9);
          peg$currPos += 9;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c478); }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c479(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsedatatype_numeric() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c481) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c482); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 7).toLowerCase() === peg$c483) {
          s1 = input.substr(peg$currPos, 7);
          peg$currPos += 7;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c484); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 7).toLowerCase() === peg$c485) {
            s1 = input.substr(peg$currPos, 7);
            peg$currPos += 7;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c486); }
          }
          if (s1 === peg$FAILED) {
            s1 = peg$currPos;
            if (input.substr(peg$currPos, 4).toLowerCase() === peg$c487) {
              s2 = input.substr(peg$currPos, 4);
              peg$currPos += 4;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c488); }
            }
            if (s2 !== peg$FAILED) {
              if (input.substr(peg$currPos, 4).toLowerCase() === peg$c489) {
                s3 = input.substr(peg$currPos, 4);
                peg$currPos += 4;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c490); }
              }
              if (s3 === peg$FAILED) {
                s3 = null;
              }
              if (s3 !== peg$FAILED) {
                s2 = [s2, s3];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
            if (s1 === peg$FAILED) {
              s1 = peg$currPos;
              if (input.substr(peg$currPos, 4).toLowerCase() === peg$c489) {
                s2 = input.substr(peg$currPos, 4);
                peg$currPos += 4;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c490); }
              }
              if (s2 !== peg$FAILED) {
                if (input.substr(peg$currPos, 5).toLowerCase() === peg$c491) {
                  s3 = input.substr(peg$currPos, 5);
                  peg$currPos += 5;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c492); }
                }
                if (s3 === peg$FAILED) {
                  s3 = null;
                }
                if (s3 !== peg$FAILED) {
                  s2 = [s2, s3];
                  s1 = s2;
                } else {
                  peg$currPos = s1;
                  s1 = peg$FAILED;
                }
              } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
              }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c48(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c480); }
      }

      return s0;
    }

    function peg$parsedatatype_integer() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c494) {
        s2 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c495); }
      }
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 50) {
          s3 = peg$c496;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c497); }
        }
        if (s3 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 52) {
            s3 = peg$c498;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c499); }
          }
          if (s3 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 56) {
              s3 = peg$c500;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c501); }
            }
            if (s3 === peg$FAILED) {
              if (input.substr(peg$currPos, 4).toLowerCase() === peg$c502) {
                s3 = input.substr(peg$currPos, 4);
                peg$currPos += 4;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c503); }
              }
            }
          }
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        if (input.substr(peg$currPos, 3).toLowerCase() === peg$c504) {
          s2 = input.substr(peg$currPos, 3);
          peg$currPos += 3;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c505); }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 6).toLowerCase() === peg$c460) {
            s2 = input.substr(peg$currPos, 6);
            peg$currPos += 6;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c461); }
          }
          if (s2 === peg$FAILED) {
            if (input.substr(peg$currPos, 5).toLowerCase() === peg$c506) {
              s2 = input.substr(peg$currPos, 5);
              peg$currPos += 5;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c507); }
            }
            if (s2 === peg$FAILED) {
              if (input.substr(peg$currPos, 4).toLowerCase() === peg$c458) {
                s2 = input.substr(peg$currPos, 4);
                peg$currPos += 4;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c459); }
              }
            }
          }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 3).toLowerCase() === peg$c494) {
            s3 = input.substr(peg$currPos, 3);
            peg$currPos += 3;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c495); }
          }
          if (s3 !== peg$FAILED) {
            s2 = [s2, s3];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c48(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c493); }
      }

      return s0;
    }

    function peg$parsedatatype_none() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c509) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c510); }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c48(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c508); }
      }

      return s0;
    }

    function peg$parsename_char() {
      var s0;

      if (peg$c511.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c512); }
      }

      return s0;
    }

    function peg$parsename() {
      var s0;

      s0 = peg$parsename_bracketed();
      if (s0 === peg$FAILED) {
        s0 = peg$parsename_backticked();
        if (s0 === peg$FAILED) {
          s0 = peg$parsename_dblquoted();
          if (s0 === peg$FAILED) {
            s0 = peg$parsename_sglquoted();
            if (s0 === peg$FAILED) {
              s0 = peg$parsename_unquoted();
            }
          }
        }
      }

      return s0;
    }

    function peg$parsename_unquoted() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$parsedatatype_types();
      if (s2 === peg$FAILED) {
        s2 = peg$parsereserved_words();
        if (s2 === peg$FAILED) {
          s2 = peg$parsenumber_digit();
        }
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_char();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_char();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c513(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsename_bracketed() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsesym_bopen();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_bracketed_schar();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_bracketed_schar();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_bclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c45(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsename_bracketed_schar() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = [];
      s4 = peg$parsewhitespace_space();
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$parsewhitespace_space();
      }
      if (s3 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 93) {
          s4 = peg$c514;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c515); }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        if (peg$c516.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c517); }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c8(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsename_dblquoted() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 34) {
        s1 = peg$c518;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c519); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_dblquoted_schar();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_dblquoted_schar();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s3 = peg$c518;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c519); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c520(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsename_dblquoted_schar() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c521) {
        s0 = peg$c521;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c522); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c523.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c524); }
        }
      }

      return s0;
    }

    function peg$parsename_sglquoted() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 39) {
        s1 = peg$c525;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c526); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_sglquoted_schar();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_sglquoted_schar();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s3 = peg$c525;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c526); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c527(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsename_sglquoted_schar() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c66) {
        s0 = peg$c66;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c67); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c68.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c69); }
        }
      }

      return s0;
    }

    function peg$parsename_backticked() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 96) {
        s1 = peg$c528;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c529); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_backticked_schar();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_backticked_schar();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 96) {
            s3 = peg$c528;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c529); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c530(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsename_backticked_schar() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c531) {
        s0 = peg$c531;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c532); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c533.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c534); }
        }
      }

      return s0;
    }

    function peg$parsesym_bopen() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
        s1 = peg$c536;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c537); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c535); }
      }

      return s0;
    }

    function peg$parsesym_bclose() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 93) {
        s1 = peg$c514;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c515); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c538); }
      }

      return s0;
    }

    function peg$parsesym_popen() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 40) {
        s1 = peg$c540;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c541); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c539); }
      }

      return s0;
    }

    function peg$parsesym_pclose() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 41) {
        s1 = peg$c543;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c544); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c542); }
      }

      return s0;
    }

    function peg$parsesym_comma() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 44) {
        s1 = peg$c546;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c547); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c545); }
      }

      return s0;
    }

    function peg$parsesym_dot() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 46) {
        s1 = peg$c549;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c550); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c548); }
      }

      return s0;
    }

    function peg$parsesym_star() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 42) {
        s1 = peg$c552;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c553); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c551); }
      }

      return s0;
    }

    function peg$parsesym_quest() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 63) {
        s1 = peg$c555;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c556); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c554); }
      }

      return s0;
    }

    function peg$parsesym_sglquote() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 39) {
        s1 = peg$c525;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c526); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c557); }
      }

      return s0;
    }

    function peg$parsesym_dblquote() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 34) {
        s1 = peg$c518;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c519); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c558); }
      }

      return s0;
    }

    function peg$parsesym_backtick() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 96) {
        s1 = peg$c528;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c560); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c559); }
      }

      return s0;
    }

    function peg$parsesym_tilde() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 126) {
        s1 = peg$c562;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c563); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c561); }
      }

      return s0;
    }

    function peg$parsesym_plus() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 43) {
        s1 = peg$c565;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c566); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c564); }
      }

      return s0;
    }

    function peg$parsesym_minus() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 45) {
        s1 = peg$c568;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c569); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c567); }
      }

      return s0;
    }

    function peg$parsesym_equal() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 61) {
        s1 = peg$c570;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c571); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c414); }
      }

      return s0;
    }

    function peg$parsesym_amp() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 38) {
        s1 = peg$c573;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c574); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c572); }
      }

      return s0;
    }

    function peg$parsesym_pipe() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 124) {
        s1 = peg$c576;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c577); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c575); }
      }

      return s0;
    }

    function peg$parsesym_mod() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 37) {
        s1 = peg$c578;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c579); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c405); }
      }

      return s0;
    }

    function peg$parsesym_lt() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 60) {
        s1 = peg$c580;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c581); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c410); }
      }

      return s0;
    }

    function peg$parsesym_gt() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 62) {
        s1 = peg$c582;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c583); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c411); }
      }

      return s0;
    }

    function peg$parsesym_excl() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 33) {
        s1 = peg$c585;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c586); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c584); }
      }

      return s0;
    }

    function peg$parsesym_semi() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 59) {
        s1 = peg$c588;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c589); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c587); }
      }

      return s0;
    }

    function peg$parsesym_colon() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 58) {
        s1 = peg$c107;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c108); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c590); }
      }

      return s0;
    }

    function peg$parsesym_fslash() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 47) {
        s1 = peg$c592;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c593); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c591); }
      }

      return s0;
    }

    function peg$parsesym_bslash() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 92) {
        s1 = peg$c595;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c596); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c594); }
      }

      return s0;
    }

    function peg$parseABORT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c597) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c598); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseACTION() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c599) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c600); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseADD() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c601) {
        s1 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c602); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseAFTER() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c603) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c604); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseALL() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c605) {
        s1 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c606); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseALTER() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c607) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c608); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseANALYZE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c609) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c610); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseAND() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c611) {
        s1 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c612); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseAS() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c613) {
        s1 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c614); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseASC() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c615) {
        s1 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c616); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseATTACH() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c617) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c618); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseAUTOINCREMENT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 13).toLowerCase() === peg$c619) {
        s1 = input.substr(peg$currPos, 13);
        peg$currPos += 13;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c620); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseBEFORE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c621) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c622); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseBEGIN() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c623) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c624); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseBETWEEN() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c625) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c626); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseBY() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c627) {
        s1 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c628); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCASCADE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c629) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c630); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCASE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c631) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c632); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCAST() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c633) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c634); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCHECK() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c635) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c636); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCOLLATE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c637) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c638); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCOLUMN() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c639) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c640); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCOMMIT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c641) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c642); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCONFLICT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c643) {
        s1 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c644); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCONSTRAINT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 10).toLowerCase() === peg$c645) {
        s1 = input.substr(peg$currPos, 10);
        peg$currPos += 10;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c646); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCREATE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c647) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c648); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCROSS() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c649) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c650); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCURRENT_DATE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 12).toLowerCase() === peg$c651) {
        s1 = input.substr(peg$currPos, 12);
        peg$currPos += 12;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c652); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCURRENT_TIME() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 12).toLowerCase() === peg$c653) {
        s1 = input.substr(peg$currPos, 12);
        peg$currPos += 12;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c654); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseCURRENT_TIMESTAMP() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 17).toLowerCase() === peg$c655) {
        s1 = input.substr(peg$currPos, 17);
        peg$currPos += 17;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c656); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDATABASE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c657) {
        s1 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c658); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDEFAULT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c659) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c660); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDEFERRABLE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 10).toLowerCase() === peg$c661) {
        s1 = input.substr(peg$currPos, 10);
        peg$currPos += 10;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c662); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDEFERRED() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c663) {
        s1 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c664); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDELETE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c665) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c666); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDESC() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c667) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c668); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDETACH() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c669) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c670); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDISTINCT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c671) {
        s1 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c672); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseDROP() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c673) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c674); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEACH() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c675) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c676); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseELSE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c677) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c678); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEND() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c679) {
        s1 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c680); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseESCAPE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c681) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c682); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEXCEPT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c683) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c684); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEXCLUSIVE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c685) {
        s1 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c686); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEXISTS() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c687) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c688); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseEXPLAIN() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c689) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c690); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseFAIL() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c691) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c692); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseFOR() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c693) {
        s1 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c694); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseFOREIGN() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c695) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c696); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseFROM() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c697) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c698); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseFULL() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c699) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c700); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseGLOB() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c701) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c702); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseGROUP() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c703) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c704); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseHAVING() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c705) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c706); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseIF() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c707) {
        s1 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c708); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseIGNORE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c709) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c710); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseIMMEDIATE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c711) {
        s1 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c712); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseIN() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c713) {
        s1 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c714); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseINDEX() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c715) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c716); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseINDEXED() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c717) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c718); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseINITIALLY() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c719) {
        s1 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c720); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseINNER() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c721) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c722); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseINSERT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c723) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c724); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseINSTEAD() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c725) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c726); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseINTERSECT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c727) {
        s1 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c728); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseINTO() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c729) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c730); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseIS() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c41) {
        s1 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c42); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseISNULL() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c731) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c732); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseJOIN() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c733) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c734); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseKEY() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c735) {
        s1 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c736); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseLEFT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c737) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c738); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseLIKE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c739) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c740); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseLIMIT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c741) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c742); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseMATCH() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c743) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c744); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseNATURAL() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c745) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c746); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseNO() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c747) {
        s1 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c748); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseNOT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c46) {
        s1 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c47); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseNOTNULL() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c749) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c750); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseNULL() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c751) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c752); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseOF() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c753) {
        s1 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c754); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseOFFSET() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c755) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c756); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseON() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c757) {
        s1 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c758); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseOR() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c759) {
        s1 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c760); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseORDER() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c761) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c762); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseOUTER() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c763) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c764); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsePLAN() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c765) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c766); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsePRAGMA() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c767) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c768); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsePRIMARY() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c769) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c770); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseQUERY() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c771) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c772); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseRAISE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c773) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c774); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseRECURSIVE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c775) {
        s1 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c776); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseREFERENCES() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 10).toLowerCase() === peg$c777) {
        s1 = input.substr(peg$currPos, 10);
        peg$currPos += 10;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c778); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseREGEXP() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c779) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c780); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseREINDEX() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c781) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c782); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseRELEASE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c783) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c784); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseRENAME() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c785) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c786); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseREPLACE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c787) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c788); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseRESTRICT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c789) {
        s1 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c790); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseRIGHT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c791) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c792); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseROLLBACK() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c793) {
        s1 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c794); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseROW() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c795) {
        s1 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c796); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseROWID() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c797) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c798); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSAVEPOINT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c799) {
        s1 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c800); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSELECT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c801) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c802); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseSET() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c803) {
        s1 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c804); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTABLE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c805) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c806); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTEMP() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c807) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c808); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTEMPORARY() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c809) {
        s1 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c810); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTHEN() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c811) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c812); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTO() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c813) {
        s1 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c814); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTRANSACTION() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 11).toLowerCase() === peg$c815) {
        s1 = input.substr(peg$currPos, 11);
        peg$currPos += 11;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c816); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseTRIGGER() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c817) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c818); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseUNION() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c819) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c820); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseUNIQUE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c821) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c822); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseUPDATE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c823) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c824); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseUSING() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c825) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c826); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseVACUUM() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c827) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c828); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseVALUES() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c829) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c830); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseVIEW() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c831) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c832); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseVIRTUAL() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c833) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c834); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseWHEN() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c835) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c836); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseWHERE() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c837) {
        s1 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c838); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseWITH() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c839) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c840); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseWITHOUT() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c841) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c842); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsereserved_words() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsereserved_word_list();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c843(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsereserved_word_list() {
      var s0;

      s0 = peg$parseABORT();
      if (s0 === peg$FAILED) {
        s0 = peg$parseACTION();
        if (s0 === peg$FAILED) {
          s0 = peg$parseADD();
          if (s0 === peg$FAILED) {
            s0 = peg$parseAFTER();
            if (s0 === peg$FAILED) {
              s0 = peg$parseALL();
              if (s0 === peg$FAILED) {
                s0 = peg$parseALTER();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseANALYZE();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseAND();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseAS();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseASC();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseATTACH();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseAUTOINCREMENT();
                            if (s0 === peg$FAILED) {
                              s0 = peg$parseBEFORE();
                              if (s0 === peg$FAILED) {
                                s0 = peg$parseBEGIN();
                                if (s0 === peg$FAILED) {
                                  s0 = peg$parseBETWEEN();
                                  if (s0 === peg$FAILED) {
                                    s0 = peg$parseBY();
                                    if (s0 === peg$FAILED) {
                                      s0 = peg$parseCASCADE();
                                      if (s0 === peg$FAILED) {
                                        s0 = peg$parseCASE();
                                        if (s0 === peg$FAILED) {
                                          s0 = peg$parseCAST();
                                          if (s0 === peg$FAILED) {
                                            s0 = peg$parseCHECK();
                                            if (s0 === peg$FAILED) {
                                              s0 = peg$parseCOLLATE();
                                              if (s0 === peg$FAILED) {
                                                s0 = peg$parseCOLUMN();
                                                if (s0 === peg$FAILED) {
                                                  s0 = peg$parseCOMMIT();
                                                  if (s0 === peg$FAILED) {
                                                    s0 = peg$parseCONFLICT();
                                                    if (s0 === peg$FAILED) {
                                                      s0 = peg$parseCONSTRAINT();
                                                      if (s0 === peg$FAILED) {
                                                        s0 = peg$parseCREATE();
                                                        if (s0 === peg$FAILED) {
                                                          s0 = peg$parseCROSS();
                                                          if (s0 === peg$FAILED) {
                                                            s0 = peg$parseCURRENT_DATE();
                                                            if (s0 === peg$FAILED) {
                                                              s0 = peg$parseCURRENT_TIME();
                                                              if (s0 === peg$FAILED) {
                                                                s0 = peg$parseCURRENT_TIMESTAMP();
                                                                if (s0 === peg$FAILED) {
                                                                  s0 = peg$parseDATABASE();
                                                                  if (s0 === peg$FAILED) {
                                                                    s0 = peg$parseDEFAULT();
                                                                    if (s0 === peg$FAILED) {
                                                                      s0 = peg$parseDEFERRABLE();
                                                                      if (s0 === peg$FAILED) {
                                                                        s0 = peg$parseDEFERRED();
                                                                        if (s0 === peg$FAILED) {
                                                                          s0 = peg$parseDELETE();
                                                                          if (s0 === peg$FAILED) {
                                                                            s0 = peg$parseDESC();
                                                                            if (s0 === peg$FAILED) {
                                                                              s0 = peg$parseDETACH();
                                                                              if (s0 === peg$FAILED) {
                                                                                s0 = peg$parseDISTINCT();
                                                                                if (s0 === peg$FAILED) {
                                                                                  s0 = peg$parseDROP();
                                                                                  if (s0 === peg$FAILED) {
                                                                                    s0 = peg$parseEACH();
                                                                                    if (s0 === peg$FAILED) {
                                                                                      s0 = peg$parseELSE();
                                                                                      if (s0 === peg$FAILED) {
                                                                                        s0 = peg$parseEND();
                                                                                        if (s0 === peg$FAILED) {
                                                                                          s0 = peg$parseESCAPE();
                                                                                          if (s0 === peg$FAILED) {
                                                                                            s0 = peg$parseEXCEPT();
                                                                                            if (s0 === peg$FAILED) {
                                                                                              s0 = peg$parseEXCLUSIVE();
                                                                                              if (s0 === peg$FAILED) {
                                                                                                s0 = peg$parseEXISTS();
                                                                                                if (s0 === peg$FAILED) {
                                                                                                  s0 = peg$parseEXPLAIN();
                                                                                                  if (s0 === peg$FAILED) {
                                                                                                    s0 = peg$parseFAIL();
                                                                                                    if (s0 === peg$FAILED) {
                                                                                                      s0 = peg$parseFOR();
                                                                                                      if (s0 === peg$FAILED) {
                                                                                                        s0 = peg$parseFOREIGN();
                                                                                                        if (s0 === peg$FAILED) {
                                                                                                          s0 = peg$parseFROM();
                                                                                                          if (s0 === peg$FAILED) {
                                                                                                            s0 = peg$parseFULL();
                                                                                                            if (s0 === peg$FAILED) {
                                                                                                              s0 = peg$parseGLOB();
                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                s0 = peg$parseGROUP();
                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                  s0 = peg$parseHAVING();
                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                    s0 = peg$parseIF();
                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                      s0 = peg$parseIGNORE();
                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                        s0 = peg$parseIMMEDIATE();
                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                          s0 = peg$parseIN();
                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                            s0 = peg$parseINDEX();
                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                              s0 = peg$parseINDEXED();
                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                s0 = peg$parseINITIALLY();
                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                  s0 = peg$parseINNER();
                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                    s0 = peg$parseINSERT();
                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                      s0 = peg$parseINSTEAD();
                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                        s0 = peg$parseINTERSECT();
                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                          s0 = peg$parseINTO();
                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                            s0 = peg$parseIS();
                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                              s0 = peg$parseISNULL();
                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                s0 = peg$parseJOIN();
                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                  s0 = peg$parseKEY();
                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                    s0 = peg$parseLEFT();
                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                      s0 = peg$parseLIKE();
                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                        s0 = peg$parseLIMIT();
                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                          s0 = peg$parseMATCH();
                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                            s0 = peg$parseNATURAL();
                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                              s0 = peg$parseNO();
                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                s0 = peg$parseNOT();
                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                  s0 = peg$parseNOTNULL();
                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                    s0 = peg$parseNULL();
                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                      s0 = peg$parseOF();
                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                        s0 = peg$parseOFFSET();
                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                          s0 = peg$parseON();
                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                            s0 = peg$parseOR();
                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                              s0 = peg$parseORDER();
                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                s0 = peg$parseOUTER();
                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                  s0 = peg$parsePLAN();
                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                    s0 = peg$parsePRAGMA();
                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                      s0 = peg$parsePRIMARY();
                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                        s0 = peg$parseQUERY();
                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                          s0 = peg$parseRAISE();
                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                            s0 = peg$parseRECURSIVE();
                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                              s0 = peg$parseREFERENCES();
                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                s0 = peg$parseREGEXP();
                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                  s0 = peg$parseREINDEX();
                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                    s0 = peg$parseRELEASE();
                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                      s0 = peg$parseRENAME();
                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                        s0 = peg$parseREPLACE();
                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                          s0 = peg$parseRESTRICT();
                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                            s0 = peg$parseRIGHT();
                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                              s0 = peg$parseROLLBACK();
                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                s0 = peg$parseROW();
                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                  s0 = peg$parseROWID();
                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                    s0 = peg$parseSAVEPOINT();
                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                      s0 = peg$parseSELECT();
                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                        s0 = peg$parseSET();
                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                          s0 = peg$parseTABLE();
                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                            s0 = peg$parseTEMP();
                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                              s0 = peg$parseTEMPORARY();
                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                s0 = peg$parseTHEN();
                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                  s0 = peg$parseTO();
                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                    s0 = peg$parseTRANSACTION();
                                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                      s0 = peg$parseTRIGGER();
                                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                        s0 = peg$parseUNION();
                                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                          s0 = peg$parseUNIQUE();
                                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                            s0 = peg$parseUPDATE();
                                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                              s0 = peg$parseUSING();
                                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                s0 = peg$parseVACUUM();
                                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                  s0 = peg$parseVALUES();
                                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                    s0 = peg$parseVIEW();
                                                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                      s0 = peg$parseVIRTUAL();
                                                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                        s0 = peg$parseWHEN();
                                                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                          s0 = peg$parseWHERE();
                                                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                            s0 = peg$parseWITH();
                                                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                              s0 = peg$parseWITHOUT();
                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                }
                                                                                                                                                                                                                              }
                                                                                                                                                                                                                            }
                                                                                                                                                                                                                          }
                                                                                                                                                                                                                        }
                                                                                                                                                                                                                      }
                                                                                                                                                                                                                    }
                                                                                                                                                                                                                  }
                                                                                                                                                                                                                }
                                                                                                                                                                                                              }
                                                                                                                                                                                                            }
                                                                                                                                                                                                          }
                                                                                                                                                                                                        }
                                                                                                                                                                                                      }
                                                                                                                                                                                                    }
                                                                                                                                                                                                  }
                                                                                                                                                                                                }
                                                                                                                                                                                              }
                                                                                                                                                                                            }
                                                                                                                                                                                          }
                                                                                                                                                                                        }
                                                                                                                                                                                      }
                                                                                                                                                                                    }
                                                                                                                                                                                  }
                                                                                                                                                                                }
                                                                                                                                                                              }
                                                                                                                                                                            }
                                                                                                                                                                          }
                                                                                                                                                                        }
                                                                                                                                                                      }
                                                                                                                                                                    }
                                                                                                                                                                  }
                                                                                                                                                                }
                                                                                                                                                              }
                                                                                                                                                            }
                                                                                                                                                          }
                                                                                                                                                        }
                                                                                                                                                      }
                                                                                                                                                    }
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                              }
                                                                                                                                            }
                                                                                                                                          }
                                                                                                                                        }
                                                                                                                                      }
                                                                                                                                    }
                                                                                                                                  }
                                                                                                                                }
                                                                                                                              }
                                                                                                                            }
                                                                                                                          }
                                                                                                                        }
                                                                                                                      }
                                                                                                                    }
                                                                                                                  }
                                                                                                                }
                                                                                                              }
                                                                                                            }
                                                                                                          }
                                                                                                        }
                                                                                                      }
                                                                                                    }
                                                                                                  }
                                                                                                }
                                                                                              }
                                                                                            }
                                                                                          }
                                                                                        }
                                                                                      }
                                                                                    }
                                                                                  }
                                                                                }
                                                                              }
                                                                            }
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsecomment() {
      var s0, s1;

      s0 = peg$parsecomment_line();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsecomment_block();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c844();
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parsecomment_line() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecomment_line_start();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parsewhitespace_line();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = void 0;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsematch_all();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          s5 = peg$parsewhitespace_line();
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = void 0;
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsematch_all();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c845); }
      }

      return s0;
    }

    function peg$parsecomment_line_start() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c846) {
        s0 = peg$c846;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c847); }
      }

      return s0;
    }

    function peg$parsecomment_block() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecomment_block_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecomment_block_feed();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecomment_block_end();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c848); }
      }

      return s0;
    }

    function peg$parsecomment_block_start() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c849) {
        s0 = peg$c849;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c850); }
      }

      return s0;
    }

    function peg$parsecomment_block_end() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c851) {
        s0 = peg$c851;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c852); }
      }

      return s0;
    }

    function peg$parsecomment_block_body() {
      var s0, s1, s2, s3;

      s0 = [];
      s1 = peg$currPos;
      s2 = peg$currPos;
      peg$silentFails++;
      s3 = peg$parsecomment_block_end();
      if (s3 === peg$FAILED) {
        s3 = peg$parsecomment_block_start();
      }
      peg$silentFails--;
      if (s3 === peg$FAILED) {
        s2 = void 0;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsematch_all();
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          s1 = peg$currPos;
          s2 = peg$currPos;
          peg$silentFails++;
          s3 = peg$parsecomment_block_end();
          if (s3 === peg$FAILED) {
            s3 = peg$parsecomment_block_start();
          }
          peg$silentFails--;
          if (s3 === peg$FAILED) {
            s2 = void 0;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parsematch_all();
            if (s3 !== peg$FAILED) {
              s2 = [s2, s3];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        }
      } else {
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseblock_body_nodes() {
      var s0;

      s0 = peg$parsecomment_block_body();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecomment_block();
      }

      return s0;
    }

    function peg$parsecomment_block_feed() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseblock_body_nodes();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsewhitespace();
        if (s3 === peg$FAILED) {
          s3 = peg$parseblock_body_nodes();
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsewhitespace();
          if (s3 === peg$FAILED) {
            s3 = peg$parseblock_body_nodes();
          }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsematch_all() {
      var s0;

      if (input.length > peg$currPos) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c853); }
      }

      return s0;
    }

    function peg$parseo() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsewhitespace_nodes();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsewhitespace_nodes();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c8(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsee() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsewhitespace_nodes();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsewhitespace_nodes();
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c8(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsewhitespace_nodes() {
      var s0;

      s0 = peg$parsewhitespace();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecomment();
      }

      return s0;
    }

    function peg$parsewhitespace() {
      var s0;

      s0 = peg$parsewhitespace_space();
      if (s0 === peg$FAILED) {
        s0 = peg$parsewhitespace_line();
      }

      return s0;
    }

    function peg$parsewhitespace_space() {
      var s0, s1;

      peg$silentFails++;
      if (peg$c855.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c856); }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c854); }
      }

      return s0;
    }

    function peg$parsewhitespace_line() {
      var s0, s1;

      peg$silentFails++;
      if (peg$c858.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c859); }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c857); }
      }

      return s0;
    }

    function peg$parse_TODO_() {
      var s0;

      if (input.substr(peg$currPos, 8) === peg$c860) {
        s0 = peg$c860;
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c861); }
      }

      return s0;
    }


      var util = require('./parser-util');


    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(
        null,
        peg$maxFailExpected,
        peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  return {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})();

},{"./parser-util":2}]},{},[1])(1)
});