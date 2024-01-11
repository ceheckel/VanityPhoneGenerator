import fs from 'node:fs'
import wordListPath from 'word-list'

function main(phoneNumber) {
  // sanitize input by removing all non-numeric characters
  console.debug('sanitizing input...')
  const sanitizedPhoneNumber = phoneNumber.replace(/\D/g, '')
  console.debug(`sanitized input: ${sanitizedPhoneNumber} `)

  // generate all possible vanity numbers
  console.debug('generating vanity numbers...')
  const vanityNumbers = generateVanityNumbers(sanitizedPhoneNumber)
  console.debug(`all vanity numbers: ${vanityNumbers}`)

  // load a dictionary
  console.debug('getting dictionary...')
  const dictionary = getDictionary()

  // for each vanity number, determine if it contains any words
  console.debug('checking vanity numbers for words...')
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
  const finalVanityNumbers = [...new Set(filteredNumber)]
  console.debug(`final possible vanity numbers: ${finalVanityNumbers}`)
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
    }
    else {
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
  for (let i = 0; i < characters.length; i++) {
    for (let j = characters.length - 1; j > i; j--) {
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

function getDictionary() {
  // get the list of words from the word-list package
  const dictionary = fs.readFileSync(wordListPath, 'utf8').split('\n')

  // filter out words shorter than 4 characters
  const filteredDictionary = dictionary.filter((word) => {
    return word.length >= 4 && word.length <= 12
  })
  return filteredDictionary
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
    for (const letter of letters)
      generateCombinations(index + 1, currentVanity + letter)
  }

  generateCombinations(0, '')

  return vanityNumbers
}

// United States and Canada: (XXX) XXX-XXXX or XXX-XXX-XXXX
const phoneNumber = '800-123-4567' // 'FILM', 'FILO', 'CIEL'
// const phoneNumber = '(800) 123-4567'; // 'FILM', 'FILO', 'CIEL'

// International format: +XX XXX XXXXXXX
// const phoneNumber = '+1 800 1112222' // none found
// const phoneNumber = '1-800-222-3333' // 'ABED', 'BEEF', 'ACED', 'BADE', 'BAFF', 'ABBED', 'ABBE', 'CEDE', 'ABCEE', 'CADE', 'CADEE', 'CAFE', 'CAFF', 'BEDE', 'ACCEDE', 'BAAED', 'BABE'

main(phoneNumber)
