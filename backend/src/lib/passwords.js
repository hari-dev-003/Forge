import crypto from 'crypto';

// Matches the app's strongPassword validator (validators/schemas.js): 8+
// chars, upper, lower, number, symbol.
const LOWER = 'abcdefghijkmnpqrstuvwxyz'; // no l/o — avoid look-alikes
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O
const DIGITS = '23456789'; // no 0/1
const SYMBOLS = '!@#$%^&*?';
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

const pick = (chars) => chars[crypto.randomInt(chars.length)];

/** A random temporary password guaranteed to satisfy the Cognito password policy. */
export function generateTempPassword(length = 12) {
  const required = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  const rest = Array.from({ length: length - required.length }, () => pick(ALL));
  const chars = [...required, ...rest];
  // Fisher-Yates shuffle so the required chars aren't always in the same spot.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export default generateTempPassword;
