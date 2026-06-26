import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase'

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_EDGE = 800 // longest side, px

export interface UploadedPhoto {
  photoURL: string
  photoPath: string
}

export function validateImage(file: File | null | undefined): string | null {
  if (!file) return 'No file selected'
  if (!file.type.startsWith('image/')) return 'File must be an image'
  if (file.size > MAX_BYTES) return 'Image must be under 5MB'
  return null
}

// Resize the image so its longest side is at most MAX_EDGE, via canvas.
// Returns a JPEG Blob.
export function resizeImage(file: File): Promise<Blob> {
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
export async function uploadPhoto(file: File): Promise<UploadedPhoto> {
  const error = validateImage(file)
  if (error) throw new Error(error)

  const blob = await resizeImage(file)
  const path = `wardrobe/${Date.now()}-${Math.round(performance.now())}.jpg`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  const photoURL = await getDownloadURL(storageRef)
  return { photoURL, photoPath: path }
}

// Import an image from a web URL. Tries to fetch it and re-host it in our own
// Storage (durable, immune to link rot / hotlink blocking). If the source
// blocks cross-origin fetches (CORS), falls back to storing the raw URL —
// photoPath is then empty, so deletePhoto() is a safe no-op for it.
export async function importImageFromUrl(url: string): Promise<UploadedPhoto> {
  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error('Enter a valid http(s) image URL')
  }
  try {
    const res = await fetch(trimmed)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) throw new Error('URL is not an image')
    if (blob.size > MAX_BYTES) throw new Error('Image is larger than 5MB')
    const ext = blob.type.split('/')[1] || 'jpg'
    const path = `wardrobe/${Date.now()}-${Math.round(performance.now())}.${ext}`
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, blob, { contentType: blob.type })
    const photoURL = await getDownloadURL(storageRef)
    return { photoURL, photoPath: path }
  } catch (e) {
    // Cross-origin fetch blocked or upload failed — keep the link itself.
    console.warn('Could not re-host image, using direct URL:', e)
    return { photoURL: trimmed, photoPath: '' }
  }
}

export async function deletePhoto(photoPath: string): Promise<void> {
  if (!photoPath) return
  try {
    await deleteObject(ref(storage, photoPath))
  } catch (e) {
    // Already gone or never existed — not fatal for a delete flow.
    console.warn('Could not delete storage file:', photoPath, (e as { code?: string })?.code)
  }
}
