console.log('macroengine imported')
import ds from './datastore'
import e from './events'
import midi from './midi'
import vm from './voicemeeter'

vm.init()

export default {
  elisteners: [],
  dslisteners: [],
  currentConfig: {},
  num: 0,
  init() {
    /*console.log(ds.state)
    ds.touch(['testing', 'path', 'traversing'])
    console.log(ds.state)
    */
   /*setInterval(() => {
     if (ds.exists('vm', 'strip', '1', 'mute'))
     ds.state.vm.strip[1].mute = !ds.state.vm.strip[1].mute
   }, 1000)*/
    ds.addListener((path, key, value) => {
      this.datastore_trigger(path, key, value)
    })
    e.addListener((data) => {
      this.event_trigger(data)
    })
  },
  resetBinds() {

  },
  load_config() {
    
  },
  save_config(config) {

  },
  initials() {

  },
  event_trigger(event) {
    //console.log('event trigger tripped', event)
  },
  datastore_trigger(path, key, value) {
    //console.log('dsevent triggered', path, key, value)
    if ([...path, key].equals('vm.strip.1.mute'.split('.'))) {
      midi.send(2, 144, 1, value ? 3 : 1)
    }
  }
}