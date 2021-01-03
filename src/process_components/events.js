console.log('event forwarder imported')
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
  addListener(name, returnfunc) {
    this.eventListeners.push({
      source: name,
      listener: returnfunc
    })
  },
  removeListener(ind) {
    if(Array.isArray(ind)) {
      ind.forEach(i => {
        this.eventListeners.splice(i, 1);
      })
    } else {
      this.eventListeners.splice(ind, 1);
    }
    
  }
}