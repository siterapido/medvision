/**
 * Centralized phone number validation and normalization utilities
 * Handles E.164 format, WhatsApp validation, and international support
 */

/**
 * Normalizes a phone number to E.164 format
 * Handles Brazilian numbers and international formats
 *
 * @param phone - Raw phone number (can include special chars)
 * @param defaultCountry - Default country code if not specified (default: 'BR')
 * @returns Normalized phone in E.164 format (e.g., '5511999999999')
 */
export function normalizePhone(phone: string, defaultCountry: string = 'BR'): string {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '')

  if (!cleanPhone) {
    return ''
  }

  // If already starts with country code (1-3 digits), return as is
  if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
    // Check if it looks like it already has country code
    // Common country codes: 1 (US), 55 (BR), 44 (UK), 33 (FR), etc.
    if (defaultCountry === 'BR' && (cleanPhone.length === 11 || cleanPhone.length === 10)) {
      // Brazilian number without country code
      return `55${cleanPhone}`
    }

    if (defaultCountry === 'BR' && cleanPhone.startsWith('55')) {
      // Already has country code
      return cleanPhone
    }

    // For other countries, return as is (assume already has country code)
    return cleanPhone
  }

  // Invalid length
  return ''
}

/**
 * Validates if a phone number is in valid E.164 format for WhatsApp
 * WhatsApp requires: +55XXXXXXXXXXX (Brazil example)
 *
 * @param phone - Phone number to validate
 * @returns true if phone is valid for WhatsApp
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  const normalized = normalizePhone(phone)

  if (!normalized) {
    return false
  }

  // WhatsApp requires: country code (1-3 digits) + national number (6-14 digits)
  // Total: 7-15 digits after normalization
  if (normalized.length < 7 || normalized.length > 15) {
    return false
  }

  // Must be all digits
  if (!/^\d+$/.test(normalized)) {
    return false
  }

  return true
}

/**
 * Formats phone number for display (human-readable format)
 * Example: '5511999999999' -> '(11) 99999-9999'
 *
 * @param phone - Phone number in E.164 or normalized format
 * @returns Formatted phone for display
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhone(phone)

  if (!normalized) {
    return phone
  }

  // For Brazilian numbers (starts with 55)
  if (normalized.startsWith('55')) {
    const brazilianNumber = normalized.slice(2)

    if (brazilianNumber.length === 11) {
      // Format: (XX) 9XXXX-XXXX
      return `(${brazilianNumber.slice(0, 2)}) ${brazilianNumber.slice(2, 7)}-${brazilianNumber.slice(7)}`
    }

    if (brazilianNumber.length === 10) {
      // Format: (XX) XXXX-XXXX
      return `(${brazilianNumber.slice(0, 2)}) ${brazilianNumber.slice(2, 6)}-${brazilianNumber.slice(6)}`
    }
  }

  // For other formats, just return with plus
  return `+${normalized}`
}

/**
 * Extracts country code from phone number
 *
 * @param phone - Phone number to extract from
 * @returns Country code or null if not recognized
 */
export function extractCountryCode(phone: string): string | null {
  const normalized = normalizePhone(phone)

  if (!normalized) {
    return null
  }

  // Try to detect common country codes
  if (normalized.startsWith('1') && normalized.length === 11) {
    return '1' // USA/Canada
  }

  if (normalized.startsWith('55') && normalized.length === 12 && !normalized.startsWith('550')) {
    return '55' // Brazil
  }

  if (normalized.startsWith('44')) {
    return '44' // UK
  }

  if (normalized.startsWith('33')) {
    return '33' // France
  }

  if (normalized.startsWith('49')) {
    return '49' // Germany
  }

  // For 2-3 digit prefixes, assume they are country codes
  const potentialCountryCode = normalized.slice(0, 3)
  if (/^\d{2,3}$/.test(potentialCountryCode) && normalized.length > 7) {
    return potentialCountryCode
  }

  return null
}

/**
 * Checks if phone number appears to be from a specific country
 * Primarily for validation and regional features
 *
 * @param phone - Phone number to check
 * @param countryCode - Country code to check against (e.g., '55' for Brazil)
 * @returns true if phone appears to be from that country
 */
export function isPhoneFromCountry(phone: string, countryCode: string): boolean {
  const normalized = normalizePhone(phone)
  return normalized.startsWith(countryCode)
}

/**
 * Gets the national part of a phone number (without country code)
 *
 * @param phone - Phone number
 * @returns National part or empty string
 */
export function getNationalPart(phone: string): string {
  const normalized = normalizePhone(phone)

  if (!normalized) {
    return ''
  }

  // Extract country code and return national part
  const countryCode = extractCountryCode(phone)

  if (countryCode) {
    return normalized.slice(countryCode.length)
  }

  return normalized
}

/**
 * Adds country code to a national phone number
 * Useful for formatting incomplete numbers
 *
 * @param phone - National phone number (without country code)
 * @param countryCode - Country code to add (default: '55' for Brazil)
 * @returns Phone number with country code
 */
export function addCountryCode(phone: string, countryCode: string = '55'): string {
  const cleaned = phone.replace(/\D/g, '')

  if (!cleaned) {
    return ''
  }

  // If already has country code, return as is
  if (cleaned.startsWith(countryCode)) {
    return cleaned
  }

  return `${countryCode}${cleaned}`
}
