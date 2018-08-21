import Vue from 'vue'
import Vuex from 'vuex'
import { mapData as mapRoadmap, drawChart as drawRoadmap } from './charts/roadMap'
import { mapData as mapCouvertureDomaines, drawChart as drawCouvertureDomaines } from './charts/couvertureDomaines'

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
      nameFile: 'couvertureDomaines.js',
      mapData: mapCouvertureDomaines,
      drawChart: drawCouvertureDomaines
    }]
  },
  mutations: {

  },
  actions: {

  }
})
