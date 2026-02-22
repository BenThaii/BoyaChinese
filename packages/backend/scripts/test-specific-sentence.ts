import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Test the specific sentence
const sentence = "我很高兴。那是在宿舍。在图书馆";
const vocabulary = [
  '我', '高兴', '那', '对', '美国', '吧', '宿舍', '书', '电影院'
];

console.log('=== Testing Specific Sentence ===');
console.log('Sentence:', sentence);
console.log('Vocabulary:', vocabulary);
console.log('');

// Remove punctuation
const chineseCharsOnly = sentence.replace(/[\s\p{P}]/gu, '');
console.log('Text without punctuation:', chineseCharsOnly);
console.log('');

// Sort by length (longest first)
const sortedVocab = [...vocabulary].sort((a, b) => b.length - a.length);
console.log('Sorted vocabulary (longest first):', sortedVocab);
console.log('');

// Greedy matching
const usedCharacters = [];
let remainingText = chineseCharsOnly;

console.log('=== Matching Process ===');
while (remainingText.length > 0) {
  let matched = false;
  
  for (const char of sortedVocab) {
    if (remainingText.startsWith(char)) {
      console.log(`Matched: "${char}" at position, remaining: "${remainingText}"`);
      if (!usedCharacters.includes(char)) {
        usedCharacters.push(char);
      }
      remainingText = remainingText.slice(char.length);
      matched = true;
      break;
    }
  }
  
  if (!matched) {
    console.log(`No match for: "${remainingText[0]}", skipping...`);
    remainingText = remainingText.slice(1);
  }
}

console.log('');
console.log('=== Result ===');
console.log('Used characters:', usedCharacters);
console.log('');
console.log('=== Analysis ===');
console.log('Characters in sentence but NOT in vocabulary:');
const allCharsInSentence = Array.from(new Set(chineseCharsOnly.split('')));
const notInVocab = allCharsInSentence.filter(char => {
  return !vocabulary.some(vocabItem => vocabItem.includes(char));
});
console.log('Single characters not in vocab:', notInVocab);

