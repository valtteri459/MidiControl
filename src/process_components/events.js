console.log('event forwarder imported')
export default {
  eventSources: {},
  eventListeners: [],
  registerEventSource(name) {
    this.eventSources[name] = (data) => {
      this.eventListeners.filter(e => e.source === name || e.source === "all").forEach(retobj => {
        retobj.listener(data)
      })
    }
    return this.eventSources[name]
  },
  addListener(returnfunc, name = 'all') {
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