<template>
    <input type="file" style="display: none" ref="fileInputRoadmap"
           v-on:change="getDataFromFileAndDisplayChart"/>
    <button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect"
            v-on:click="action">
        Roadmap
    </button>
</template>

<script>
  export default {
    name: 'simpleButton',
    props: {
    }
  }
</script>

<style scoped>

</style>