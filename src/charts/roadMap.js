/* A roadmap chart definition for AEVisualizer
* Created by Yazid Smahi on the 08/09/18 */

/* A modifier si jamais la forme du fichier change */
/* Noms des dimensions de mon fichier (fichier Excel par exemple) */
let nomDimensionPremiereColonne = 'Axe stratégique'
let nomsDimensionColonnesAnnees = ['2018', '2019', '2020', '2021']
let nomDimensionLignes = 'Sous-Domaine'
let nomDimensionTexteSurFleche = 'Projet'
// let nomDimensionCouleur = 'Projet'

/* Noms des valeurs que l'on veut utiliser par dimension */
let nomPremiereColonne = 'Distribution'

/*  A modifier si jamais on veut modifier des éléments graphiques de mon visuel */
/* Options graphiques de mon visuel */
let rawWidth = 1000 // Largeur du visuel
let rawHeight = 900 // Hauteur du visuel
let margin = 10 // Marge sur les bords du visuel
let afficherPremiereColonne = true // Mettre false si on ne veut pas afficher la première colonne

/* Fin de la partie modifiable pour un utilisateur non développeur */

/* Map function */
let nameDimensions = {
  nameDimNameElements: nomDimensionTexteSurFleche,
  nameColumnsRaw: nomsDimensionColonnesAnnees,
  nameDimRowRaw: nomDimensionLignes,
  nameDimFirstColumn: nomDimensionPremiereColonne,
  nameDimColorElements: false // (dimColorElements())?dimColorElements()[0]:false
}
let possibleFirstColumnValues = []
let wantedFirstColumnDefined = false

export function mapData (data) {
  let nameYearsArray = nomsDimensionColonnesAnnees
  let allYearsData = []
  data.forEach(el => {
    nameYearsArray.forEach(year => {
      let thereIsDataForThisYear = (el[year] !== '')
      let firstColumnIsUndefined = (el[nomDimensionPremiereColonne] === '')
      let rowIsUndefined = (el[nomDimensionLignes] === '')
      let elementFirstColumn = firstColumnIsUndefined
        ? nameDimensions.nameDimFirstColumn + ' indéfini'
        : el[nomDimensionPremiereColonne]
      let firstColumnHasNotBeenSeenAlready = (possibleFirstColumnValues.indexOf(elementFirstColumn) === -1)

      if (thereIsDataForThisYear) {
        allYearsData.push(
          {
            dimFirstColumn: elementFirstColumn,
            dimRow: rowIsUndefined ? nameDimensions.nameDimRowRaw + ' indéfini' : el[nomDimensionLignes],
            dimColumn: year, // dimColumn is here the year dimension
            dimElementInside: el[nomDimensionTexteSurFleche],
            // dimColorElements: el[dimColorElements()],
            dimYearData: el[year]
          })
      }

      if (firstColumnHasNotBeenSeenAlready && !wantedFirstColumnDefined) {
        possibleFirstColumnValues.push(elementFirstColumn)
      }
    })
  })
  return allYearsData
}

/* Function that converts a string containing an int and strings to the int
* Ex: 'Year 2020' would return 2020 */
function getIntFromString (stringWithInt) {
  let arraySplit = stringWithInt.split(/([0-9]+)/)
  arraySplit = arraySplit.filter(el => !isNaN(parseInt(el)))

  return arraySplit[0]
}

