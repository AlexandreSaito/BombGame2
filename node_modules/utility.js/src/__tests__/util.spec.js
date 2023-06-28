import * as _ from '../util'
import format from '../format'

describe("is", () => {

  it("isDefine", () => {
    expect(_.isDefine(null)).to.equal(true)
    expect(_.isDefine(undefined)).to.equal(false)
  })

  it("isNull", () => {
    expect(_.isNull(null)).to.equal(true)
    expect(_.isNull(undefined)).to.equal(false)

  })

  it("isNil", () => {
    expect(_.isNil(null)).to.equal(true)
    expect(_.isNil(undefined)).to.equal(true)
    expect(_.isNil(0)).to.equal(false)
  })

  it("isFunc", () => {
    expect(_.isFunc(() => {})).to.equal(true)
  })

  it("isNumber", () => {
    expect(_.isNumber(0)).to.equal(true)
    expect(_.isNumber(NaN)).to.equal(true)
    expect(_.isNumber('0')).to.equal(false)
  })

  it("isBool", () => {
    expect(_.isBool(true)).to.equal(true)
    expect(_.isBool('')).to.equal(false)

  })

  it("isDate", () => {
    expect(_.isDate(new Date())).to.equal(true)
  })

  it("isString", () => {
    expect(_.isString('')).to.equal(true)
  })

  it("isObject", () => {
    expect(_.isObject({})).to.equal(true)
    expect(_.isObject(Object)).to.equal(false)
  })

  it("isRegExp", () => {
    expect(_.isRegExp(/^a/)).to.equal(true)
  })

  it("isArray", () => {
    expect(_.isArray([])).to.equal(true)

    function arg() {
      expect(_.isArray(arguments)).to.equal(false)
    }
    arg()
  })

  it("isArrayLike", () => {
    expect(_.isArrayLike([])).to.equal(true)

    function arg() {
      expect(_.isArrayLike(arguments)).to.equal(true)
    }
    arg()
  })
})
describe("collection utils", () => {
  let arr = [1, 2, 3],
    obj = {
      0: 1,
      1: 2,
      2: 3
    }

  it('each', () => {
    let rs = {}
    _.each(arr, (val, idx) => {
      rs[idx] = val
    })
    expect(rs).to.eql(obj)
    rs = {}
    _.each(obj, (val, idx) => {
      rs[idx] = val
    })
    expect(rs).to.eql(obj)

  })

  it('map', () => {
    expect(_.map(arr, (val) => val + 1)).to.eql([2, 3, 4])
    expect(_.map(obj, (val) => val + 1)).to.eql({
      0: 2,
      1: 3,
      2: 4
    })
  })

  it('filter', () => {
    expect(_.filter(arr, (val) => val - 1)).to.eql([2, 3])
    expect(_.filter(obj, (val) => val - 1)).to.eql({
      1: 2,
      2: 3
    })
  })

  it('aggregate', () => {
    expect(_.aggregate(arr, (rs, val) => rs + val, 0)).to.equal(6)
    expect(_.aggregate(obj, (rs, val) => rs + val, 0)).to.equal(6)
  })

  it('indexof', () => {
    expect(_.indexOf(arr, 2)).to.equal(1)
    expect(_.indexOf(obj, 2)).to.equal('1')
  })

  it('indexof', () => {
    expect(_.lastIndexOf(arr, 2)).to.equal(1)
    expect(_.lastIndexOf(obj, 2)).to.equal('1')
  })

  it('convert', () => {
    expect(_.convert(arr, (v, k) => k + 1, (v) => v + 1)).to.eql({
      1: 2,
      2: 3,
      3: 4
    })
    expect(_.convert(obj, (v, k) => parseInt(k) + 1, (v) => v + 1)).to.eql({
      1: 2,
      2: 3,
      3: 4
    })
  })
  it('reverseConvert', () => {
    expect(_.reverseConvert(arr, (v, k) => k)).to.eql({
      1: 0,
      2: 1,
      3: 2
    })
    expect(_.reverseConvert(obj, (v, k) => k)).to.eql({
      1: 0,
      2: 1,
      3: 2
    })
  })
})

