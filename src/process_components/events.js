export default {
  eventSources: {},
  eventListeners: [],
  registerEventSource(name) {
    eventSources[name] = (data) => {
      this.eventListeners.map(e => e.source === name).forEach(retobj => {
        retobj.listener(data)
      })
    }
    return eventSources[name]
  },
  registerListener(name, returnfunc) {
    this.eventListeners.push({
      source: name,
      listener: returnfunc
    })
  },
  unregisterListener(ind) {
    this.eventListeners.splice(ind, 1);
  }
}