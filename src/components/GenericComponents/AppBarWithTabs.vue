<template>
    <div class="mdl-layout mdl-js-layout mdl-layout--fixed-header
            mdl-layout--fixed-tabs">
        <header class="mdl-layout__header">
            <div class="mdl-layout__header-row">
                <!-- Title -->
                <span class="mdl-layout-title">{{nameAppBar}}</span>
            </div>
            <!-- Tabs -->
            <div class="mdl-layout__tab-bar mdl-js-ripple-effect">
                <a v-for="(item, index) in dataTabs"
                   :href="'#tab-' + index"
                   :class="index === 0 ? 'mdl-layout__tab is-active' : 'mdl-layout__tab'"
                   :key="index">{{item.name}}</a>
            </div>
        </header>
        <main class="mdl-layout__content">
            <section v-for="(item, index) in dataTabs"
                     :class="index === 0 ? 'mdl-layout__tab-panel is-active ' : 'mdl-layout__tab-panel'"
                     :id="'tab-' + index"
                     :key="index">
                <div class="page-content">
                    <component v-bind:is="item.component"/>
                </div>
            </section>
        </main>
    </div>
</template>

<script>
  export default {
    name: 'AppBarWithTabs',
    props: {
      nameAppBar: String,
      dataTabs: Array
    }
  }
</script>

<style scoped>
</style>