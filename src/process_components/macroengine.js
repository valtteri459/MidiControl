console.log('macroengine imported')
import compiler from './compiler'
import {ipcMain, app} from 'electron'
import ds from './datastore'
import e from './events'
import midi from './midi'
import vm from './voicemeeter'
import appConfig from 'electron-settings'

let testsource
let utils = {
  map: (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2
}
if(appConfig.hasSync('source')) {
  testsource = appConfig.getSync('source')
} else {
  testsource = JSON.stringify([{
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
}

export default {
  elisteners: [],
  dslisteners: [],
  currentConfig: {},
  source: testsource,
  win: null,
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
    ipcMain.handle('getConfig', async (event, ...args) => {
      return this.source
    })
    ipcMain.handle('setConfig', async (event, ...args) => {
      appConfig.setSync('source', args[0])
      this.source = args[0]
      this.load_config()
      return true
    })
    ipcMain.handle('reloadMacros', async (event, ...args) => {
      return this.load_config()
    })
    ds.addListener((path, key, value) => {
      this.datastore_trigger(path, key, value)
    })
    e.addListener((data) => {
      this.event_trigger(data)
    })
    this.load_config()
  },
  log(...msg) {
    console.log(...msg)
    if(this.win) {
      try {
        this.win.webContents.send('log', {type: 'scriptlog', msg: msg})
      }catch(e) {
        this.win.webContents.send('log', {type: 'scriptlog', msg: 'log error' + e})
      }
    }
  },
  registerWindow(win){
    this.win = win
    /*Application window opened*/
  },
  compile(src) {
    try {
      return compiler(src)
    } catch(e) {
      this.log({type: 'compileError', msg: e})
      return []
    }
  },
  load_config() {
    this.currentConfig = JSON.parse(this.source)
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
        elem.initial({ midi, vm, ds, state: ds.state, log: this.log, win: this.win, utils})
      }
    })
  },
  event_trigger(event) {
    //console.log('event trigger tripped', event.path, event.value)
    let evtString = event.path.reduce((pv, cv) => pv+'.'+cv)
    this.currentConfig.forEach(elem => {
      elem.event_trigger.forEach(ele => {
        if(ele.triggers.some(trigger => evtString.startsWith(trigger))) {
          ele.code({ event, midi, vm, ds, state: ds.state, log: this.log, win: this.win, utils })
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
          ele.code({ event, midi, vm, ds, state: ds.state, log: this.log, win: this.win, utils })
        }
      })
    })
  }
}