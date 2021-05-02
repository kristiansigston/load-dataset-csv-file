import fs from 'fs'
import _ from 'lodash'
import shuffleSeed from 'shuffle-seed'

function extractColumns(data, columnNames) {
  const headers = _.first(data)
  const indexes = columnNames.map((name) => headers.indexOf(name))
  const extracted = data.map((row) => _.pullAt(row, indexes))
  return extracted
}

function loadCSV(
  filename,
  {
    converters = () => {},
    dataColumns = [],
    labelColumns = [],
    shuffle = true,
    splitTest = false,
  }
) {
  let data = fs.readFileSync(filename, { encoding: 'utf-8' })

  data = data
    .trim()
    .split('\n')
    .map((row) => row.split(','))
  data = data.map((row) => _.dropRightWhile(row, (val) => val === ''))
  const headers = _.first(data)

  data = data.map((row, index) => {
    if (index === 0) {
      return row
    }
    return row.map((element, index) => {
      if (converters[headers[index]]) {
        const converted = converters[headers[index]](element)
        return _.isNaN(converted) ? element : converted
      }
      const result = parseFloat(element)
      return _.isNaN(result) ? element : result
    })
  })

  let labels = extractColumns(data, labelColumns)
  data = extractColumns(data, dataColumns)

  labels.shift()
  data.shift()

  if (shuffle) {
    data = shuffleSeed.shuffle(data, 'fred')
    labels = shuffleSeed.shuffle(labels, 'fred')
  }

  if (splitTest) {
    const trainSize = _.isNumber(splitTest)
      ? splitTest
      : Math.floor(data.length / 2)
    return {
      features: data.slice(trainSize),
      labels: labels.slice(trainSize),
      testFeatures: data.slice(0, trainSize),
      testLabels: labels.slice(0, trainSize),
    }
  } else {
    return { features: data, labels }
  }
}

const { features, labels, testFeatures, testLabels } = loadCSV(
  './data/index.csv',
  {
    dataColumns: ['height', 'value'],
    labelColumns: ['passed'],
    shuffle: true,
    splitTest: 1,
    converters: {
      passed: (val) => val === 'TRUE',
    },
  }
)

export default loadCSV
