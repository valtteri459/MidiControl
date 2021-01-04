<template>
  <v-app>
    <v-overlay :value="loading">
      <v-progress-circular
        indeterminate
        size="64"
      ></v-progress-circular>
    </v-overlay>
    <v-navigation-drawer
      v-model="drawer"
      app
      right
    >
      <v-row>
        <v-col xs12>
          <v-btn @click="getDeviceInfo" color="primary">refresh</v-btn><br/>
          input device count: {{idevcount}}<br/>
          input device list:
          <ul>
            <li v-for="item in idevlist" :key="item.id">{{item.id}} {{item.name}}</li>
          </ul><hr/>
          output device count: {{odevcount}}<br/>
          output device list: 
          <ul>
            <li v-for="item in odevlist" :key="item.id">{{item.id}} {{item.name}}</li>
          </ul>
          <hr/>
          <v-btn @click="selectedtype = 'midi'">midi log</v-btn><v-btn @click="selectedtype = 'scriptlog'">scriptlog</v-btn>
          <hr/>
          <ul>
            <li v-for="data in receivedData.filter(e => e.type == selectedtype)" :key="data.id">{{formatter(data)}}</li>
          </ul>
        </v-col>
      </v-row>
    </v-navigation-drawer>
    <v-app-bar
      app
      color="primary"
      dark
    >
      <v-toolbar-title>MidiControl</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn text @click="saveScript">
        <span class="mr-2">Save config</span>
      </v-btn>
      <v-btn text @click="getScript">
        <span class="mr-2">Fetch config</span>
      </v-btn>
      <v-btn text @click="reload">
        <span class="mr-2">Reload engine</span>
      </v-btn>
      <v-btn text @click="drawer = !drawer">
        <span class="mr-2">{{drawer ? 'Hide' : 'Show'}} info</span>
      </v-btn>
    </v-app-bar>
    <v-main>
      <ScriptManager :script="script"/>
    </v-main>
  </v-app>
</template>

<script>
import ScriptManager from './components/ScriptManager';
import { ipcRenderer } from 'electron'

export default {
  name: 'App',

  components: {
    ScriptManager,
  },

  data: () => ({
    selectedtype: 'midi',
    idevcount: 'unknown',
    idevlist: [],
    odevcount: 'unknown',
    odevlist: [],
    receivedData: [],
    outlog: [],
    outid: 0,
    msgReceived: 0,
    script: {},
    loading: true,
    drawer: false
  }),
  async mounted() {
    this.getScript()
    this.getDeviceInfo()
    ipcRenderer.on('log', (event, args) => {
      if(args.type === 'midi') {
        delete args.deltaTime
        if(this.receivedData[0] && args.type == this.receivedData[0].type && args.message[1] == this.receivedData[0].message[1]) {
          this.receivedData[0] = {id: this.receivedData[0].id, ...args}
        } else {
          this.receivedData.unshift({id: this.msgReceived++, ...args})
        }
      } else {
        this.receivedData.unshift({id: this.msgReceived++, ...args})
      }
      
      this.receivedData = this.receivedData.splice(0, 20)
    })
    //console.log(Object.keys(vm))
  },
  methods: {
    formatter(data) {
      if(data.type == 'midi') {
        return `device ${data.device}: act[${data.message[0]}] note[${data.message[1]}] value[${data.message[2]}]`
      } else if(data.type == 'scriptlog') {
        return data.msg
      } else {
        return data
      }
    },
    async getScript() {
      this.loading = true
      this.script = JSON.parse(await ipcRenderer.invoke('getConfig'))
      this.loading = false
    },
    async reload() {
      await ipcRenderer.invoke('reloadMacros')
    },
    async saveScript() {
      this.loading = true
      await ipcRenderer.invoke('setConfig', JSON.stringify(this.script))
      this.loading = false
    },
    async getDeviceInfo () {
      this.idevcount = await ipcRenderer.invoke('getInputDeviceCount')
      this.idevlist = await ipcRenderer.invoke('getInputDeviceList')
      this.odevcount = await ipcRenderer.invoke('getOutputDeviceCount')
      this.odevlist = await ipcRenderer.invoke('getOutputDeviceList')
    }
  }
};
</script>
