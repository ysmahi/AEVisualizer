<template>
    <div id="aevLive">
    <div id='existingcharts'>
        <div v-for="chart in existingCharts">
            <input type="file" style="display: none" :ref="chart.title"
                   v-on:change="()=>getDataFromFileAndDisplayChart(chart)"/>
            <button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect"
                    v-on:click="()=>triggerLoadFile(chart.title)">
                {{chart.title}}
            </button>
        </div>
        <button class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect"
                v-on:click="reloadChart"
                v-if="aFileIsSelected">
            <i class="material-icons">refresh</i>
        </button>
    </div>
        <div id="chart">
        </div>
        <PictureDownloader v-if="aFileIsSelected">
        </PictureDownloader>
    </div>
</template>

<script>
    // import { mapData, drawChart } from '../charts/roadMap'
    import PictureDownloader from '../components/AevLive/PictureDownloader'

  export default {
    name: 'AevLive',
    components: {
      PictureDownloader
    },
    data () {
      return {
        selectedFile: '',
        existingCharts: this.$store.state.existingCharts,
        loading: false,
        worksheets: [],
        text: '',
        dataFile: [],
        mappedData: [],
        metadata: [],
        error: '',
        parsed: false,
        onReload: false,
        chartData: []
      }
    },
    computed: {
      aFileIsSelected: function () {
        return this.selectedFile !== ''
      }
    },
    methods: {
      reloadChart: function () {
        // Reload file that was already opened
        this.onReload = true
        d3.select('svg').remove();
        this.getDataFromFileAndDisplayChart()
      },
      getDataFromFileAndDisplayChart (chartData) {
        // Open file, read it, and display chart
        if (!this.onReload) {
          this.selectedFile = this.$refs[chartData.title][0].files[0]
          this.chartData = chartData
        }
        this.uploadFile(this.selectedFile)
          .then(status => {
            this.displayChart(this.chartData)
            this.onReload = false
          })
      },
      displayChart: function (chartData) {
        let mappedData = chartData.mapData(this.dataFile)
        this.mappedData = mappedData
        chartData.drawChart('#chart', mappedData)
      },
      triggerLoadFile(nameInputRef) {
        // Simulate a click on the input button
        this.$refs[nameInputRef][0].click()
      },
      uploadFile (file) {
        return new Promise (resolve => {
          if (file.size) {
            this.loading = true;
            // excel
            if (file.name.search(/\.xls|\.xlsx/) != -1 || file.type.search('sheet') != -1) {
              this.loadExcel(file)
                .then(worksheets => {
                  // $scope.fileName = file.name Definition of file in store
                  this.loading = false;
                  // multiple sheets
                  if (worksheets.length > 1) {
                    this.worksheets = worksheets;
                    // single > parse
                  } else {
                    this.parse(worksheets[0].text);
                  }
                  resolve ('File data was loaded')
                })
            }
          }
        })
      },
      loadExcel (file){
        let reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = function(e) {
            let worksheets = [];
            let data = e.target.result;
            let workbook = XLSX.read(data, {type: 'binary'});
            let sheet_name_list = workbook.SheetNames;
            sheet_name_list.forEach(function(y) { /* iterate through sheets */
              let worksheet = workbook.Sheets[y];
              worksheets.push({
                name: y,
                text : XLSX.utils.sheet_to_csv(worksheet)
                //	rows: worksheet['!range'].e.r
              })
            });
            resolve(worksheets)
          };
          reader.onerror = () => {
            reader.abort();
            reject(new DOMException("Problem parsing input file."));
          }
          reader.readAsBinaryString(file);
        })
      },
      parse (text) {
        this.text = text;
        this.dataFile = [];
        this.metadata = [];
        this.error = false;
        if (!text) return;
        try {
          this.dataFile = parse(text);
          this.metadata = getMetadata(text);
          this.error = false;
          this.parsed = true;
        } catch(e){
          this.data = [];
          this.metadata = [];
          this.error = e.name == "ParseError" ? +e.message : false;
        }
        this.loading = false;
      }
    }
  }

    // Code of parser out of raw.js
    let parse =(string) => {
      if (!string || string.length === 0) return [];
      var delimiter = detectDelimiter(string),
        rows = [[]],
        match, matches,
        data = [],
        re = new RegExp((
            "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
            "([^\"\\" + delimiter + "\\r\\n]*))"
          ),"gi"
        );
      while (matches = re.exec(string)){
        match = matches[2] ? matches[2].replace(new RegExp( "\"\"", "g" ), "\"" ) : matches[3];
        if (matches[1].length && matches[1] != delimiter ) rows.push([]);
        rows[rows.length - 1].push( match );
      }
      var headerIndex = 0;
      var header = rows[headerIndex];
      // Check if header is first line and if not try with following lines (until fifth line)
      while (emptyStrings(header) > 2 && headerIndex < 5) {
        headerIndex++;
        header = rows[headerIndex];
      }
      for (var i = headerIndex + 1; i < rows.length; i++) {
        if (rows[i].length == 1 && rows[i][0].length == 0 && rows[i].length != header.length) {
          continue;
        }
        if (rows[i].length == header.length) {
          var obj = {};
          for (var h in header) {
            obj[header[h]] = rows[i][h];
          }
          data.push(obj);
        } else {
          throw new ParseError(i);
          return false;
        }
      }
      return data;
    }
    // Function that returns the delimiter in a string
    let detectDelimiter = (string) => {
      if (!arguments.length) return;
      var delimiters = [",",";","\t",":","|"],
        delimitersCount = delimiters.map(function(d) { return 0; }),
        header = string.split("\n")[0],
        character,
        quoted = false,
        firstChar = true;
      for (var i in header) {
        character = header[i];
        switch(character) {
          case '"':
            if (quoted) {
              if (header[i+1] != '"') quoted = false;
              else i++;
            }
            else if (firstChar) quoted = true;
            break;
          default:
            if (quoted) break;
            var index = delimiters.indexOf(character);
            if (index !== -1) {
              delimitersCount[index]++;
              firstChar = true;
              continue;
            }
            break;
        }
        if (firstChar) firstChar = false;
      }
      var maxCount = d3.max(delimitersCount);
      return maxCount == 0 ? '\0' : delimiters[delimitersCount.indexOf(maxCount)];
    }
    // Returns number of empty strings in an array
    let emptyStrings = (array) => {
      var numberEmptyStrings = 0;
      for (var i = 0; i < array.length; i++) {
        if (array[i] === '') numberEmptyStrings++;
      }
      return numberEmptyStrings;
    }
    let ParseError = (message) => {
      this.name = "ParseError";
      this.message = message || "Sorry something went wrong while parsing your data.";
    }
    let getMetadata = (string) => {
      return d3.entries(sniff(parse(string))).map(function(d) {
        return { key : d.key, type : mode(d.value) }
      })
    }
    let sniff = (objs) => {
      var keys = {};
      d3.keys(objs[0]).forEach(function(d) { keys[d] = []; });
      objs.forEach(function(d) {
        for(var key in keys) {
          var type = typeOf(d[key]);
          if (type) keys[key].push(type);
        }
      })
      return keys;
    }
    let mode = (array) => {
      if(!arguments.length || array.length === 0) return null;
      var counter = {}, mode = array[0], max = 1;
      for(var i = 0; i < array.length; i++) {
        var el = array[i];
        if(counter[el] == null) counter[el] = 1;
        else counter[el]++;
        if(counter[el] > max) {
          mode = el;
          max = counter[el];
        }
      }
      return mode;
    }
    let typeOf = (value) => {
      if (value === null || value.length === 0) return null;
      if (isDate(value)) return Date.name;
      if (isNumber(value)) return Number.name;
      if (isString(value)) return String.name;
      return null;
    }
    let isString = (value) => {
      return typeof value == 'string';
    }
    let isNumber = (value) => {
      return !isNaN(value);
    }
    let timeFormat = '([\\sT]?(0?[0-9]|1[0-9]|2[0-4])\:(0?[1-9]|[012345][0-9])(\\:(0?[1-9]|[012345][0-9])(\\.[0-9]{1,3})?)?((\\s*[\\+\\-](0?[0-9]|1[0-9]|2[0-4])(\\:)?(0?[1-9]|[012345][0-9]))|(\\s*[A-z]{1,3}))*?)?'
    let dateFormats = [
      new RegExp('^([\\+-]?\\d{4}(?!\\d{2}\\b))((-?)((0[1-9]|1[0-2])(\\3([12]\\d|0[1-9]|3[01]))?|W([0-4]\\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\\d|[12]\\d{2}|3([0-5]\\d|6[1-6])))([T\\s]((([01]\\d|2[0-3])((:?)[0-5]\\d)?|24\\:?00)([\\.,]\\d+(?!:))?)?(\\17[0-5]\\d([\.,]\\d+)?)?([zZ]|([\\+-])([01]\\d|2[0-3]):?([0-5]\\d)?)?)?)?$'),
      new RegExp('^(0?[1-9]|1[012])[\\-\\_\\.\\/\\s]+(0?[1-9]|[12][0-9]|3[01])[\\-\\_\\.\\/\\s]+([0-9]{2,4})' + timeFormat + '$'),
      new RegExp('^[A-z]{3,}(\\,)?[\\-\\_\\.\\/\\s]*([A-z]{3,}(\\,)?[\\-\\_\\.\\/\\s]+)?(0?[1-9]|[12][0-9]|3[01])([A-z]{2})?(\\,)?[\\-\\_\\.\\/\\s]*([0-9]{2,4})' + timeFormat + '$'),
      new RegExp('^([A-z]{3,}(\\,)?[\\-\\_\\.\\/\\s]*)?((0?[1-9]|[12][0-9]|3[01])([A-z]{2})?(\\,)?[\\-\\_\\.\\/\\s]*)?[A-z]{3,}(\\,)?[\\-\\_\\.\\/\\s]*([0-9]{2,4})' + timeFormat + '$'),
      new RegExp('^[A-z]{3,}(\\,)?\\s+([A-z]{3,}(\\,)?\\s+)?(0?[1-9]|[12][0-9]|3[01])?\\s*' + timeFormat + '\\s+([0-9]{2,4})$')
    ]
    let isDate = (value) =>{
      var isDate = false;
      for (var format in dateFormats){
        if (value.trim().match(dateFormats[format])) {
          isDate = !isNaN(Date.parse(value)) && value.length != 4;
          if (isDate){
            break;
          }
        }
      }
      return isDate;
    }

</script>

<style scoped>

</style>