console.log('voicemeeter initialized')
import e from './events'
import vm from '../vm/index'
import store from './datastore'
let eventSender = e.registerEventSource('vm')
store.touch(['vm'])
let state = store.state

export default {
  ready: false,
  vm: vm,
  touch(obj, host) {
    if(!host[obj]) {
      host[obj] = {}
    }
    return host[obj]
  },
  _readings: {
    strip: {},
    bus: {}
  },
  async init() {
    await vm.init()
    await vm.login()
    await vm.updateDeviceList()
    store.addListener((path, key, value) => {
      // only care about voicemeeter state updates
      //console.log('dsevent in general', path, key, value)
      if (path[0] === 'vm' && path.length >= 3) {
        if (this._readings[path[1]][path[2]][key] != value) {
          console.log('contradicting value, committing', path, key, value, this._readings[path[1]][path[2]][key])
          switch (path[1]) {
            case 'strip':
              vm.stripSetters[key](path[2], value)
              break;
            case 'bus':
              vm.stripSetters[key](path[2], value)
              break;
            default: 
              console.log('FEATURE ' + path[1] + ' NOT IMPLEMENTED')
              break;
          }
        }       
      }
    })
    setInterval(async() => {
      if(await vm.isParametersDirty()) {
        await this.refreshStore()
        this.ready = true
      }
    }, 100)
    /**vm.stripGetters, vm.busGetters */
  },
  async refreshStore() {
    let promises = []
    vm.voicemeeterConfig.strips.forEach(strip => {
      store.touch(['vm', 'strip', strip.id])
      promises.push(Object.keys(vm.stripGetters).map(key => (async () => {
        let reading = await vm.stripGetters[key](strip.id)
        this.touch(strip.id, this._readings.strip)[key] = reading
        state.vm.strip[strip.id][key] = reading
      })()))
    })
    vm.voicemeeterConfig.buses.forEach(bus => {
      store.touch(['vm', 'bus', bus.id])
      promises.push(Object.keys(vm.busGetters).map(key => (async () => {
        let reading = await vm.busGetters[key](bus.id)
        this.touch(bus.id, this._readings.bus)[key] = reading
        state.vm.bus[bus.id][key] = reading
      })()))
    })
    return await Promise.all(promises)
  }
}