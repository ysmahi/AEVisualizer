<template>
    <div>
        <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
            <select class="mdl-textfield__input" id="typeImage" name="typeImage"
            v-on:change="optionClicked($event)">
                <option></option>
                <option v-for="(mode, index) in modes" :value="index">
                    {{mode.label}}
                </option>
            </select>
            <label class="mdl-textfield__label" for="typeImage" v-if="!typeImageSelected">{{selectedMode.label}}</label>
        </div>
        <form action="#">
            <div class="mdl-textfield mdl-js-textfield">
                <input class="mdl-textfield__input" type="text" id="fileNameInput"
                       v-model="fileName"
                       placeholder="Nom du fichier">
                <label class="mdl-textfield__label" for="fileNameInput">{{fileName}}</label>
            </div>
        </form>
        <button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect"
        v-on:click="selectedMode.download()"
        :disabled="!typeImageSelected">
            Télécharger
        </button>
    </div>
</template>

<script>
  export default {
    name: 'pictureDownloader',
    data () {
      return {
        selectedMode: {
          label: 'Format'
        },
        typeImageSelected: false,
        source: "#chart > svg",
        fileName: '',
        modes: [
          { label : 'Vector graphics (svg)', download : this.downloadSvg },
          { label : 'Image (png)', download : this.downloadPng }
        ]
      }
    },
    methods: {
      changeSelectedMode (selectedModeIndex) {
        this.selectedMode = this.modes[selectedModeIndex]
      },
      optionClicked (event) {
        this.typeImageSelected = true
        let indexMode = event.target.value
        this.selectedMode = this.modes[indexMode]
      },
      downloadSvg: function () {
        let BB = getBlob();

        let html = d3.select(this.source)
          .attr("version", 1.1)
          .attr("xmlns", "http://www.w3.org/2000/svg")
          .node().parentNode.innerHTML;

        //html = he.encode(html);

        let isSafari = (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1);

        if (isSafari) {
          let img = "data:image/svg+xml;utf8," + html;
          let newWindow = window.open(img, 'download');
        } else {
          let blob = new BB([html], { type: "data:image/svg+xml" });
          saveAs(blob, (this.fileName) + ".svg")
        }
      },
    triggerDownloadPng: function (imgURI) {
      let evt = new MouseEvent('click', {
        view: window,
        bubbles: false,
        cancelable: true
      });

      let a = document.createElement('a');
      a.setAttribute('download', this.fileName + '.png');
      a.setAttribute('href', imgURI);
      a.setAttribute('target', '_blank');

      a.dispatchEvent(evt);
    },
      downloadPng: function () {
        console.log('at begi', this.fileName)
        let content = d3.select("body").append("canvas")
          .attr("id", "canvas")
          .style("display", "none")

        let svg = document.querySelector('.gridGraph')

        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');
        let data = (new XMLSerializer()).serializeToString(svg);
        let DOMURL = window.URL || window.webkitURL || window;

        let img = new Image();
        let svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
        let url = DOMURL.createObjectURL(svgBlob);

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          DOMURL.revokeObjectURL(url);

          let imgURI = canvas
            .toDataURL('image/png')
            .replace('image/png', 'image/octet-stream');

          this.triggerDownloadPng(imgURI);
        };

        img.src = url;
        d3.select("#canvas").remove();
      }
    }
  }

  let getBlob = function() {
    return window.Blob || window.WebKitBlob || window.MozBlob;
  }

</script>

<style scoped>

</style>