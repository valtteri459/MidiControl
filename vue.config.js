module.exports = {
  "transpileDependencies": [
    "vuetify"
  ],
  pages: {
    index: {
      entry: 'src/main.js',
      // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
      title: 'Midi Macro Manager',
    },
  },
  pluginOptions: {
    electronBuilder: {
      // List native deps here if they don't work
      externals: ['ffi-napi', 'ref-napi', 'ref-array-napi'],
      // If you are using Yarn Workspaces, you may have multiple node_modules folders
      // List them all here so that VCP Electron Builder can find them
      nodeModulesPath: ['./node_modules'],
      nodeIntegration: true
    }
  }
}