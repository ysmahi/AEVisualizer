import Vue from 'vue'
import Vuex from 'vuex'
import { mapData as mapRoadmap, drawChart as drawRoadmap } from './charts/roadMap'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    existingCharts: [{
      title: 'Roadmap',
      nameFile: 'roadMap.js',
      mapData: mapRoadmap,
      drawChart: drawRoadmap
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
