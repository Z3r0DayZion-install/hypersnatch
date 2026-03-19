class PluginSandbox {

  constructor(eventBus) {
    this.eventBus = eventBus
  }

  run(plugin,context) {
    try {
      plugin.execute(context,this.eventBus)
    } catch(e) {
      console.error("Plugin error:",e)
    }
  }

}

module.exports = PluginSandbox
