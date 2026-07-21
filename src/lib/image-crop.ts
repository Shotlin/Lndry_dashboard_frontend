export interface PixelCrop {
  x: number
  y: number
  width: number
  height: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (err) => reject(err))
    image.crossOrigin = "anonymous"
    image.src = src
  })
}

/** Renders the user's crop selection to a fixed-size JPEG File at the same
 * aspect ratio the crop dialog was locked to, ready to upload. Square
 * callers (aspect 1, the original use case — category/subcategory images)
 * get the previous 800×800 output unchanged. Non-square callers (e.g.
 * banners at aspect 2) get a canvas sized to match that ratio exactly —
 * previously this always rendered into an 800×800 square canvas regardless
 * of `aspect`, silently squashing every landscape crop into a square and
 * then relying on the backend's Cloudinary transform to force-crop it back
 * to 2:1, which is what was cutting off banner content. */
export async function cropImageToFile(
  imageSrc: string,
  crop: PixelCrop,
  fileName: string,
  aspect = 1
): Promise<File> {
  const baseSize = 800
  const outputWidth = aspect >= 1 ? Math.round(baseSize * aspect) : baseSize
  const outputHeight = aspect >= 1 ? baseSize : Math.round(baseSize / aspect)

  const image = await loadImage(imageSrc)
  const canvas = document.createElement("canvas")
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is not supported in this browser")

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputWidth,
    outputHeight
  )

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92)
  )
  if (!blob) throw new Error("Failed to render the cropped image")

  const baseName = fileName.replace(/\.[^.]+$/, "") || "image"
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" })
}
