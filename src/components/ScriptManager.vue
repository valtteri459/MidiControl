<template>
  <v-container>
    <v-row wrap>
      <v-col cols="12">
        <v-expansion-panels>
          <v-expansion-panel
            v-for="(item,i) in script"
            :key="i"
          >
            <v-expansion-panel-header>
              {{item.name}}
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-row wrap>
                <v-col cols="12">
                  environment variables: { midi, vm, ds, state, log, win , utils}
                  additional { event } in event and datastore triggers
                </v-col>
                <v-col cols="12">
                  <h2>Bundle name</h2>
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
                      <v-col cols="6"><v-spacer></v-spacer><v-btn @click="item.event_trigger.splice(iEv, 1)">del</v-btn></v-col>
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
                      <v-col cols="6"><v-spacer></v-spacer><v-btn @click="item.event_trigger.splice(iEv, 1)">del</v-btn></v-col>
                    </v-card-title>
                    <v-card-text>
                      <div>
                        <prism-editor class="my-editor" v-model="itemEv.code" :highlight="highlighter" line-numbers></prism-editor>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { PrismEditor } from 'vue-prism-editor';
import 'vue-prism-editor/dist/prismeditor.min.css'; // import the styles somewhere

// import highlighting library (you can use any library you want just return html string)
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css'; // import syntax highlighting styles


export default {
  components: {
    PrismEditor,
  },
  name: 'ScriptManager',
  props: ['script'],
  data: () => ({

  }),
  methods: {
    highlighter(code) {
      return highlight(code, languages.js); //returns html
    },
  },
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
