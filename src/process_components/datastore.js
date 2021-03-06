console.log('datastore imported')
let Datastore = {
  validator: null,
  state: null,
  _touch(target, path) {
    if(typeof target[path] == 'undefined')
    target[path] = {}
    return target[path]
  },
  touch(path) {
    let rootref = this.state
    path.forEach(elem => {
      if(typeof rootref[elem] == 'undefined') {
        rootref[elem] = {}
      }
      rootref = rootref[elem]
    })
  },
  exists(...args) {
    if(!this.state) return false
    return typeof args.reduce((obj, level) => obj && obj[level], this.state) !== 'undefined'
  },
  init() {
    let _this = this
    this.validator = {
      get(target, key) {
        //console.log('getter of', target, key)
        /**if (typeof target[key] === 'object' && target[key] !== null) {
          return new Proxy(target[key], validator)
        } else {
          return target[key];
        }*/
        //_this._touch(target, key)
        return target[key]
      },
      set (target, key, value) {
        //console.log('value of', target._path, 'in index', key, 'has changed to', value)
        let iValue = JSON.parse(JSON.stringify(value))
        if (typeof iValue === 'object' && iValue !== null) {
          if(Array.isArray(iValue)) {
            iValue._isArray = true
          }
          let tpath = target._path || []
          iValue._path = [...tpath, key]
          iValue = new Proxy(iValue, _this.validator)
        }
        if(iValue != target[key]) {
          target[key] = iValue
          _this.listeners.forEach(callback => {
            callback(target._path, key, iValue)
          })
        }
        return true
      }
    }
    this.state = new Proxy({_path:[]}, this.validator)
    console.log('datastore initialized')
  },
  listeners: [],
  addListener(returnfunc){
    this.listeners.push(returnfunc)
  },
  removeListener(index){
    if(Array.isArray(index)) {
      index.forEach(i => {
        this.listeners.splice(i, 1)
      })
    } else {
      this.listeners.splice(index, 1)
    }
  }
}
Datastore.init()
/*
var person = {
  firstName: "alfred",
  lastName: "john",
  inner: {
    salary: 8250,
    Proffesion: ".NET Developer"
  }
}
var proxy = new Proxy({_path: []}, validator)
proxy.firstName = person.firstName
proxy.lastName = person.lastName
proxy.inner = person.inner
proxy.inner.salary = 'foo'
proxy.inner.skillset = ['Cooking', 'Cleaning', 'Programming']
console.log('proxy contents', proxy)
proxy.inner.skillset.forEach(elem => {
  console.log('element listin', elem)
})
proxy.inner.skillset.push('Testing')
proxy.inner.skillset.splice(1, 1)
proxy.inner.skillset[2] = 'REDACTED'/**/
export default Datastore