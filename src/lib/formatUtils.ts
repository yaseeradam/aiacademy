/**
 * Formatting utilities for ensuring clean Title Case and proper casing
 * across exported CSV and Excel files.
 */

// Common words that remain lowercase in titles/addresses unless they start the text
const LOWERCASE_WORDS = new Set([
  'and', 'or', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'na', 'da', 'ta'
]);

/**
 * Format a person's name into clean Title Case, standardizing Northern Nigerian/Hausa
 * name abbreviations (e.g. "Muh,d", "muh'd", "muh.d" -> "Muhammad") and apostrophes.
 */
export function formatPersonName(name: string | undefined | null): string {
  if (!name || typeof name !== 'string') return '';
  let cleaned = name.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';

  // Standardize common typos / abbreviations
  cleaned = cleaned.replace(/\bmuh[,.'`]?d\b/gi, 'Muhammad');
  cleaned = cleaned.replace(/\bshu[,.]aibu\b/gi, "Shu'aibu");
  cleaned = cleaned.replace(/\bhauwa[,.]u\b/gi, "Hauwa'u");
  cleaned = cleaned.replace(/\bsama[,.]ila\b/gi, "Sama'ila");
  cleaned = cleaned.replace(/\bsa[,.]idu\b/gi, "Sa'idu");
  cleaned = cleaned.replace(/\brabi[,.]u\b/gi, "Rabi'u");
  cleaned = cleaned.replace(/\bta[,.]ololo\b/gi, "Ta'ololo");

  return cleaned.split(' ').map((word) => {
    if (!word) return '';

    // Handle hyphenated compound names (e.g. "Al-kasim" -> "Al-Kasim")
    return word.split('-').map((hyphenPart) => {
      // Handle apostrophes (e.g. "Sa'id", "Hauwa'u")
      return hyphenPart.split(/['’]/).map((sub, idx) => {
        if (!sub) return '';
        // If single trailing letter like 'u, 'd, or common subpart 'aibu, keep lowercase
        const lowerSub = sub.toLowerCase();
        if (idx > 0 && (sub.length === 1 || ['aibu', 'idu', 'ila'].includes(lowerSub))) {
          return lowerSub;
        }
        return sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
      }).join("'");
    }).join('-');
  }).join(' ');
}

/**
 * Format general text (addresses, descriptions, notes) into Title Case while
 * preserving common abbreviations.
 */
export function formatTitleCase(str: string | undefined | null): string {
  if (!str || typeof str !== 'string') return '';
  let cleaned = str.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';

  // Fix common address shorthand
  cleaned = cleaned
    .replace(/\bf\|tank\b/gi, 'Farin Tanki')
    .replace(/\bt\/wada\b/gi, 'Tudun Wada')
    .replace(/\barg\b/gi, 'Argungu')
    .replace(/\bkc\b/gi, 'KC');

  return cleaned.split(' ').map((word, index) => {
    if (!word) return '';
    const lower = word.toLowerCase();

    // Preserve known acronyms in uppercase (e.g. KC, LGA, No, No:)
    if (['kc', 'lga', 'pmb'].includes(lower)) {
      return word.toUpperCase();
    }
    if (/^no:?\d*$/i.test(word)) {
      return word.toUpperCase();
    }

    if (index > 0 && LOWERCASE_WORDS.has(lower)) {
      return lower;
    }

    return word.split('-').map((hyphenPart) => {
      return hyphenPart.split(/['’]/).map((sub, idx) => {
        if (!sub) return '';
        if (idx > 0 && sub.length === 1) return sub.toLowerCase();
        return sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
      }).join("'");
    }).join('-');
  }).join(' ');
}

/**
 * Clean and standardize Religion field: 'Islam' or 'Christianity'
 */
export function formatReligion(rel: string | undefined | null): string {
  if (!rel) return 'Islam';
  const lower = rel.toLowerCase().trim();
  if (lower.includes('islam') || lower.includes('muslim')) return 'Islam';
  if (lower.includes('christ')) return 'Christianity';
  return formatTitleCase(rel);
}

/**
 * Clean and standardize Nationality field: 'Nigerian'
 */
export function formatNationality(nat: string | undefined | null): string {
  if (!nat) return 'Nigerian';
  const lower = nat.toLowerCase().trim();
  if (lower.includes('nigeria') || lower.includes('nigeris') || lower.includes('kebbi')) {
    return 'Nigerian';
  }
  return formatTitleCase(nat);
}

/**
 * Format class name into proper Title Case (e.g. "basic 1" -> "Basic 1", "nursery 2" -> "Nursery 2")
 */
export function formatClassName(className: string | undefined | null): string {
  if (!className) return 'Nursery 1';
  return className
    .trim()
    .replace(/^primary\s+/i, 'Basic ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format section/arm name (e.g. "gold 2" -> "Gold 2", "silver" -> "Silver")
 */
export function formatSectionName(sectionName: string | undefined | null): string {
  if (!sectionName) return 'Gold';
  return sectionName
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
