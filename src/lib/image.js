import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase'

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_EDGE = 800 // longest side, px

export function validateImage(file) {
  if (!file) return 'No file selected'
  if (!file.type.startsWith('image/')) return 'File must be an image'
  if (file.size > MAX_BYTES) return 'Image must be under 5MB'
  return null
}

// Resize the image so its longest side is at most MAX_EDGE, via canvas.
// Returns a JPEG Blob.
export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
      width = Math.round(width * scale)
      height = Math.round(height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Resize failed'))),
        'image/jpeg',
        0.85,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image'))
    }
    img.src = url
  })
}

// Validate, resize, and upload. Returns { photoURL, photoPath }.
export async function uploadPhoto(file) {
  const error = validateImage(file)
  if (error) throw new Error(error)

  const blob = await resizeImage(file)
  const path = `wardrobe/${Date.now()}-${Math.round(
    performance.now(),
  )}.jpg`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  const photoURL = await getDownloadURL(storageRef)
  return { photoURL, photoPath: path }
}

export async function deletePhoto(photoPath) {
  if (!photoPath) return
  try {
    await deleteObject(ref(storage, photoPath))
  } catch (e) {
    // Already gone or never existed — not fatal for a delete flow.
    console.warn('Could not delete storage file:', photoPath, e?.code)
  }
}
