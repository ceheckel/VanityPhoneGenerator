import * as ddb from './utils/databaseUtils.js'
import getDictionary from './utils/dictionaryUtils.js'
import { failure, success } from './utils/responseUtils.js'

export async function handler(event, context, callback) {
  // determine if the event is from an AWS Contact Flow
  if (event === undefined || event.Name !== 'ContactFlowEvent') {
    callback(null, failure({ status: false, error: 'Lambda function could not determine the event name' }))
  }

  if (event.Details === undefined || event.Details.ContactData === undefined || event.Details.ContactData.CustomerEndpoint === undefined) {
    callback(null, failure({ status: false, error: 'Lambda function could not determine the caller\'s phone number' }))
  }

  // obtain the caller's phone number
  const phoneNumber = event.Details.ContactData.CustomerEndpoint.Address

  // sanitize input by removing all non-numeric characters
  console.debug('sanitizing input...')
  const sanitizedPhoneNumber = phoneNumber.replace(/\D/g, '')
  console.debug(`sanitized input: ${sanitizedPhoneNumber} `)

  // generate all possible vanity numbers
  console.debug('generating vanity numbers...')
  let vanityNumbers = generateVanityNumbers(sanitizedPhoneNumber)
  console.debug(`all vanity numbers: ${vanityNumbers}`)

  // load a dictionary
  console.debug('getting dictionary...')
  const dictionary = getDictionary()
  console.debug('dictionary loaded')

  // filter generated strings for valid words, revert unused letters, and remove duplicate vanity numbers
  console.debug('checking vanity numbers for words...')
  vanityNumbers = getFinalVanityNumbers(vanityNumbers, dictionary)
  console.debug(`final possible vanity numbers: ${vanityNumbers}`)

  // fetch the current top five vanity numbers from the DB
  console.debug(`fetching the top five numbers from the DB...`)
  const topFive = await ddb.fetchAll()
  console.debug(`current top five: ${topFive}`)

  // get the least impressive of the top five
  console.debug(`getting the record to potentially remove...`)
  const shortestSaved = findRankFive(topFive)
  console.debug(`record to remove: '${shortestSaved}'`)

  // get the most impressive of the generated numbers
  console.debug(`getting the record to potentially add...`)
  const longestGenerated = findBestCandidate(vanityNumbers)
  longestGenerated.phoneNumber = phoneNumber // add the PK to the record
  console.debug(`record to add: '${JSON.stringify(longestGenerated)}'`)

  // update the top five in the DB
  console.debug(`Updating the DB...`)
  await ddb.adjustTopFive(shortestSaved, longestGenerated)
  console.debug(`Updated`)

  // return success
  callback(null, success(vanityNumbers))
}

function findBestCandidate(finalVanityNumbers) {
  // determine if there are any generated vanity numbers
  let longestGenerated = { word: '' }
  if (finalVanityNumbers === undefined || finalVanityNumbers.length === 0) {
    longestGenerated = undefined
  } else {
    // determine which of the caller's vanities is the most impressive
    for (const vn of finalVanityNumbers) {
      const word = vn.replace(/[^a-zA-Z]/g, '')
      if (word.length > longestGenerated.word.length) {
        longestGenerated = {
          // will add PK later
          vanityNumber: vn,
          word
        }
      }
    }
    console.debug(`the longest of the caller's options is ${longestGenerated.word}'`)

    return longestGenerated
  }
}

function findRankFive(topFive) {
  // determine if there is still room in the top five
  let shortestSaved = { word: 'maximumWordLength' }
  if (topFive.length < 5) {
    shortestSaved = undefined
    console.debug(`there is still room in the top five`)
  } else {
    // determine which of the top five is the least impressive
    // superiority is determined by the length of the word found in the vanity number
    for (const tf of topFive) {
      const word = tf.replace(/[^a-zA-Z]/g, '')
      if (word.length < shortestSaved.word.length) {
        shortestSaved = tf
      }
    }
    console.debug(`the shortest of the top five is '${shortestSaved.word}'`)
  }

  return shortestSaved
}

function getFinalVanityNumbers(vanityNumbers, dictionary) {
  const filteredNumber = []
  for (const number of vanityNumbers) {
    console.debug(`checking number: ${number}...`)
    // determine if the current number contains any words
    let response = containsWord(number, dictionary)
    if (response !== undefined) {
      console.debug(`${response.vanityNumber} contains word: ${response.word}`)
      // if so, convert the unused letters back to numbers
      response = convertUnusedLettersToNumbers(response.vanityNumber, response.word)

      // remember the number
      filteredNumber.push(response)
    }
  }

  // delete duplicate vanity numbers by converting the array to a set and then back to an array
  return [...new Set(filteredNumber)]
}

function convertUnusedLettersToNumbers(vanityNumber, word) {
  // setup keypad mapping
  const keypadMapping = { 0: '0', 1: '1', A: '2', B: '2', C: '2', D: '3', E: '3', F: '3', G: '4', H: '4', I: '4', J: '5', K: '5', L: '5', M: '6', N: '6', O: '6', P: '7', Q: '7', R: '7', S: '7', T: '8', U: '8', V: '8', W: '9', X: '9', Y: '9', Z: '9' }

  const wordStartPos = vanityNumber.indexOf(word)
  let retVal = ''

  for (let i = 0; i < vanityNumber.length; i += 1) {
    // if the current index is part of the word, do not convert the letter
    if (i >= wordStartPos && i < (wordStartPos + word.length)) {
      retVal = retVal.concat(vanityNumber[i])
    } else {
      // otherwise, switch the letter back to the associated number
      retVal = retVal.concat(keypadMapping[vanityNumber[i]])
    }
  }

  // return the finalized vanity number
  return retVal
}

function containsWord(inputString, dictionary) {
  // Split the input string into an array of characters
  const characters = inputString.split('')

  // Iterate through substrings of different lengths starting with the largest possible string
  for (let i = 0; i < characters.length; i += 1) {
    for (let j = characters.length; j > i; j -= 1) {
      const substring = inputString.slice(i, j)
      // given the next substring, determine if it matches a word in the provided dictionary
      if (dictionary.includes(substring.toLowerCase())) {
        return {
          vanityNumber: inputString,
          word: substring
        }
      }
    }
  }
}

function generateVanityNumbers(phoneNumber) {
  // setup keypad mapping
  const keypadMapping = {
    2: 'ABC',
    3: 'DEF',
    4: 'GHI',
    5: 'JKL',
    6: 'MNO',
    7: 'PQRS',
    8: 'TUV',
    9: 'WXYZ'
  }

  // start generating possible vanity numbers using a recursive function
  const vanityNumbers = []

  const generateCombinations = (index, currentVanity) => {
    // define the recursion stopping condition
    if (index === phoneNumber.length) {
      vanityNumbers.push(currentVanity)
      return
    }

    // since '0' and '1' do not have letters associated with them, skip them when they occur
    const digit = phoneNumber[index]
    if (digit === '0' || digit === '1') {
      generateCombinations(index + 1, currentVanity + digit)
      return
    }

    // otherwise, generate a combination for each of the letters associated with this number
    const letters = keypadMapping[digit]
    for (const letter of letters) {
      generateCombinations(index + 1, currentVanity + letter)
    }
  }

  // to speed up the generation process, only generate combinations based on the last 7 digits
  generateCombinations(phoneNumber.length - 7, '')

  return vanityNumbers
}
