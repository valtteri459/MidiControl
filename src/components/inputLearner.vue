<template>
  <v-dialog
    v-model="dialog"
    width="500"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        dark
        v-bind="attrs"
        v-on="on"
      >
        {{itext || 'learn'}}
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="headline primary">
        Learning midi input...
      </v-card-title>

      <v-card-text>
        send midi now or close to cancel
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          text
          @click="dialog = false"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { ipcRenderer } from 'electron'
export default {
  name: 'InputLearner',
  props: ['itext'],
  data: () => ({
    dialog: false,
    messagedata: null
  }),
  async mounted() {
    ipcRenderer.on('log', async (event, args) => {
      if(args.type === 'midi') {
        delete args.deltaTime
        this.messagedata = args
        await this.sendBack()
      }
    })
    //console.log(Object.keys(vm))
  },
  methods: {
    async sendBack() {
      if(this.dialog) {
        this.$emit('in', {
          device: this.messagedata.device,
          note: this.messagedata.message[1],
          action: this.messagedata.message[0]
        })
        this.dialog = false
      }
    }
  }
};
</script>
