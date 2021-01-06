<template>
  <v-container fluid>
    <v-row wrap>
      <v-col cols="3">
        <v-list>
          <v-list-item-group v-model="selectedScript" color="primary">
            <v-list-item
              v-for="(item,i) in script"
              :key="i"
            >
              <v-list-item-content>
                {{item.name}}
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
          <v-list-item @click="script.push({name: 'new script', initial: '', event_trigger: [], state_trigger: []})">
            <v-list-item-content>
              add new
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-col>
      <v-col cols="9">
        <v-row wrap v-if="selectedScript !== null && item">
          <v-col cols="12">
            environment variables: { midi, vm, ds, state, log, win , utils}
            additional { event } in event and datastore triggers
          </v-col>
          <v-col cols="12">
            <h2>Bundle name <v-btn text @click="script.splice(selectedScript, 1)">delete</v-btn></h2>
            <v-text-field dense outlined v-model="item.name"/>
            <h2>Initial script</h2>
            <div>
              <prism-editor class="my-editor" v-model="item.initial" :highlight="highlighter" line-numbers></prism-editor>
            </div>
          </v-col>
          <v-col cols="12">
            <h2>Event inputs <v-btn @click="item.event_trigger.push({triggers:[], code: ''})">Add</v-btn></h2>
            <v-card v-for="(itemEv, iEv) in item.event_trigger" :key="iEv" style="margin-bottom:15px">
              <v-card-title>
                <v-col cols="6"><v-combobox
                  v-model="itemEv.triggers"
                  label="Triggers"
                  multiple
                  outlined
                  dense
                ></v-combobox></v-col>
                <v-col cols="6"><v-spacer></v-spacer><learner @in="e => addtrigger(e, itemEv.triggers)"></learner><v-btn @click="item.event_trigger.splice(iEv, 1)" style="float: right">del</v-btn></v-col>
              </v-card-title>
              <v-card-text>
                <div>
                  <prism-editor class="my-editor" v-model="itemEv.code" :highlight="highlighter" line-numbers></prism-editor>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12">
            <h2>data change inputs <v-btn @click="item.state_trigger.push({triggers:[], code: ''})">Add</v-btn></h2>
            <v-card v-for="(itemEv, iEv) in item.state_trigger" :key="iEv" style="margin-bottom:15px">
              <v-card-title>
                <v-col cols="6"><v-combobox
                  v-model="itemEv.triggers"
                  label="Triggers"
                  multiple
                  outlined
                  dense
                ></v-combobox></v-col>
                <v-col cols="6"><v-spacer></v-spacer><learner itext="midi send" @in="e => lightscript(e, itemEv)"></learner><v-btn @click="item.state_trigger.splice(iEv, 1)" style="float: right">del</v-btn></v-col>
              </v-card-title>
              <v-card-text>
                <div>
                  <prism-editor class="my-editor" v-model="itemEv.code" :highlight="highlighter" line-numbers></prism-editor>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-snackbar
      v-model="snackbar"
      :timeout="2000"
    >
      Item copied to clipboard

      <template v-slot:action="{ attrs }">
        <v-btn
          color="blue"
          text
          v-bind="attrs"
          @click="snackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { PrismEditor } from 'vue-prism-editor';
import { clipboard } from 'electron'
import learner from './inputLearner'
import 'vue-prism-editor/dist/prismeditor.min.css'; // import the styles somewhere

// import highlighting library (you can use any library you want just return html string)
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css'; // import syntax highlighting styles


export default {
  components: {
    PrismEditor,
    learner
  },
  name: 'ScriptManager',
  props: ['script', "idevcount", "idevlist", "odevcount", "odevlist"],
  data: () => ({
    selectedScript: null,
    snackbar: false
  }),
  methods: {
    highlighter(code) {
      return highlight(code, languages.js); //returns html
    },
    addtrigger(e, triggerlist) {
      triggerlist.push(`midi.${e.device}.${e.note}.${e.action}`)
    },
    lightscript(e, obj) {
      let newdev = 0
      let newOut = this.odevlist.filter(ne => ne.name.startsWith(this.idevlist[e.device].name.slice(0, -2)))
      newdev = newOut[0] ? newOut[0].id : 0
      if (obj.code !== '') {
        clipboard.writeText(`midi.send(${newdev}, 144, ${e.note}, event.value ? 3 : 1)`)
        this.snackbar = true
      } else {
        obj.code = `midi.send(${newdev}, 144, ${e.note}, event.value ? 3 : 1)`
      }
    }
  },
  computed: {
    item() {
      return this.script[this.selectedScript] || null
    }
  }
}
</script>

<style>
  /* required class */
  .my-editor {
    /* we dont use `language-` classes anymore so thats why we need to add background and text color manually */
    background: #2d2d2d;
    color: #ccc;
 
    /* you must provide font-family font-size line-height. Example: */
    font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
    font-size: 14px;
    line-height: 1.5;
    padding: 5px;
  }
 
  /* optional class for removing the outline */
  .prism-editor__textarea:focus {
    outline: none;
  }
</style> 
