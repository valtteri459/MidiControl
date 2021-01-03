var validator = {
  get(target, key) {
    //console.log('getter of', target, key)
    /**if (typeof target[key] === 'object' && target[key] !== null) {
      return new Proxy(target[key], validator)
    } else {
      return target[key];
    }*/
    return target[key]
  },
  set (target, key, value) {
    console.log('value of', target._path, 'in index', key, 'has changed to', value)
    let iValue = JSON.parse(JSON.stringify(value))
    if (typeof iValue === 'object' && iValue !== null) {
      if(Array.isArray(iValue)) {
        iValue._isArray = true
      }
      let tpath = target._path || []
      iValue._path = [...tpath, key]
      iValue = new Proxy(iValue, validator)
    }
    target[key] = iValue
    return true
  }
}


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
proxy.inner.skillset[2] = 'REDACTED'
let Datastore = {
  state: {},
  listeners: [],
  addListener(){},
  removeListener(index){}
}
//export default Datastore