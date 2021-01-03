console.log('macroengine imported')
import ds from './datastore'
import e from './events'
import midi from './midi'


ds.init()
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
    ds.addListener((data) => {
      this.datastore_trigger(data)
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
  datastore_trigger(dsevent) {

  }
}