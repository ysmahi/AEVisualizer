<template>
  <div id="app">
      <AppBarWithTabs
          :nameAppBar="nameAppBar"
          :dataTabs="dataTabs">
      </AppBarWithTabs>

      <div class="pageContent">
      </div>
  </div>
</template>

<script>
    import AevRaw from './views/AevRaw'
    import AevLive from './views/AevLive'
    import DataReformatView from './views/DataReformaterView'
    import AppBarWithTabs from './components/GenericComponents/AppBarWithTabs'

  export default {
    name: 'app',
    components: {AppBarWithTabs},
    data () {
      return {
        nameAppBar: 'AEVisualizer',
        dataTabs: [
          {name: 'AEV Raw',
            component: AevRaw},
          {name: 'AEV Live',
          component: AevLive},
          {name: 'Data Reformater',
          component: DataReformatView}
        ]
      }
    }
  }
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
