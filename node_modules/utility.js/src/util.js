import './polyfill'

const toStr = Object.prototype.toString,
  hasOwn = Object.prototype.hasOwnProperty,
  policies = {
    hasOwn(obj, prop) {
      return hasOwn.call(obj, prop)
    },
    eq(o1, o2) {
      return o1 === o2
    }
  }

export function overridePolicy(name, policy) {
  policies[name] = policy
}

export function policy(name) {
  return policies[name]
}

export function eq(o1, o2) {
  return policies.eq(o1, o2)
}

export function hasOwnProp(o1, o2) {
  return policies.hasOwn(o1, o2)
}


// ==============================================
// type utils
// ==============================================
const argsType = '[object Arguments]',
  arrayType = '[object Array]',
  funcType = '[object Function]',
  boolType = '[object Boolean]',
  numberType = '[object Number]',
  dateType = '[object Date]',
  stringType = '[object String]',
  objectType = '[object Object]',
  regexpType = '[object RegExp]',
  nodeListType = '[object NodeList]'

export function isPrimitive(obj) {
  if (obj === null || obj === undefined)
    return true
  let type = toStr.call(obj)
  switch (type) {
    case boolType:
    case numberType:
    case stringType:
    case funcType:
      return true
  }
  return false
}

export function isDefine(obj) {
  return obj !== undefined
}

export function isNull(obj) {
  return obj === null
}

export function isNil(obj) {
  return obj === undefined || obj === null
}

export function isArray(obj) {
  return toStr.call(obj) === arrayType
}

export function isFunc(obj) {
  return toStr.call(obj) === funcType
}

export function isNumber(obj) {
  return toStr.call(obj) === numberType
}

export function isBool(obj) {
  return toStr.call(obj) === boolType
}

export function isDate(obj) {
  return toStr.call(obj) === dateType
}

export function isString(obj) {
  return toStr.call(obj) === stringType
}

export function isObject(obj) {
  return toStr.call(obj) === objectType
}

export function isRegExp(obj) {
  return toStr.call(obj) === regexpType
}

export function isArrayLike(obj) {
  let type = toStr.call(obj)
  switch (type) {
    case argsType:
    case arrayType:
    case stringType:
    case nodeListType:
      return true
    default:
      if (obj) {
        let length = obj.length
        return isNumber(length) && (length ? length > 0 && (length - 1) in obj : length === 0)
      }
      return false
  }
}

// ==============================================
// array utils
// ==============================================
function _eachObj(obj, callback, scope, own) {
  let key, isOwn

  scope = scope || obj
  for (key in obj) {
    isOwn = hasOwnProp(obj, key)
    if (own === false || isOwn) {
      if (callback.call(scope, obj[key], key, obj, isOwn) === false)
        return false
    }
  }
  return true
}

function _eachArray(obj, callback, scope) {
  let i = 0,
    j = obj.length

  scope = scope || obj
  for (; i < j; i++) {
    if (callback.call(scope, obj[i], i, obj, true) === false)
      return false
  }
  return true
}

export function each(obj, callback, scope, own) {
  if (isArrayLike(obj)) {
    return _eachArray(obj, callback, scope)
  } else if (!isNil(obj)) {
    return _eachObj(obj, callback, scope, own)
  }
  return true
}

export function map(obj, callback, scope, own) {
  let ret

  function cb(val, key) {
    ret[key] = callback.apply(this, arguments)
  }

  if (isArrayLike(obj)) {
    ret = []
    _eachArray(obj, cb, scope)
  } else {
    ret = {}
    if (!isNil(obj))
      _eachObj(obj, cb, scope, own)
  }
  return ret
}

export function filter(obj, callback, scope, own) {
  let ret

  if (isArrayLike(obj)) {
    ret = []
    _eachArray(obj, function(val) {
      if (callback.apply(this, arguments))
        ret.push(val)
    }, scope)
  } else {
    ret = {}
    if (!isNil(obj))
      _eachObj(obj, function(val, key) {
        if (callback.apply(this, arguments))
          ret[key] = val
      }, scope, own)
  }
  return ret
}

export function aggregate(obj, callback, defVal, scope, own) {
  let rs = defVal

  each(obj, function(val, key, obj, isOwn) {
    rs = callback.call(this, rs, val, key, obj, isOwn)
  }, scope, own)
  return rs
}

