<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        {{receivedData}}
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import vm from '../vm/index'
export default {
  name: 'HelloWorld',

  data: () => ({
    receivedData: "nothing"
  }),
  async mounted() {
    await vm.init()
    await vm.login()
    console.log('testu', Object.keys(vm))
    
    //console.log(Object.keys(vm))
  }
}
</script>