/* Drawing function */
export function drawChart (idSelection, data) {
  // data is the data structure resulting from the application of the model

  let dataPerYear = data

  let dimFirstColumn = 'dimFirstColumn'
  let namesFirstColumnInstances = dataPerYear.map(el => el[dimFirstColumn]).filter((v, i, a) => a.indexOf(v) === i)
  let nameWantedFirstColumn = nomPremiereColonne
  let isDisplayedFirstColumn = afficherPremiereColonne

  console.log('dataChartPerYear', dataPerYear)
  let dimColumn = 'dimColumn'
  let dimRow = 'dimRow'
  let dimElementInside = 'dimElementInside'
  let dimColorElements = 'dimColorElements'
  let nameDimRowRaw = nameDimensions.nameDimRowRaw
  let dimYearData = 'dimYearData'
  let nameDimFirstColumn = nameDimensions.nameDimFirstColumn
  let nameDimColorElements = nameDimensions.nameDimColorElements
  // let color1 = {red: 0, green: 153, blue: 51}
  // let color2 = {red: 204, green: 0, blue: 204}

  // Filter the whole dataset to get only the elements of dataset which have the wanted first column
  dataPerYear = dataPerYear.filter(el => el[dimFirstColumn] === nameWantedFirstColumn)

  // Create color domain
  // colors.domain(dataPerYear, el => el[dimColorElements])

  let margin = {top: 30, right: 0, bottom: 20, left: 0},
    graphWidth = rawWidth - 25,
    graphHeight = rawHeight - margin.top - margin.bottom

  let selection = d3.select(idSelection)

  let divGridGraph = selection.append('svg')
    .attr('class', 'gridGraph')
    .attr('width', graphWidth + margin.left + margin.right + 2 + 'px')
    .attr('height', graphHeight + margin.bottom + margin.top + 'px')
    .style('margin-left', -margin.left + 'px')
    .style('margin-right', -margin.right + 'px')

  /* Retrieve data from dataset */
  // Create columns' and rows' name arrays
  let columnsName = nameDimensions.nameColumnsRaw.sort((a, b) => parseInt(a) - parseInt(b)).map(col => getIntFromString(col))
  let colNamesPlusEmpty = [nameDimRowRaw, ...columnsName]
  let rowsName = dataPerYear.map(el => el[dimRow]).filter((v, i, a) => a.indexOf(v) === i)

  let cellWidth = (isDisplayedFirstColumn) ? graphWidth / (columnsName.length + 2) : graphWidth / (columnsName.length + 1)
  // Because columnsName is only name of years

  // Create dataset of elements that are on multiple dimensions
  let ElementInsideNames = dataPerYear.map(el => el[dimElementInside]).filter((v, i, a) => a.indexOf(v) === i)

  // Separation of vertical, horizontal and single elements
  let separatedData = createMultiSingleData(dataPerYear, dimRow, dimColumn, dimElementInside, nameWantedFirstColumn)

  let horizontalElementsData = separatedData[0]
  let singleElementsData = separatedData[1]

  horizontalElementsData.push(...singleElementsData.map(el => {
    let yearsData = {}
    yearsData[el[dimColumn]] = el[dimYearData]
    return {nameInsideElement: el[dimElementInside],
      columnsName: [el[dimColumn]],
      rowName: el[dimRow],
      dimColorElements: (nameDimColorElements) ? el[dimColorElements] : 0.5,
      yearsData: yearsData}
  }))

  console.log('horiz', horizontalElementsData)
  console.log('single', singleElementsData)

  /* Calculation of element height */
  // Calculation of max horizontal elements in the same cell
  let maxHorizontalElementsPerRow = maxElementsInRow(horizontalElementsData, rowsName, columnsName)
  let maxElementsAllRows = maxHorizontalElementsPerRow.reduce((a, b) => a + b)
  console.log('maxHorizElements', maxHorizontalElementsPerRow)

  let marginBetweenCells = 3
  let elementHeight = (graphHeight - (marginBetweenCells * (rowsName.length - 1))) / ( maxElementsAllRows + 1/3 + 0.5*rowsName.length) // 1/3 is for the first row height
  let firstRowHeight = elementHeight / 3

  // Create position data for grid
  let gridData = createGridData(rowsName.length + 1, columnsName.length + 1, cellWidth, maxHorizontalElementsPerRow, elementHeight, firstRowHeight, cellWidth)
  // Append names of row and columns in data
  gridData[0].forEach((col, indexCol) => col.name = colNamesPlusEmpty[indexCol]) // name columns
  for (let i = 1; i < gridData.length; i++) { // name rows
    let currentRow = gridData[i]
    currentRow[0].name = rowsName[i - 1]
  }

  for (let i = 1; i < rowsName.length + 1; i++) {
    let currentRow = gridData[i]
    for (let j = 0; j < columnsName.length; j++) {
      let currentCell = currentRow[j + 1]
      currentCell.rowName = rowsName[i - 1]
      currentCell.columnName = columnsName[j]
    }
  }

  console.log('gridData', gridData)

  /* Creation of the underneath grid */
  drawGrid (divGridGraph, gridData)
  if (isDisplayedFirstColumn) drawFirstColumn (divGridGraph, nameWantedFirstColumn, 1 + firstRowHeight, graphHeight, cellWidth)

  /* Create superimposed svg elements */
  // Drawing of vertical elements and creating
  let gridSelection = d3.select('#grid')
  draw(horizontalElementsData, gridSelection, elementHeight)

  // function that creates a grid
  // http://www.cagrimmett.com/til/2016/08/17/d3-lets-make-a-grid.html
  function createGridData (numberRow, numberColumn, cellWidth, arrayMaxElementPerRow, elementHeight, firstRowHeight, initialX) {
    let dataPos = [];
    let xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below
    let ypos = 1;
    let width = cellWidth
    let height

    // iterate for rows
    for (let row = 0; row < numberRow; row++) {
      dataPos.push( [] );
      let RowIsFirstRow = (row === 0)
      height = (row === 0)?firstRowHeight:(arrayMaxElementPerRow[row - 1] + 0.5) * elementHeight

      // iterate for cells/columns inside rows
      for (let column = 0; column < numberColumn; column++) {

        dataPos[row].push({
          x: xpos,
          y: ypos,
          width: width,
          height: height
        })
        // increment the x position. i.e. move it over by width (width variable)
        xpos += width;
      }
      // reset the x position after a row is complete
      xpos = 1;
      // increment the y position for the next row. Move it down by height (height variable)
      ypos += height + marginBetweenCells;
    }
    return dataPos;
  }

  /* Function to draw the grid
  * selection is the d3 selection where the grid will be appended
  * gridData is the grid data with the position and dimension of each cell
  * See createGridData function*/
  function drawGrid (selection, gridData) {
    selection.append('g')
      .attr('id', 'grid')

    let grid = d3.select('#grid')
      .append('g')
      .attr("width", graphWidth + margin.left + margin.right + 'px')
      .attr("height", graphHeight + margin.bottom + margin.top + 'px')
      .style("margin-left", -margin.left + "px")
      .style("margin.right", -margin.right + "px")

    // Create g for each row
    let row = grid.selectAll(".Row")
      .data(gridData)
      .enter()
      .append("g")
      .attr("class", "Row");

    // Create all cells
    let cell = row.selectAll(".Cell")
      .data(function(row) { return row; })
      .enter()
      .append('g')
      .attr('class', 'Cell')

    // Create rectangles for cells
    let rowIndex = 0
    cell.append("rect")
      .attr("class", (rect, i) => {
        let cellClass = 'insideTableRect'
        if (i%(columnsName.length + 1) === 0) {
          // Cell is row name
          cellClass = 'rowNameRect'
        }
        if (rowIndex === 0) {
          // Cell is column name
          cellClass = 'columnNameRect'
          rowIndex = (i === columnsName.length)?(rowIndex + 1):rowIndex
        }
        return cellClass
      })
      .attr('id', rect =>{
        let rectIsAnInsideRect = (rect.rowName && rect.columnName)
        let idInsideRect = 'rect' + rowsName.indexOf(rect.rowName) + '' + columnsName.indexOf(rect.columnName)

        if (rectIsAnInsideRect) return idInsideRect
      })
      .attr("x", function(rect) { return rect.x; })
      .attr("y", function(rect) { return rect.y; })
      .attr("width", function(rect) { return rect.width; })
      .attr("height", function(rect) { return rect.height; })

    // Adjust style of table
    d3.selectAll('.rowNameRect')
      .style('fill', '#49648c')
      .style('stroke', "#ffffff")

    d3.selectAll('.columnNameRect')
      .style('fill', '#fff6de')
      .style('stroke', "#49648c")

    d3.selectAll('.insideTableRect')
      .style('fill', 'transparent')
      .style('stroke', "#ffffff")

    d3.selectAll('.firstRect')
      .style('opacity', '0')
      .style('filter', 'alpha(opacity=0)')

    // Append name of rows and columns
    rowIndex = 0
    cell.append('text')
      .attr('x', cell => cell.x + cell.width/2)
      .attr('y', cell => cell.y + cell.height/2)
      .attr("dy", ".35em")
      .attr('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text((cell, indexCell) => {
        if (cell.hasOwnProperty('name')) {
          return cell.name
        }
      })
      .style('fill', (cell, indexCell) => {
        let nameColor
        if (indexCell%(columnsName.length + 1) === 0) {
          // Cell is row name
          nameColor = '#ffffff'
        }

        if (rowIndex === 0) {
          // Cell is column name
          nameColor = '#49648c'
          rowIndex = (indexCell === columnsName.length  )?(rowIndex + 1):rowIndex
        }
        return nameColor
      })
      .style('font-family', 'Arial')
      .style('font-size', '11px')
      .call(wrap, cellWidth)
  }

  /* Function that draws first column */
  function drawFirstColumn (parentSelection, nameFirstColumn, initialY, firstColumnHeight, firstColumnWidth) {
    // Translate the rest of the table of the equivalent of 1 cell width in x
    d3.select('#grid').attr('transform', 'translate(' + firstColumnWidth + ', 0)')

    let firstColumn = parentSelection.append('g')
      .attr('id', 'FirstColumn')

    firstColumn.append('rect')
      .attr('x', 1)
      .attr('y', 1)
      .attr('height', initialY - 1)
      .attr('width', firstColumnWidth)
      .attr('id', 'cellNameFirstColumn')
      .style('fill', '#ffffff')
      .style('stroke', '#49648c')

    firstColumn.append('text')
      .text(nameDimFirstColumn)
      .attr('x', 1 + firstColumnWidth / 2)
      .attr('y', 1 + initialY / 2)
      .attr('dy', '.3em')
      .attr('text-anchor', 'middle')
      .style('fill', '#49648c')
      .style('font-family', 'Arial')
      .style('font-size', '11px')
      .call(wrap, cellWidth)

    firstColumn.append('rect')
      .attr('x', 1)
      .attr('y', initialY + marginBetweenCells)
      .attr('height', 1 + firstColumnHeight - initialY)
      .attr('width', firstColumnWidth)
      .attr('id', 'RectFirstColumn')
      .style('fill', '#374b69')

    firstColumn.append('text')
      .text(nameWantedFirstColumn)
      .attr('x', 1 + firstColumnWidth / 2)
      .attr('y', initialY + marginBetweenCells + firstColumnHeight / 2)
      .attr('dy', '.3em')
      .attr('text-anchor', 'middle')
      .style('fill', '#ffffff')
      .style('font-weight', 'bold')
      .style('font-family', 'Arial')
      .style('font-size', '11px')
      .call(wrap, cellWidth)
  }

  /* Calculate the maximum of elements that are in the same row
   * Returns [a, b, c] where a: max elements in a cell of first row
   * b: max elements in a cell of 2nd row ... */
  function maxElementsInRow (horizontalElementsData, rowsName, columnsName) {
    let matrixHorizEl = new Array(rowsName.length).fill().map(() => {
      return new Array(columnsName.length)
        .fill()
        .map(() => [0])
    })

    horizontalElementsData.forEach(el => {
      el.columnsName.forEach(colName => {
        matrixHorizEl[rowsName.indexOf(el.rowName)][columnsName.indexOf(colName)] = parseInt(matrixHorizEl[rowsName.indexOf(el.rowName)][columnsName.indexOf(colName)]) + 1
      })
    })

    return matrixHorizEl.map(row => Math.max(...row))
  }

  /* Returns an array of elements data [dataVerticalElements, dataHorizontalElements, dataSingleElements]
  * dataElements : array of objects defining the position of elements
   * Ex : [{"AppName": "App1", "Branch": "Finance", "CompanyBrand": "Brand1" }]
   * with "Branch" being the column's name and "CompanyBrand" the row's one */
  function createMultiSingleData (dataElements, nameDimRow, nameDimColumn, nameDimElementInside, nameFirstColumn) {
    // Create array of elements that are in multiple cell or column
    let namesDataMultiple = dataElements.map(el => el[nameDimElementInside])
      .filter((v, i, a) => !(a.indexOf(v) === i))
      .filter((v, i, a) => a.indexOf(v) === i)

    let horizontalElementsData = []
    let singleElementsData = dataElements.filter(el => namesDataMultiple.indexOf(el[nameDimElementInside]) === -1)

    let colorElement = ''

    namesDataMultiple.forEach(nameInsideElement => {
      let rowsData = []
      let rows = []
      dataElements.filter(item => item[nameDimElementInside] === nameInsideElement)
        .forEach(el => {
          rows.push(el[nameDimRow])
          rowsData.push(el)
          colorElement = (nameDimColorElements)?el[dimColorElements]:0.5
        })

      let uniqueRowsName = rows.filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => {
          return rowsName.indexOf(a) - rowsName.indexOf(b)
        })

      uniqueRowsName.forEach(rowName => {
        let cols = []
        let yearsData = {}
        rowsData.filter(data => data[nameDimRow] === rowName)
          .forEach(el => {
            cols.push(el[nameDimColumn])
            yearsData[el[nameDimColumn]] = el[dimYearData]
          })
        let nameUniqueCols = cols.filter((v, i, a) => a.indexOf(v) === i)
          .sort((a, b) => {
            return columnsName.indexOf(a) - columnsName.indexOf(b)
          })

        if (nameUniqueCols.length > 1) {
          let cs = [nameUniqueCols[0]]
          for (let l = 1; l < nameUniqueCols.length; l++) {
            if (columnsName.indexOf(nameUniqueCols[l]) - columnsName.indexOf(nameUniqueCols[l - 1]) > 1) {
              // columns not next to each other
              if (cs.length > 1) {
                // element is on multiple columns next to each other
                horizontalElementsData.push({
                  nameInsideElement: nameInsideElement,
                  columnsName: cs,
                  rowName: rowName,
                  dimColorElements: colorElement,
                  yearsData: yearsData
                })
              } else {
                let dataElement = {}
                dataElement[nameDimElementInside] = nameInsideElement
                dataElement[nameDimColumn] = cs[0]
                dataElement[nameDimRow] = rowName
                dataElement[dimColorElements] = colorElement
                dataElement[dimYearData] = yearsData[cs[0]]
                singleElementsData.push(dataElement)
              }
              cs = [nameUniqueCols[l]]
              if (l === nameUniqueCols.length - 1) {
                let dataElement = {}
                dataElement[nameDimElementInside] = nameInsideElement
                dataElement[nameDimColumn] = cs[0]
                dataElement[nameDimRow] = rowName
                dataElement[dimYearData] = yearsData[cs[0]]
                dataElement[dimColorElements] = colorElement
                singleElementsData.push(dataElement)
              }
            }
            else {
              cs.push(nameUniqueCols[l])
              if (l === nameUniqueCols.length - 1) {
                horizontalElementsData.push({
                  nameInsideElement: nameInsideElement,
                  columnsName: cs,
                  rowName: rowName,
                  dimColorElements: colorElement,
                  yearsData: yearsData
                })
              }
            }
          }
        }
        else {
          let r = []
          let nameCol = nameUniqueCols[0]
          r = rowsData.filter(el => el[nameDimColumn] === nameCol)
            .map(el => el[nameDimRow])
            .filter((v, i, a) => a.indexOf(v) === i)
            .sort((a, b) => {
              return rowsName.indexOf(a) - rowsName.indexOf(b)
            })

          if (r.length > 1) {
            let rs = [r[0]]
            for (let l=1; l<r.length; l++) {
              if (rowsName.indexOf(r[l]) - rowsName.indexOf(r[l - 1]) > 1) {
                // rows not next to each other
                let dataElement = {}
                dataElement[nameDimElementInside] = nameInsideElement
                dataElement[nameDimColumn] = nameCol
                dataElement[nameDimRow] = rs[0]
                dataElement[dimYearData] = yearsData[nameCol]
                dataElement[dimColorElements] = colorElement

                // Check if element already in singleElementsData
                let stringSingElData = singleElementsData.map(el => JSON.stringify(el))
                if (stringSingElData.indexOf(JSON.stringify(dataElement)) === -1) {
                  singleElementsData.push(dataElement)
                }
                rs = [r[l]]
                if (l === r.length - 1) {
                  let dataElement = {}
                  dataElement[nameDimElementInside] = nameInsideElement
                  dataElement[nameDimColumn] = nameCol
                  dataElement[nameDimRow] = rs[0]
                  dataElement[dimYearData] = yearsData[nameCol]
                  dataElement[dimColorElements] = colorElement

                  // Check if element already in singleElementsData
                  let stringSingElData = singleElementsData.map(el => JSON.stringify(el))
                  if (stringSingElData.indexOf(JSON.stringify(dataElement)) === -1) {
                    singleElementsData.push(dataElement)
                  }
                }
              }
              else {
                rs.push(r[l])
              }
            }
          }
          else {
            // those element's columns and rows are not next to each other
            // They will therefore be considered as two distinct elements
            let dataElement = {}
            dataElement[nameDimElementInside] = nameInsideElement
            dataElement[nameDimColumn] = nameCol
            dataElement[nameDimRow] = r[0]
            dataElement[dimYearData] = yearsData[nameCol]
            dataElement[dimColorElements] = colorElement
            singleElementsData.push(dataElement)
          }
        }
      })
    })

    // Data multiple horizontal elements
    horizontalElementsData = horizontalElementsData.filter((v, i, fullTable) => {
      let stringifiedObjectsTable = fullTable.map(el => JSON.stringify(el))
      return stringifiedObjectsTable.indexOf(JSON.stringify(v)) === i
    })

    return [horizontalElementsData, singleElementsData]
  }

  /* Create an array of objects, each one of them contains all the data necessary to define an element visually  */
  function createElementsPositionData (elementsData, elementHeight) {
    let dataElements = []
    let smallMove = 0

    elementsData.forEach(element => {

      // Select the cell where the element should have his first extremity
      let idCellBeginning = '#rect' + rowsName.indexOf(element.rowName)
        + '' + columnsName.indexOf(element.columnsName[0])

      let cellBeginningData =
        getSelectionCellData(idCellBeginning)
      let xBeginning = cellBeginningData.x
      let yBeginning = cellBeginningData.y

      // Select the cell where the element should have his end extremity
      let idCellEnd = '#rect' + rowsName.indexOf(element.rowName)
        + '' + columnsName.indexOf(element.columnsName[element.columnsName.length - 1])

      let cellEndData = getSelectionCellData(idCellEnd)
      let xEnd = cellEndData.x
      let yEnd = cellEndData.y
      let cellWidth = cellEndData.width
      let cellHeight = cellEndData.height

      let widthElement = xEnd - xBeginning + cellWidth - 40

      let heightElement = elementHeight

      dataElements.push({
        idealX: xBeginning,
        idealY: yBeginning + 3,
        x: xBeginning,
        y: yBeginning + 3,
        width: widthElement,
        height: heightElement,
        nameInsideElement: element.nameInsideElement,
        colorElement: (nameDimColorElements)?element[dimColorElements]:0.5,
        rowName: element.rowName,
        yearsData: element.yearsData
      })

      // smallMove is used so that no elements are exactly at the same position so that tick() works
      smallMove++
    })

    // Changes rectangles position so there is no overlapping and each element is on one row or one column
    moveToRightPlace(dataElements)

    return dataElements
  }

  /* Function to draw all elements on the graph
  * typeOfElement can be 'multi' for big rectangle elements or 'single' for unique cell elements
   * that will be drawn as circles */
  function draw (elementsData, gridSelection, elementHeight) {
    let dataElements = createElementsPositionData(elementsData, elementHeight)

    let elementsSpace = gridSelection.append('svg')
      .attr('class', 'superimposedElementsSpace')

    let dragRectangle = d3.drag()
      .on("start", dragstarted)
      .on("drag", rectangleDragged)
      .on("end", dragended)

    dataElements.forEach((dataElement, indexElement) => {
      dataElement.xBeginning = dataElement.x + 10
      dataElement.yBeginning = dataElement.y + 10

      let elementSelection = elementsSpace.selectAll('#elementNumber' + indexElement)
        .data([dataElement])
        .enter()
        .append('g')
        .attr('class', 'element')
        .attr('id', element => {
          return 'elementNumber' + indexElement
        })

      elementSelection.append('rect')
        .attr('x', element => element.x)
        .attr('y', element => element.y)
        .attr('width', element => element.width)
        .attr('height', element => element.height)
        .style('fill', element => nameDimColorElements ? colors()(element.colorElement) : '#d8dfeb')
        .attr('class', element => element.nameInsideElement)
        .style('stroke', 'transparent')
        .call(dragRectangle)

      elementSelection.append('path')
        .attr('d',element => {
          let topArrowX = element.x + element.width
          let topArrowY = element.y
          let middleArrowX = element.x + element.width + 30
          let middleArrowY = element.y + element.height / 2
          let bottomArrowX = element.x + element.width
          let bottomArrowY = element.y + element.height
          return 'M' + topArrowX + ' ' + topArrowY //Upper point of arrow
            + ' L' + middleArrowX + ' ' + middleArrowY // Front point of arrow
            + ' L' + bottomArrowX + ' ' + bottomArrowY // Bottom point
            + ' Z' // Close path
        })
        .style('fill', element => nameDimColorElements ? colors()(element.colorElement) : '#d8dfeb')

      elementSelection.append('text')
        .attr('dy', '.3em')
        .text(element => element.nameInsideElement)
        .attr('text-anchor', 'left')
        .attr('x', element => element.xBeginning)
        .attr('y', element => element.yBeginning)
        .style('fill', '#49648c')
        .style('font-family', 'Arial')
        .style('font-size', '10px')
        .attr('class', 'nameElement')
        .call(wrap)

      let yearsData = dataElement.yearsData
      let tesst = Object.keys(yearsData)
      tesst.sort((a, b) => parseInt(a) - parseInt(b))
      let firstYearOfData = parseInt(Object.keys(yearsData)[0])

      let allAdditionalTexts = elementSelection.append('text')
        .attr('dy', '.3em')
        .attr('text-anchor', 'left')
        .attr('x', element => element.xBeginning + 0.65 * element.width / Object.keys(yearsData).length)
        .attr('y', element => element.yBeginning + element.height - 20)
        .style('fill', '#49648c')
        .style('font-family', 'Arial')
        .style('font-size', '10px')

      for (let year = firstYearOfData; year < firstYearOfData + Object.keys(yearsData).length; year++) {
        allAdditionalTexts.append('tspan')
          .attr('x', element => element.xBeginning + 0.65 * element.width / Object.keys(yearsData).length)
          .attr('y', element => element.yBeginning + element.height - 20)
          .attr('dx', element => (year - firstYearOfData) * element.width / Object.keys(yearsData).length)
          .text((parseInt(yearsData[year]))?yearsData[year] + ' M€':yearsData[year])
          .attr('class', 'additionalText')

      }
    })
  }

  function dragstarted(d) {
    d3.select(this.parentNode).raise().classed("active", true)
  }

  function rectangleDragged (d) {
    d3.select(this.parentNode).select('rect')
      .attr("x", d.x = d3.event.x)
      .attr("y", d.y = d3.event.y)

    d3.select(this.parentNode).selectAll('.nameElementText')
      .attr("x", d3.event.x + 10)
      .attr("y", d3.event.y + 10)

    d3.select(this.parentNode).selectAll('.additionalText')
      .attr("x", el => d3.event.x + 10 + 0.65 * el.width / Object.keys(el.yearsData).length)
      .attr("y", el => d3.event.y + 10 + el.height - 20)

    d3.select(this.parentNode).select('path')
      .attr('d',element => {
        let topArrowX = d3.event.x + element.width
        let topArrowY = d3.event.y
        let middleArrowX = d3.event.x + element.width + 30
        let middleArrowY = d3.event.y + element.height / 2
        let bottomArrowX = d3.event.x + element.width
        let bottomArrowY = d3.event.y + element.height
        return 'M' + topArrowX + ' ' + topArrowY //Upper point of arrow
          + ' L' + middleArrowX + ' ' + middleArrowY // Front point of arrow
          + ' L' + bottomArrowX + ' ' + bottomArrowY // Bottom point
          + ' Z' // Close path
      })
  }

  function dragended(d) {
    d3.select(this.parentNode).classed("active", false)
  }

  /* Changes y position of all elements in elementsData to avoid overlapping */
  function moveToRightPlace (elementsData) {
    let elementsToPlaceInRow
    // For each row, look for elements
    rowsName.forEach(row => {
      elementsToPlaceInRow = elementsData.filter(el => el.rowName === row)
      let elementsToPlaceInCell
      // heightsAlreadyUsed is an array which indexes are the indexes of the years of the roadmap and which values are
      // arrays of already used heights for those years
      let heightsAlreadyUsed = new Array(columnsName.length).fill().map(() => [])

      // For each column in a row check for elements
      columnsName.forEach((column, indexCol) => {
        elementsToPlaceInCell = elementsToPlaceInRow.filter(el => Object.keys(el.yearsData).indexOf(column) !== -1)

        let element1
        for (let indexEl = 0; indexEl < elementsToPlaceInCell.length; indexEl++) {
          element1 = elementsToPlaceInCell[indexEl]

          // while height is already used
          while (heightsAlreadyUsed[indexCol].indexOf(element1.y) !== -1) {
            element1.y += elementHeight + 3
          }

          for (let i = indexCol; i < indexCol + Object.keys(element1.yearsData).length; i++) {
            // set the heights in each cell where element1 is as used heights
            heightsAlreadyUsed[i].push(element1.y)
          }

          elementsToPlaceInRow.splice(elementsToPlaceInRow.indexOf(element1), 1) // Element has been placed
        }
      })
    })
  }

  /* Function that returns the selection cell bounded data (contains x, y, width, height) */
  function getSelectionCellData (idCell) {
    return d3.selectAll('.Row').selectAll('.Cell').select(idCell).datum()
  }

  // function that returns a color over a radient depending on the weight (between 0 and 1)
  /* function pickHex(weight, color1, color2) {
    let w1 = weight;
    let w2 = 1 - w1;
    let rgb = [Math.round(color1.red * w1 + color2.red * w2),
      Math.round(color1.green * w1 + color2.green * w2),
      Math.round(color1.blue * w1 + color2.blue * w2)];
    return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
  } */

  function wrap (text, width) {
    text.each(function () {
      let parentNode = d3.select(this.parentNode).select('rect')
      let text = d3.select(this),
        maxWidth = width ? width : parentNode.attr('width') - 3,
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr('y'),
        x = text.attr('x'),
        dy = parseFloat(text.attr('dy')),
        tspan = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', dy + 'em')
          .attr('class', 'nameElementText')
      while (word = words.pop()) {
        line.push(word)
        tspan.text(line.join(' '))
        if (tspan.node().getComputedTextLength() > parentNode.attr('width') - 3) {
          line.pop()
          tspan.text(line.join(' '))
          line = [word]
          tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word)
            .attr('class', 'nameElementText')
        }
      }
    })
  }
}