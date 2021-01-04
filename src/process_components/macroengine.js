console.log('macroengine imported')
import compiler from './compiler'
import ds from './datastore'
import e from './events'
import midi from './midi'
import vm from './voicemeeter'

let source = JSON.stringify([{
  name: 'firstscript',
  initial: 'log("initial test")',
  event_trigger:[
    {
      triggers: ['midi.1.1.144'],
      code: 'log("event triggered BTNDOWN on", event.path);state.vm.strip[1].mute = !state.vm.strip[1].mute'
    },
    {
      triggers: ['midi.1.0.128', 'midi.1.1.128'],
      code: 'log("event triggered BTNUP on", event.path)'
    }
  ],
  state_trigger:[
    {
      triggers: ['vm.strip.1.mute'],
      code: 'log("vm strip from event triggered MUTETOGGLE");midi.send(2, 144, 1, event.value ? 3 : 1)'
    }
  ]
}])
export default {
  elisteners: [],
  dslisteners: [],
  currentConfig: {},
  num: 0,
  async init() {
    await vm.init()
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
    this.load_config()
  },
  resetBinds() {

  },
  compile(src) {
    return compiler(src)
  },
  load_config() {
    this.currentConfig = JSON.parse(source)
    this.currentConfig.forEach(elem => {
      elem.initial = elem.initial ? this.compile(elem.initial) : false
      elem.event_trigger.forEach(e => {
        e.code = this.compile(e.code)
      })
      elem.state_trigger.forEach(e => {
        e.code = this.compile(e.code)
      })
      //elem.initial({test: 'test string passed via environment', log: console.log})
    });
    this.initials();
  },
  initials() {
    this.currentConfig.forEach(elem => {
      if(elem.initial) {
        elem.initial({midi, vm, ds, state: ds.state, log: console.log})
      }
    })
  },
  event_trigger(event) {
    //console.log('event trigger tripped', event.path, event.value)
    let evtString = event.path.reduce((pv, cv) => pv+'.'+cv)
    this.currentConfig.forEach(elem => {
      elem.event_trigger.forEach(ele => {
        if(ele.triggers.some(trigger => evtString.startsWith(trigger))) {
          ele.code({event, midi, vm, ds, state: ds.state, log: console.log})
        }
      })
    })
  },
  datastore_trigger(path, key, value) {
    //console.log('dsevent triggered', path, key, value)
    /*if ([...path, key].equals('vm.strip.1.mute'.split('.'))) {
      midi.send(2, 144, 1, value ? 3 : 1)
    }*/
    let evtString = [...path, key].reduce((pv, cv) => pv+'.'+cv)
    let event = {path: [...path, key], value: value}
    this.currentConfig.forEach(elem => {
      elem.state_trigger.forEach(ele => {
        if(ele.triggers.some(trigger => evtString.startsWith(trigger))) {
          ele.code({event, midi, vm, ds, state: ds.state, log: console.log})
        }
      })
    })
  }
}