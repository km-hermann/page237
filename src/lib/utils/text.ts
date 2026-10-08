/**
 * Normalizes all-caps display text at render time without mutating underlying data.
 * If a string is entirely uppercase, it converts it to clean title case
 * while preserving acronyms, education level codes (e.g. "GCE", "A-LEVEL", "MCQ", "TI"),
 * and Roman numerals (e.g. "II", "IV"), with full support for French accents.
 *
 * Mixed-case strings are left untouched.
 *
 * Unit-style examples:
 * - formatDisplayText("MATHEMATIQUES POUR TERMINALE C")
 *   => "Mathématiques pour Terminale C"
 * - formatDisplayText("PHYSICS MCQ FOR GCE A-LEVEL VOL II")
 *   => "Physics MCQ for GCE A-Level Vol II"
 * - formatDisplayText("HERMANN MEA")
 *   => "Hermann Mea"
 * - formatDisplayText("Already Mixed Case Title")
 *   => "Already Mixed Case Title"
 */

const KNOWN_ACRONYMS = new Set([
  'GCE',
  'CGCE',
  'MCQ',
  'QCM',
  'TI',
  'A-LEVEL',
  'O-LEVEL',
  'BEPC',
  'CAP',
  'BAC',
  'BACC',
  'HND',
  'BTS',
  'ENS',
  'ENAM',
  'FMSB',
  'ICT',
  'SVT',
  'PC',
  'EPS',
  'ECM',
  'PDF',
])

const MINOR_WORDS = new Set([
  'de',
  'du',
  'des',
  'le',
  'la',
  'les',
  'un',
  'une',
  'et',
  'en',
  'au',
  'aux',
  'pour',
  'par',
  'sur',
  'dans',
  'd',
  'l',
  'a',
  'an',
  'the',
  'and',
  'or',
  'for',
  'of',
  'in',
  'on',
  'at',
  'to',
  'by',
  'with',
])

const ROMAN_NUMERAL_REGEX = /^(M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3}))$/i

function formatSubWord(subWord: string, isFirstWord: boolean, isLastWord: boolean): string {
  if (!subWord) return ''

  const upper = subWord.toUpperCase()

  // 1. Check known acronyms
  if (KNOWN_ACRONYMS.has(upper)) {
    return upper
  }

  // 2. Check Roman numerals (e.g. I, II, III, IV, V, VI, etc.)
  if (upper.length > 1 && ROMAN_NUMERAL_REGEX.test(upper)) {
    return upper
  }

  // 3. Single uppercase letters (e.g., class "C", series "A")
  if (upper.length === 1 && /^[A-Z]$/.test(upper)) {
    return upper
  }

  // 4. Minor words (articles/prepositions in English & French)
  const lower = subWord.toLowerCase()
  if (!isFirstWord && !isLastWord && MINOR_WORDS.has(lower)) {
    return lower
  }

  // 5. Standard Title Case with Unicode/accent support
  return upper.charAt(0) + lower.slice(1)
}

function formatSingleWord(word: string, isFirstWord: boolean, isLastWord: boolean): string {
  if (!word) return ''

  // Preserve hyphenated words, e.g. "A-LEVEL" or "CI-DESSUS"
  if (word.includes('-')) {
    const parts = word.split('-')
    const combinedUpper = word.toUpperCase()
    if (KNOWN_ACRONYMS.has(combinedUpper)) {
      return combinedUpper
    }
    return parts
      .map((part, index) => formatSubWord(part, isFirstWord && index === 0, isLastWord && index === parts.length - 1))
      .join('-')
  }

  // Preserve apostrophes, e.g. "D'HISTOIRE" => "d'Histoire" / "L'AFRIQUE" => "l'Afrique"
  if (word.includes("'")) {
    const parts = word.split("'")
    return parts
      .map((part, index) => {
        const lowerPart = part.toLowerCase()
        if (index === 0 && MINOR_WORDS.has(lowerPart)) {
          return isFirstWord ? formatSubWord(part, true, false) : lowerPart
        }
        return formatSubWord(part, false, isLastWord && index === parts.length - 1)
      })
      .join("'")
  }

  return formatSubWord(word, isFirstWord, isLastWord)
}

export function formatDisplayText(input?: string | null): string {
  if (!input || typeof input !== 'string') return ''

  const trimmed = input.trim()
  if (!trimmed) return ''

  // Check if string contains letters and if it has any lowercase letters
  const hasLetters = /\p{L}/u.test(trimmed)
  const hasLower = /\p{Ll}/u.test(trimmed)

  // If mixed case, all lowercase, or no letters, leave untouched
  if (!hasLetters || hasLower) {
    return trimmed
  }

  // Entirely uppercase: convert to balanced title case
  const segments = trimmed.split(/(\s+)/)
  const wordTokens = segments.filter((s) => !/^\s+$/.test(s))
  let wordIndex = 0

  return segments
    .map((chunk) => {
      if (/^\s+$/.test(chunk)) {
        return chunk
      }
      const isFirst = wordIndex === 0
      const isLast = wordIndex === wordTokens.length - 1
      const formatted = formatSingleWord(chunk, isFirst, isLast)
      wordIndex++
      return formatted
    })
    .join('')
}