export function keys(obj, filter, scope, own) {
  let keys = []

  each(obj, function(val, key) {
    if (!filter || filter.apply(this, arguments))
      keys.push(key)
  }, scope, own)
  return keys
}

export function values(obj, filter, scope, own) {
  let values = []

  each(obj, function(val, key) {
    if (!filter || filter.apply(this, arguments))
      values.push(val)
  }, scope, own)
  return values
}

function _indexOfArray(array, val) {
  let i = 0,
    l = array.length

  for (; i < l; i++) {
    if (eq(array[i], val))
      return i
  }
  return -1
}

function _lastIndexOfArray(array, val) {
  let i = array.length

  while (i-- > 0) {
    if (eq(array[i], val))
      return i
  }
}

function _indexOfObj(obj, val, own) {
  for (key in obj) {
    if (own === false || hasOwnProp(obj, key)) {
      if (eq(obj[key], val))
        return key
    }
  }
  return undefined
}

export function indexOf(obj, val, own) {
  if (isArrayLike(obj)) {
    return _indexOfArray(obj, val)
  } else {
    return _indexOfObj(obj, val, own)
  }
}

export function lastIndexOf(obj, val, own) {
  if (isArrayLike(obj)) {
    return _lastIndexOfArray(obj, val)
  } else {
    return _indexOfObj(obj, val, own)
  }
}

export function convert(obj, keyGen, valGen, scope, own) {
  let o = {}

  each(obj, function(val, key) {
    o[keyGen ? keyGen.apply(this, arguments) : key] = valGen ? valGen.apply(this, arguments) : val
  }, scope, own)
  return o
}

export function reverseConvert(obj, valGen, scope, own) {
  let o = {}

  each(obj, function(val, key) {
    o[val] = valGen ? valGen.apply(this, arguments) : key
  }, scope, own)
  return o
}

// ==============================================
// string utils
// ==============================================
const regFirstChar = /^[a-z]/,
  regLeftTrim = /^\s+/,
  regRightTrim = /\s+$/,
  regTrim = /(^\s+)|(\s+$)/g

function _uppercase(k) {
  return k.toUpperCase()
}

export function upperFirst(str) {
  return str.replace(regFirstChar, _uppercase)
}

export function ltrim(str) {
  return str.replace(regLeftTrim, '')
}

export function rtrim(str) {
  return str.replace(regRightTrim, '')
}

export function trim(str) {
  return str.replace(regTrim, '')
}

const thousandSeparationReg = /(\d)(?=(\d{3})+(?!\d))/g

export function thousandSeparate(number) {
  let split = (number + '').split('.')
  split[0] = split[0].replace(thousandSeparationReg, '$1,')
  return split.join('.')
}

const plurals = [{
    reg: /([a-zA-Z]+[^aeiou])y$/,
    rep: '$1ies'
  }, {
    reg: /([a-zA-Z]+[aeiou]y)$/,
    rep: '$1s'
  }, {
    reg: /([a-zA-Z]+[sxzh])$/,
    rep: '$1es'
  }, {
    reg: /([a-zA-Z]+[^sxzhy])$/,
    rep: '$1s'
  }],
  singulars = [{
    reg: /([a-zA-Z]+[^aeiou])ies$/,
    rep: '$1y'
  }, {
    reg: /([a-zA-Z]+[aeiou])s$/,
    rep: '$1'
  }, {
    reg: /([a-zA-Z]+[sxzh])es$/,
    rep: '$1'
  }, {
    reg: /([a-zA-Z]+[^sxzhy])s$/,
    rep: '$1'
  }]

export function plural(str) {
  let plural
  for (let i = 0; i < 4; i++) {
    plural = plurals[i]
    if (plural.reg.test(str))
      return str.replace(plural.reg, plural.rep)
  }
  return str
}
export function singular(str) {
  let singular
  for (let i = 0; i < 4; i++) {
    singular = singulars[i]
    if (singular.reg.test(str))
      return str.replace(singular.reg, singular.rep)
  }
  return str
}
// ==============================================
// object utils
// ==============================================
const exprCache = {},
  regPropertyName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g,
  regEscapeChar = /\\(\\)?/g

