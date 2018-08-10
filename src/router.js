import Vue from 'vue'
import Router from 'vue-router'
import AevLive from './views/AevLive'
import AevRaw from './views/AevRaw'
import DataReformaterView from './views/DataReformaterView'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/aevlive',
      name: 'aevLive',
      component: AevLive
    },
    {
      path: '/aevRaw',
      name: 'aevRaw',
      component: AevRaw
    },
    {
      path: '/dataReformater',
      name: 'dataReformater',
      component: DataReformaterView
    }
  ]
})
