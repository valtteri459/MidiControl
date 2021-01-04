import e from './events'
import vm from '../vm/index'
let eventSender = e.registerEventSource('vm')

export default {
  ready: false,
  vm: vm,
  async init() {
    await vm.init()
    await vm.login()
    await vm.updateDeviceList()
    console.log(await vm.getStripGain(0), await vm.setStripA1(0, true), vm.stripGetters, vm.busGetters)
  }
}