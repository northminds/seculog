/**
 * Redacts the middle of a name with asterisks, defaulting to ~50% redaction.
 *
 * Examples:
 *  - ANTHONY -> AN***NY (50% of 7 ≈ 3 stars)
 *  - JOHN -> J**N
 *  - AB -> A*
 *
 * @param {string} name - Input name/string to redact.
 * @param {number} fraction - Fraction of characters to redact (0..1). Defaults to 0.5.
 * @returns {string} Redacted string with middle replaced by '*'.
 */
function redactName(name, fraction = 0.5) {
  if (name == null) return '';
  const str = String(name);
  const len = str.length;
  if (len === 0) return '';

  // Normalize fraction
  if (!Number.isFinite(fraction)) fraction = 0.5;
  if (fraction <= 0) return str;
  if (fraction >= 1) return '*'.repeat(len);

  // Target number of redacted chars (at least 1 if len > 1)
  const targetRedact = Math.max(1, Math.floor(len * fraction));
  const keepTotal = Math.max(0, len - targetRedact);

  // Split kept chars roughly evenly between start and end
  let startKeep = Math.ceil(keepTotal / 2);
  let endKeep = Math.floor(keepTotal / 2);

  // Ensure at least one at each side for small strings (len >= 3)
  if (len >= 3) {
    if (startKeep === 0) startKeep = 1;
    if (endKeep === 0) endKeep = 1;
    // If we exceeded length due to forcing 1+1, trim from start/end keep
    let overflow = startKeep + endKeep + targetRedact - len;
    while (overflow > 0 && startKeep > 1) { startKeep--; overflow--; }
    while (overflow > 0 && endKeep > 1) { endKeep--; overflow--; }
    // If still overflow > 0, it means len is very small; remaining overflow
    // will reduce the redaction width implicitly below.
  }

  const start = str.slice(0, startKeep);
  const end = endKeep > 0 ? str.slice(len - endKeep) : '';
  const middleStars = '*'.repeat(Math.max(0, len - startKeep - endKeep));
  return start + middleStars + end;
}


/**
 * Redacts a phone number, keeping the first digit and last 4 digits visible,
 * and formatting as: "+<first> (***) ***-DD-DD".
 *
 * Examples:
 *  - "+7 (121) 312-31-23" -> "+7 (***) ***-31-23"
 *  - "71213123123" -> "+7 (***) ***-31-23"
 *  - "7-12" -> "+7 (***) ***-12" (best effort with short tails)
 *
 * @param {string} input - Raw phone input (digits and symbols allowed)
 * @returns {string} Redacted, reformatted phone string
 */
function redactPhone(input) {
  if (input == null) return '';
  const digits = String(input).replace(/\D+/g, '');
  if (digits.length === 0) return '';

  const first = digits[0];
  const last4 = digits.slice(-4);

  // Build tail: always show last 4 if available, split 2-2
  let tail = '';
  if (last4.length > 0) {
    if (last4.length <= 2) {
      tail = `-${last4}`;
    } else {
      tail = `-${last4.slice(0, 2)}-${last4.slice(2)}`;
    }
  }

  // Middle always masked with two 3-star groups, per examples
  return `+${first} (***) ***${tail}`;
}

module.exports = { redactName, redactPhone };
