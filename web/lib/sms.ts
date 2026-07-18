// SMS encoding helpers, shared by the send page, the bulk send flow and the
// reply composer so all three report segment counts identically.

export type SegmentInfo = {
  length: number
  segments: number
  perSegment: number
  // GSM-7 fits more per segment than UCS-2, which is needed for non-Latin
  // characters and most emoji.
  encoding: 'GSM-7' | 'UCS-2'
}

// Characters representable in the GSM 03.38 alphabet.
const GSM_7_CHARS =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"
const GSM_7_EXTENDED = '^{}\\[~]|€'

export function isGsm7(text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    const char = text.charAt(i)
    if (GSM_7_CHARS.indexOf(char) === -1 && GSM_7_EXTENDED.indexOf(char) === -1) {
      return false
    }
  }
  return true
}

/** Segment count for a message, so a user is not surprised by cost. */
export function getSegmentInfo(text: string): SegmentInfo {
  const gsm = isGsm7(text)
  const encoding = gsm ? 'GSM-7' : 'UCS-2'
  const single = gsm ? 160 : 70
  const multi = gsm ? 153 : 67
  const length = text.length

  if (length === 0) {
    return { length: 0, segments: 0, perSegment: single, encoding }
  }
  if (length <= single) {
    return { length, segments: 1, perSegment: single, encoding }
  }
  return {
    length,
    segments: Math.ceil(length / multi),
    perSegment: multi,
    encoding,
  }
}
