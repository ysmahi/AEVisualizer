/* Useful functions in the entire code */

export function uploadFile (file) {
  return new Promise(resolve => {
    if (file.size) {
      this.loading = true

      // excel
      if (file.name.search(/\.xls|\.xlsx/) !== -1 || file.type.search('sheet') !== -1) {
        loadExcel(file)
          .then(worksheets => {
            // $scope.fileName = file.name Definition of file in store
            this.loading = false
            // multiple sheets
            if (worksheets.length > 1) {
              this.worksheets = worksheets
              // single > parse
            } else {
              console.log('worksheets', worksheets)
              console.log('worksheets', typeof worksheets)
              this.parse(worksheets[0].text)
            }
            resolve('File data was loaded')
          })
      }
    }
  })
}

let loadExcel = (file) => {
  let reader = new FileReader()

  return new Promise((resolve, reject) => {
    reader.onload = function (e) {
      let worksheets = []
      let data = e.target.result
      let workbook = XLSX.read(data, {type: 'binary'})
      let shettNameList = workbook.SheetNames

      shettNameList.forEach(function (y) { /* iterate through sheets */
        let worksheet = workbook.Sheets[y]
        worksheets.push({
          name: y,
          text: XLSX.utils.sheet_to_csv(worksheet)
          // rows: worksheet['!range'].e.r
        })
      })
      resolve(worksheets)
    }

    reader.onerror = () => {
      reader.abort()
      reject(new DOMException('Problem parsing input file.'))
    }

    reader.readAsBinaryString(file)
  })
}

let parse = (text) => {
  this.text = text
  this.dataFile = []
  this.metadata = []
  this.error = false

  if (!text) return

  try {
    this.dataFile = parse(text)
    this.metadata = getMetadata(text)
    this.error = false
    this.parsed = true
  } catch (e) {
    this.data = []
    this.metadata = []
    this.error = e.name === 'ParseError' ? +e.message : false
  }
  this.loading = false
}
