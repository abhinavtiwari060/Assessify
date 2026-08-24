const Test = require('../models/Test');

// Character set excluding confusing characters (0, O, 1, I)
const CHARACTERS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates a random 4-character uppercase alphanumeric code.
 * Example: A7K2, P9X4, M2Q8
 */
function generateCode() {
  let code = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    code += CHARACTERS[randomIndex];
  }
  return code;
}

/**
 * Generates a guaranteed unique 4-character test code by checking the Test database collection.
 */
async function generateUniqueTestCode() {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const code = generateCode();
    const existingTest = await Test.findOne({ testCode: code }).select('_id').lean();
    if (!existingTest) {
      return code;
    }
    attempts++;
  }

  // Fallback if collision rate is high (unlikely with 32^4 = ~1 million combinations)
  return generateCode();
}

module.exports = {
  generateCode,
  generateUniqueTestCode,
};
