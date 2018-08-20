/* Code of parser out of raw.js */
export let parse = string => {
  if (!string || string.length === 0) return []

  let delimiter = detectDelimiter(string)
  let rows = [[]]
  let match
  let matches
  let data = []
  let re = new RegExp((
      "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
      "([^\"\\" + delimiter + "\\r\\n]*))"
    ),"gi"
  )

  while (matches = re.exec(string)) {
    match = matches[2] ? matches[2].replace(new RegExp( "\"\"", "g" ), "\"" ) : matches[3]
    if (matches[1].length && matches[1] !== delimiter) rows.push([])
    rows[rows.length - 1].push(match)
  }

  let headerIndex = 0
  let header = rows[headerIndex]

  // Check if header is first line and if not try with following lines (until fifth line)
  while (emptyStrings(header) > 2 && headerIndex < 5) {
    headerIndex++
    header = rows[headerIndex]
  }

  for (let i = headerIndex + 1; i < rows.length; i++) {
    if (rows[i].length === 1 && rows[i][0].length === 0 && rows[i].length !== header.length) {
      continue
    }
    if (rows[i].length === header.length) {
      let obj = {}
      for (let h in header) {
        obj[header[h]] = rows[i][h]
      }
      data.push(obj)
    } else {
      throw new ParseError(i)
      return false
    }
  }
  return data
}

// Function that returns the delimiter in a string
export let detectDelimiter = (string) => {
  if (!arguments.length) return

  let delimiters = [',', ';', '\t', ':', '|']
  let delimitersCount = delimiters.map(function (d) { return 0 })
  let header = string.split('\n')[0]
  let character
  let quoted = false
  let firstChar = true

  for (let i in header) {
    character = header[i]
    switch (character) {
      case '"':
        if (quoted) {
          if (header[i + 1] !== '"') quoted = false
          else i++
        } else if (firstChar) quoted = true
        break

      default:
        if (quoted) break
        let index = delimiters.indexOf(character)
        if (index !== -1) {
          delimitersCount[index]++
          firstChar = true
          continue
        }
        break
    }
    if (firstChar) firstChar = false
  }

  let maxCount = d3.max(delimitersCount)
  return maxCount === 0 ? '\0' : delimiters[delimitersCount.indexOf(maxCount)]
}

// Returns number of empty strings in an array
export let emptyStrings = (array) => {
  let numberEmptyStrings = 0
  for (let i = 0; i < array.length; i++) {
    if (array[i] === '') numberEmptyStrings++
  }
  return numberEmptyStrings
}

export let ParseError = (message) => {
  this.name = 'ParseError'
  this.message = message || 'Sorry something went wrong while parsing your data.'
}

export let getMetadata = (string) => {
  return d3.entries(sniff(parse(string))).map(function (d) {
    return { key: d.key, type: mode(d.value) }
  })
}

export let sniff = (objs) => {
  let keys = {}
  d3.keys(objs[0]).forEach(function (d) { keys[d] = [] })
  objs.forEach(function (d) {
    for (let key in keys) {
      let type = typeOf(d[key])
      if (type) keys[key].push(type)
    }
  })
  return keys
}

export let mode = (array) => {
  if (!arguments.length || array.length === 0) return null
  let counter = {}, mode = array[0], max = 1
  for (let i = 0; i < array.length; i++) {
    let el = array[i]
    if (counter[el] == null) counter[el] = 1
    else counter[el]++
    if (counter[el] > max) {
      mode = el
      max = counter[el]
    }
  }
  return mode
}

export let typeOf = (value) => {
  if (value === null || value.length === 0) return null
  if (isDate(value)) return Date.name
  if (isNumber(value)) return Number.name
  if (isString(value)) return String.name
  return null
}

export let isString = (value) => {
  return typeof value === 'string'
}

export let isNumber = (value) => {
  return !isNaN(value)
}

export let timeFormat = '([\\sT]?(0?[0-9]|1[0-9]|2[0-4])\:(0?[1-9]|[012345][0-9])(\\:(0?[1-9]|[012345][0-9])(\\.[0-9]{1,3})?)?((\\s*[\\+\\-](0?[0-9]|1[0-9]|2[0-4])(\\:)?(0?[1-9]|[012345][0-9]))|(\\s*[A-z]{1,3}))*?)?'

export let dateFormats = [
  new RegExp('^([\\+-]?\\d{4}(?!\\d{2}\\b))((-?)((0[1-9]|1[0-2])(\\3([12]\\d|0[1-9]|3[01]))?|W([0-4]\\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\\d|[12]\\d{2}|3([0-5]\\d|6[1-6])))([T\\s]((([01]\\d|2[0-3])((:?)[0-5]\\d)?|24\\:?00)([\\.,]\\d+(?!:))?)?(\\17[0-5]\\d([\.,]\\d+)?)?([zZ]|([\\+-])([01]\\d|2[0-3]):?([0-5]\\d)?)?)?)?$'),
  new RegExp('^(0?[1-9]|1[012])[\\-\\_\\.\\/\\s]+(0?[1-9]|[12][0-9]|3[01])[\\-\\_\\.\\/\\s]+([0-9]{2,4})' + timeFormat + '$'),
  new RegExp('^[A-z]{3,}(\\,)?[\\-\\_\\.\\/\\s]*([A-z]{3,}(\\,)?[\\-\\_\\.\\/\\s]+)?(0?[1-9]|[12][0-9]|3[01])([A-z]{2})?(\\,)?[\\-\\_\\.\\/\\s]*([0-9]{2,4})' + timeFormat + '$'),
  new RegExp('^([A-z]{3,}(\\,)?[\\-\\_\\.\\/\\s]*)?((0?[1-9]|[12][0-9]|3[01])([A-z]{2})?(\\,)?[\\-\\_\\.\\/\\s]*)?[A-z]{3,}(\\,)?[\\-\\_\\.\\/\\s]*([0-9]{2,4})' + timeFormat + '$'),
  new RegExp('^[A-z]{3,}(\\,)?\\s+([A-z]{3,}(\\,)?\\s+)?(0?[1-9]|[12][0-9]|3[01])?\\s*' + timeFormat + '\\s+([0-9]{2,4})$')
]

export let isDate = (value) => {
  let isDate = false
  for (let format in dateFormats) {
    if (value.trim().match(dateFormats[format])) {
      isDate = !isNaN(Date.parse(value)) && value.length !== 4
      if (isDate) {
        break
      }
    }
  }
  return isDate
}
