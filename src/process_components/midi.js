import midi from 'midi'
import { ipcMain } from 'electron'

export default {
  time: 0,
  win: null,
  midiInput: new midi.input(),
  inputs: [],
  midiOutput: new midi.output(),
  outputs: [],
  send(device, command, note, value) {
    this.outputs[device].sendMessage(command, note, value)
  },
  register() {
    console.log('MIDI registered')
    for(let i = 0;i<this.midiInput.getPortCount();i++) {
      this.inputs.push(new midi.input())
      this.inputs[i].openPort(i)
    }
    for(let i = 0;i<this.midiOutput.getPortCount();i++) {
      this.outputs.push(new midi.output())
      this.outputs[i].openPort(i)
    }
    ipcMain.handle('getInputDeviceCount', async (event, ...args) => {
      return this.midiInput.getPortCount()
    })
    ipcMain.handle('getOutputDeviceCount', async (event, ...args) => {
      return this.midiOutput.getPortCount()
    })
    ipcMain.handle('getInputDeviceList', async (event, ...args) => {
      let output = []
      for(let i = 0;i<this.midiInput.getPortCount();i++) {
        output.push({id: i, name: this.midiInput.getPortName(i)})
      }
      return output
    })
    ipcMain.handle('getOutputDeviceList', async (event, ...args) => {
      let output = []
      for(let i = 0;i<this.midiOutput.getPortCount();i++) {
        output.push({id: i, name: this.midiOutput.getPortName(i)})
      }
      return output
    })
    this.inputs.map((input, i) => { 
      input.on('message', (deltaTime, message) => {
        if(this.win) {
          this.win.webContents.send('log', {deltaTime, device: i, message})
        }
      })
    })
  },
  registerWindow(win){
    console.log('Window object registered for MIDI')
    this.win = win
    /*Application window opened*/
  }
}