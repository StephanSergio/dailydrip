// Images are stored INLINE in the Firestore document as a resized base64 data
// URL — no Firebase Storage bucket (and therefore no Blaze billing) required.
// Firestore docs cap at ~1MB; an 800px JPEG is comfortably under that, and the
// AI stylist never receives photos (only item text), so this adds no AI cost.

const MAX_BYTES = 5 * 1024 * 1024 // 5MB source-file ceiling
const MAX_EDGE = 800 // longest side, px
const MAX_DOC_IMAGE_CHARS = 900_000 // keep well under Firestore's 1MB doc limit

export interface StoredPhoto {
  photoURL: string
  // Kept for the data model / delete flow. Always '' now (no Storage file).
  photoPath: string
}

export function validateImage(file: File | null | undefined): string | null {
  if (!file) return 'No file selected'
  if (!file.type.startsWith('image/')) return 'File must be an image'
  if (file.size > MAX_BYTES) return 'Image must be under 5MB'
  return null
}

// Resize the image so its longest side is at most MAX_EDGE, then encode it as a
// JPEG data URL, stepping quality down if needed to fit a Firestore document.
function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let width = img.width
      let height = img.height
      const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
      width = Math.round(width * scale)
      height = Math.round(height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)

      let quality = 0.82
      let dataUrl = canvas.toDataURL('image/jpeg', quality)
      while (dataUrl.length > MAX_DOC_IMAGE_CHARS && quality > 0.4) {
        quality -= 0.15
        dataUrl = canvas.toDataURL('image/jpeg', quality)
      }
      if (dataUrl.length > MAX_DOC_IMAGE_CHARS) {
        reject(new Error('Image is too detailed to store — try a simpler photo'))
        return
      }
      resolve(dataUrl)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image'))
    }
    img.src = url
  })
}

// Validate + resize a device photo into an inline data URL.
export async function uploadPhoto(file: File): Promise<StoredPhoto> {
  const error = validateImage(file)
  if (error) throw new Error(error)
  const photoURL = await resizeToDataUrl(file)
  return { photoURL, photoPath: '' }
}

// A pasted web image is stored as its direct link.
export async function importImageFromUrl(url: string): Promise<StoredPhoto> {
  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error('Enter a valid http(s) image URL')
  }
  return { photoURL: trimmed, photoPath: '' }
}

// Photos live inside the Firestore document, so they're removed when the doc is
// deleted — there's no separate Storage file to clean up. Kept for callers.
export async function deletePhoto(_photoPath: string): Promise<void> {
  // no-op
}
