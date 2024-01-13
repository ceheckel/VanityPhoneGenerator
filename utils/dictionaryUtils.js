import fs from 'node:fs'
import wordListPath from 'word-list'

export default function () {
  // get the list of words from the word-list package
  const dictionary = fs.readFileSync(wordListPath, 'utf8').split('\n')

  // filter out words shorter than 4 characters
  const filteredDictionary = dictionary.filter((word) => {
    return word.length >= 4 && word.length <= 12
  })

  return filteredDictionary
}