export function parseExpr(expr, autoCache) {
  if (isArray(expr)) {
    return expr
  } else if (isString(expr)) {
    let rs = exprCache[expr]

    if (rs)
      return rs
    rs = autoCache ? (exprCache[expr] = []) : []
    expr.replace(regPropertyName, function(match, number, quote, string) {
      rs.push(quote ? string.replace(regEscapeChar, '$1') : (number || match))
    })
    return rs
  } else {
    return []
  }
}

export function get(obj, expr, defVal, lastOwn, own) {
  let i = 0,
    path = parseExpr(expr, true),
    l = path.length - 1,
    prop

  while (!isNil(obj) && i < l) {
    prop = path[i++]
    if (own && !hasOwnProp(obj, prop))
      return defVal
    obj = obj[prop]
  }
  prop = path[i]
  return (i == l && !isNil(obj) && (own ? hasOwnProp(obj, prop) : prop in obj)) ? obj[prop] : defVal
}

export function has(obj, expr, lastOwn, own) {
  let i = 0,
    path = parseExpr(expr, true),
    l = path.length - 1,
    prop

  while (!isNil(obj) && i < l) {
    prop = path[i++]
    if (own && !hasOwnProp(obj, prop))
      return false
    obj = obj[prop]
  }
  prop = path[i]
  return i == l && !isNil(obj) && (own ? hasOwnProp(obj, prop) : prop in obj)
}

export function set(obj, expr, value) {
  let i = 0,
    path = parseExpr(expr, true),
    l = path.length - 1,
    prop = path[0],
    _obj = obj

  for (; i < l; i++) {
    if (isNil(_obj[prop])) {
      _obj = _obj[prop] = {}
    } else {
      _obj = _obj[prop]
    }
    prop = path[i + 1]
  }
  _obj[prop] = value
  return obj
}

export function getOwnProp(obj, key) {
  return hasOwnProp(obj, key) ? obj[key] : undefined
}

export let prototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function getPrototypeOf(obj) {
  return obj.__proto__
}

export let setPrototypeOf = Object.setPrototypeOf || function setPrototypeOf(obj, proto) {
  obj.__proto__ = proto
}

export let assign = Object.assign || function assign(target) {
  let source, key,
    i = 1,
    l = arguments.length

  for (; i < l; i++) {
    source = arguments[i]
    for (key in source) {
      if (hasOwnProp(source, key))
        target[key] = source[key]
    }
  }
  return target
}

export function assignIf(target) {
  let source, key,
    i = 1,
    l = arguments.length

  for (; i < l; i++) {
    source = arguments[i]
    for (key in source) {
      if (hasOwnProp(source, key) && !hasOwnProp(target, key))
        target[key] = source[key]
    }
  }
  return target
}

export function emptyFunc() {}

export let create = Object.create || function(parent, props) {
  emptyFunc.prototype = parent
  let obj = new emptyFunc()
  emptyFunc.prototype = undefined
  if (props)
    each(props, (prop, name) => {
      obj[name] = prop.value
    })
  return obj
}

export function isExtendOf(cls, parent) {
  if (!isFunc(cls))
    return (cls instanceof parent)

  let proto = cls

  while ((proto = prototypeOf(proto)) && proto !== Object) {
    if (proto === parent)
      return true
  }
  return parent === Object
}

// ==============================================
// dynamicClass
// ==============================================
const Base = function() {},
  emptyArray = []

assign(Base.prototype, {
  super(args) {
    let method = arguments.callee.caller
    method.$owner.superclass[method.$name].apply(this, args || emptyArray)
  },
  superclass() {
    let method = arguments.callee.caller
    return method.$owner.superclass
  }
})
assign(Base, {
  extend(overrides) {
    if (overrides) {
      var proto = this.prototype
      each(overrides, (member, name) => {
        if (isFunc(member)) {
          member.$owner = this
          member.$name = name
        }
        proto[name] = member
      })
      this.assign(overrides.statics)
    }
    return this
  },
  assign(statics) {
    if (statics)
      assign(this, statics)
    return this
  }
})

export function dynamicClass(overrides) {
  let cls = function DynamicClass() {
      this.constructor.apply(this, arguments)
    },
    superclass = overrides.extend,
    superproto, proto

  assign(cls, Base)

  if (!isFunc(superclass) || superclass === Object)
    superclass = Base

  superproto = superclass.prototype

  proto = create(superproto)

  cls.superclass = superproto
  cls.prototype = proto
  setPrototypeOf(cls, superclass)

  delete overrides.extend
  return cls.extend(overrides)
}