describe("string utils", () => {
  it('upperFirst', () => {
    expect(_.upperFirst('abc')).to.equal('Abc')
  })
  it('trim', () => {
    expect(_.ltrim(' ab c ')).to.equal('ab c ')
    expect(_.rtrim(' ab c ')).to.equal(' ab c')
    expect(_.trim(' ab c ')).to.equal('ab c')
  })
  it('format', () => {
    expect(format('%s %d', 'abc', 1)).to.equal('abc 1')
  })
  it('parseExpr', () => {
    expect(_.parseExpr('a.b.c')).to.eql(['a', 'b', 'c'])
    expect(_.parseExpr('a["b"].c')).to.eql(['a', 'b', 'c'])
  })
})

describe("object utils", () => {
  it('keys', () => {
    expect(_.keys({
      a: 1
    })).to.eql(['a'])
  })

  it('hasOwnProp', () => {
    expect(_.hasOwnProp({
      a: 1
    }, 'a')).to.equal(true)
    expect(_.hasOwnProp({
      a: 1
    }, 'toString')).to.equal(false)
  })

  it('get & set & has', () => {
    let o = {
      a: {
        b: [1, 2, 3]
      }
    }
    expect(_.get(o, 'a.b[0]')).to.equal(1)
    expect(_.get(o, 'a.b[1]')).to.equal(2)

    expect(_.has(o, 'a.b[0]')).to.equal(true)
    expect(_.has(o, 'a.b[4]')).to.equal(false)

    _.set(o, 'a.b[0]', 2)
    expect(o.a.b[0]).to.equal(2)
    expect(_.get(o, 'a.b[0]')).to.equal(2)
  })

  it('prototypeOf', () => {
    let o = {},
      fn = function() {}

    _.setPrototypeOf(o, fn)
    expect(_.prototypeOf(o)).to.equal(fn)
  })

  it('assign', () => {

    expect(_.assign({
      a: 1
    }, {
      a: 2,
      b: 3
    })).to.eql({
      a: 2,
      b: 3
    })

    expect(_.assignIf({
      a: 1
    }, {
      a: 2,
      b: 3
    })).to.eql({
      a: 1,
      b: 3
    })
  })

  it('create', () => {
    let o = {
        a: 1
      },
      o2 = _.create(o)

    expect(o2.a).to.equal(1)
    expect(_.hasOwnProp(o2, 'a')).to.equal(false)

    o2.a = 2
    expect(o.a).to.equal(1)
  })
})

describe("class utils", () => {
  it('class', () => {
    let root = _.dynamicClass({
        constructor(val) {
          this.val = val
        },
        value() {
          return this.val
        }
      }),
      parent = _.dynamicClass({
        extend: root,
        constructor(val, val2) {
          this.super([val])
          this.val2 = val2
          expect(this.superclass()).to.equal(root.prototype)
        },
        value() {
          expect(this.super()).to.equal(this.val)
          return this.val2
        }
      }),
      child = _.dynamicClass({
        extend: parent,
        constructor() {
          expect(this.superclass()).to.equal(parent.prototype)
          this.super(arguments)
        }
      }),
      class4 = _.dynamicClass({
        statics: {
          a: 1
        }
      })

    expect(_.isExtendOf(parent, Object)).to.equal(true)
    expect(_.isExtendOf(parent, root)).to.equal(true)
    expect(_.isExtendOf(child, Object)).to.equal(true)
    expect(_.isExtendOf(child, parent)).to.equal(true)
    expect(_.isExtendOf(child, root)).to.equal(true)
    expect(_.isExtendOf(child, class4)).to.equal(false)
    expect(class4.a).to.equal(1)

    let c = new child(1, 2)
    expect(_.isExtendOf(c, parent)).to.equal(true)
    expect(_.isExtendOf(c, root)).to.equal(true)
    expect(_.isExtendOf(c, Object)).to.equal(true)
    expect(_.isExtendOf(c, class4)).to.equal(false)

  })
})
