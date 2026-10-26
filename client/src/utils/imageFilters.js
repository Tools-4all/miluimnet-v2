// פילטרים לתמונה, פיקסל אחרי פיקסל (בשביל עורך התמונות ב-Canvas).
// getImageData נותן מערך של כל הפיקסלים: [R,G,B,A, R,G,B,A, ...] - 4 מספרים (0-255) לכל פיקסל.
// משנים את המספרים ומציירים בחזרה עם putImageData.

export const FILTERS = {
  none: 'ללא',
  grayscale: 'שחור-לבן',
  sepia: 'ספיה',
  bright: 'בהיר',
  contrast: 'ניגודיות',
}

const clamp = (value) => Math.max(0, Math.min(255, value)) // צבע תמיד בין 0 ל-255

// מקבל פיקסל (r, g, b) ומחזיר את הצבעים החדשים שלו
const PIXEL_FILTERS = {
  // ממוצע משוקלל - העין רגישה יותר לירוק
  grayscale: (r, g, b) => {
    const gray = 0.3 * r + 0.59 * g + 0.11 * b
    return [gray, gray, gray]
  },
  sepia: (r, g, b) => [
    0.393 * r + 0.769 * g + 0.189 * b,
    0.349 * r + 0.686 * g + 0.168 * b,
    0.272 * r + 0.534 * g + 0.131 * b,
  ],
  bright: (r, g, b) => [r + 40, g + 40, b + 40],
  // מרחיק כל ערך מהאמצע (128) - הכהים מתכהים והבהירים מתבהרים
  contrast: (r, g, b) => [r, g, b].map((c) => 1.4 * (c - 128) + 128),
}

export function applyFilter(imageData, filter) {
  const pixelFilter = PIXEL_FILTERS[filter]
  if (!pixelFilter) return imageData
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    const [r, g, b] = pixelFilter(d[i], d[i + 1], d[i + 2])
    d[i] = clamp(r)
    d[i + 1] = clamp(g)
    d[i + 2] = clamp(b)
  }
  return imageData
}
