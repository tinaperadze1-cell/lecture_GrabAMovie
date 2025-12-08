/**
 * Profanity Filter Service
 * Filters and flags comments containing profanity
 */

const PROFANITY_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "damn",
  "crap",
  "bastard",
  "dick",
  "pussy",
  "slut",
  "cock",
  "prick",
  "motherfucker",
  "cunt",
  "faggot",
  "whore",
];

/**
 * Check if text contains profanity
 * @param {string} text - Text to check
 * @returns {Object} - { containsProfanity: boolean, flaggedWords: string[], originalText: string }
 */
function checkProfanity(text) {
  if (!text || typeof text !== "string") {
    return {
      containsProfanity: false,
      flaggedWords: [],
      originalText: text || "",
    };
  }

  const lowerText = text.toLowerCase();
  const flaggedWords = [];
  const wordPattern = /\b\w+\b/g;
  const words = text.match(wordPattern) || [];

  // Check each word against profanity list
  for (const word of words) {
    const lowerWord = word.toLowerCase();
    if (PROFANITY_WORDS.includes(lowerWord)) {
      flaggedWords.push(word);
    }
  }

  // Also check for profanity within words (e.g., "f*ck", "sh!t")
  for (const profanity of PROFANITY_WORDS) {
    // Create pattern that matches profanity with common character substitutions
    const pattern = new RegExp(
      profanity
        .split("")
        .map((char) => {
          // Match common substitutions: a->@, i->!, e->3, o->0, s->$, etc.
          const substitutions = {
            a: "[a@4]",
            e: "[e3]",
            i: "[i!1]",
            o: "[o0]",
            s: "[s$5]",
            t: "[t+]",
            l: "[l1]",
            z: "[z2]",
          };
          return substitutions[char.toLowerCase()] || char;
        })
        .join(""),
      "i"
    );

    if (pattern.test(lowerText) && !flaggedWords.includes(profanity)) {
      flaggedWords.push(profanity);
    }
  }

  return {
    containsProfanity: flaggedWords.length > 0,
    flaggedWords: [...new Set(flaggedWords)], // Remove duplicates
    originalText: text,
  };
}

/**
 * Replace profanity with asterisks
 * @param {string} text - Text to filter
 * @param {boolean} replaceWithStars - Whether to replace with *** or keep original
 * @returns {string} - Filtered text
 */
function filterProfanity(text, replaceWithStars = true) {
  if (!text || typeof text !== "string") {
    return text || "";
  }

  if (!replaceWithStars) {
    return text;
  }

  let filteredText = text;
  const wordPattern = /\b\w+\b/g;

  filteredText = filteredText.replace(wordPattern, (word) => {
    const lowerWord = word.toLowerCase();
    if (PROFANITY_WORDS.includes(lowerWord)) {
      return "***";
    }
    return word;
  });

  // Also handle character-substituted profanity
  for (const profanity of PROFANITY_WORDS) {
    const pattern = new RegExp(
      profanity
        .split("")
        .map((char) => {
          const substitutions = {
            a: "[a@4]",
            e: "[e3]",
            i: "[i!1]",
            o: "[o0]",
            s: "[s$5]",
            t: "[t+]",
            l: "[l1]",
            z: "[z2]",
          };
          return substitutions[char.toLowerCase()] || char;
        })
        .join(""),
      "gi"
    );

    filteredText = filteredText.replace(pattern, "***");
  }

  return filteredText;
}

/**
 * Get profanity check result with filtered text
 * @param {string} text - Text to check and filter
 * @returns {Object} - { containsProfanity, flaggedWords, originalText, filteredText }
 */
function checkAndFilter(text) {
  const checkResult = checkProfanity(text);
  return {
    ...checkResult,
    filteredText: filterProfanity(text, true),
  };
}

module.exports = {
  checkProfanity,
  filterProfanity,
  checkAndFilter,
  PROFANITY_WORDS,
};

