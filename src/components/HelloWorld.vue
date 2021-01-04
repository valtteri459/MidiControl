<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-btn @click="getDeviceInfo" color="primary">refresh</v-btn>
        input device count: {{idevcount}}<br/>
        input device list: {{idevlist}}<br/>
        output device count: {{odevcount}}<br/>
        output device list: {{odevlist}}<br/>
        <ul>
          <li v-for="data in receivedData" :key="data.id">{{data}}</li>
        </ul>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import {ipcRenderer} from 'electron'
export default {
  name: 'HelloWorld',

  data: () => ({
    idevcount: 'unknown',
    idevlist: [],
    odevcount: 'unknown',
    odevlist: [],
    receivedData: [],
    msgReceived: 0
  }),
  async mounted() {
    this.getDeviceInfo()
    ipcRenderer.on('log', (event, args) => {
      this.receivedData.unshift({id: this.msgReceived++, ...args})
      this.receivedData = this.receivedData.splice(0, 20)
    })
    //console.log(Object.keys(vm))
  },
  methods: {
    async getDeviceInfo () {
      this.idevcount = await ipcRenderer.invoke('getInputDeviceCount')
      this.idevlist = await ipcRenderer.invoke('getInputDeviceList')
      this.odevcount = await ipcRenderer.invoke('getOutputDeviceCount')
      this.odevlist = await ipcRenderer.invoke('getOutputDeviceList')
    }
  }
}
</script>
