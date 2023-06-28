import * as _ from './util'

let IDGenerator = 1

const LinkedList = _.dynamicClass({
  statics: {
    ListKey: '__UTILITY_LIST__'
  },
  constructor() {
    this._id = IDGenerator++;
    this.length = 0
    this._header = undefined
    this._tail = undefined
    this._version = 1
  },
  _listObj(obj) {
    return _.hasOwnProp(obj, LinkedList.ListKey) && obj[LinkedList.ListKey]
  },
  _desc(obj) {
    let list = this._listObj(obj)

    return list && list[this._id]
  },
  _getOrCreateDesc(obj) {
    let list = this._listObj(obj) || (obj[LinkedList.ListKey] = {}),
      desc = list[this._id]

    return desc || (list[this._id] = {
      obj: obj,
      prev: undefined,
      next: undefined,
      version: this._version++
    })
  },
  _unlink(desc) {
    let prev = desc.prev,
      next = desc.next

    if (prev) {
      prev.next = next
    } else {
      this._header = next
    }
    if (next) {
      next.prev = prev
    } else {
      this._tail = prev
    }
    this.length--
  },
  _move(desc, prev, alwaysMove) {
    let header = this._header

    if (header === desc || desc.prev)
      this._unlink(desc)

    desc.prev = prev
    if (prev) {
      desc.next = prev.next
      prev.next = desc
    } else {
      desc.next = header
      if (header)
        header.prev = desc
      this._header = desc
    }
    if (this._tail === prev)
      this._tail = desc
    this.length++
  },
  _remove(desc) {
    let obj = desc.obj,
      list = this._listObj(obj)

    this._unlink(desc)
    delete list[this._id]
  },
  push(obj) {
    return this.last(obj)
  },
  pop() {
    let desc = this._header

    if (desc) {
      this._remove(desc)
      return desc.obj
    }
    return undefined
  },
  shift() {
    let desc = this._tail

    if (desc) {
      this._remove(desc)
      return desc.obj
    }
    return undefined
  },
  first(obj) {
    if (arguments.length == 0) {
      let desc = this._header
      return desc && desc.obj
    }
    this._move(this._getOrCreateDesc(obj), undefined)
    return this
  },
  last(obj) {
    if (arguments.length == 0) {
      let desc = this._tail
      return desc && desc.obj
    }
    this._move(this._getOrCreateDesc(obj), this._tail)
    return this
  },
  before(obj, target) {
    if (arguments.length == 1) {
      let desc = this._desc(obj),
        prev = desc && desc.prev

      return prev && prev.obj
    }
    this._move(this._getOrCreateDesc(obj), this._desc(target).prev)
    return this
  },
  after(obj, target) {
    if (arguments.length == 1) {
      let desc = this._desc(obj),
        next = desc && desc.next

      return next && next.obj
    }
    this._move(this._getOrCreateDesc(obj), this._desc(target))
    return this
  },
  contains(obj) {
    return !!this._desc(obj)
  },
  remove(obj) {
    let list = this._listObj(obj),
      desc

    if (list && (desc = list[this._id])) {
      this._unlink(desc)
      delete list[this._id]
      return true
    }
    return false
  },
  clean() {
    let desc = this._header
    while (desc) {
      delete this._listObj(desc.obj)[this._id]
      desc = desc.next
    }
    this._header = undefined
    this._tail = undefined
    this.length = 0
    return this
  },
  empty() {
    return this.length == 0
  },
  size() {
    return this.length
  },
  each(callback, scope) {
    let desc = this._header,
      ver = this._version

    while (desc) {
      if (desc.version < ver) {
        if (callback.call(scope || this, desc.obj, this) === false)
          return false
      }
      desc = desc.next
    }
    return true
  },
  map(callback, scope) {
    let rs = []
    this.each((obj) => {
      rs.push(callback.call(scope || this, obj, this))
    })
    return rs
  },
  filter(callback, scope) {
    let rs = []
    this.each((obj) => {
      if (callback.call(scope || this, obj, this))
        rs.push(obj)
    })
    return rs
  },
  toArray() {
    let rs = []
    this.each((obj) => {
      rs.push(obj)
    })
    return rs
  }
})
export default LinkedList
