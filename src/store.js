import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    availableCharts: [{
      title: 'Roadmap',
      nameFile: 'roadMap.js'
    },
    {
      title: 'Couverture de domaines',
      nameFile: 'etatSI.js'
    }]
  },
  mutations: {

  },
  actions: {

  }
})
