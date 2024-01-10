function main(phoneNumber) {
  // sanitize input by removing all non-numeric characters
  const sanitizedPhoneNumber = phoneNumber.replace(/\D/g, '');

  // generate all possible vanity numbers
  const vanityNumbers = generateVanityNumbers(sanitizedPhoneNumber);

  // load a dictionary
  const dictionary = getDictionary()

  // for each vanity number, determine if it contains any words
  const filteredNumber = []
  for (const number of vanityNumbers) {
    // determine if the current number contains any words
    const response = containsWord(number, dictionary)
    if (response !== undefined) {
      // if so, remember the number
      filteredNumber.push(response)
    }
  }

  console.log(filteredNumber)
}

function containsWord(inputString, dictionary) {
  // Split the input string into an array of characters
  const characters = inputString.split('');

  // Iterate through substrings of different lengths starting with the largest possible string
  for (let i = 0; i < characters.length; i++) {
    for (let j = characters.length - 1; j > i; j--) {
      const substring = inputString.slice(i, j);

      // given the next substring, determine if it matches a word in the provided dictionary
      if (dictionary.includes(substring.toLowerCase())) {
        console.log(`found word '${substring}' in '${inputString}'`)
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
  const fs = require('fs');
  const wordListPath = require('word-list');
  const dictionary = fs.readFileSync(wordListPath, 'utf8').split('\n');

  // filter out words shorter than 4 characters
  const filteredDictionary = dictionary.filter((word) => { return word.length >= 4 && word.length <= 12 });
  return filteredDictionary
}

function generateVanityNumbers(phoneNumber) {
  // setup keypad mapping
  const keypadMapping = {
    '2': 'ABC',
    '3': 'DEF',
    '4': 'GHI',
    '5': 'JKL',
    '6': 'MNO',
    '7': 'PQRS',
    '8': 'TUV',
    '9': 'WXYZ',
  };

  // start generating possible vanity numbers using a recursive function
  const vanityNumbers = [];

  const generateCombinations = (index, currentVanity) => {
    // define the recursion stopping condition
    if (index === phoneNumber.length) {
      vanityNumbers.push(currentVanity);
      return;
    }

    // since '0' and '1' do not have letters associated with them, skip them when they occur
    const digit = phoneNumber[index];
    if (digit === '0' || digit === '1') {
      generateCombinations(index + 1, currentVanity + digit);
      return;
    }

    // otherwise, generate a combination for each of the letters associated with this number
    const letters = keypadMapping[digit];
    for (const letter of letters) {
      generateCombinations(index + 1, currentVanity + letter);
    }
    return;
  };

  generateCombinations(0, '');

  return vanityNumbers;
}

const phoneNumber = '1-800-123-4567';
main(phoneNumber)
