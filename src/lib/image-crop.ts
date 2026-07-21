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

/** Renders the user's crop selection to a fixed-size square JPEG File,
 * ready to upload — this is what guarantees every category/subcategory
 * image ends up the same accurate dimensions regardless of what the
 * admin originally picked. */
export async function cropImageToFile(
  imageSrc: string,
  crop: PixelCrop,
  fileName: string,
  outputSize = 800
): Promise<File> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement("canvas")
  canvas.width = outputSize
  canvas.height = outputSize
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
    outputSize,
    outputSize
  )

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92)
  )
  if (!blob) throw new Error("Failed to render the cropped image")

  const baseName = fileName.replace(/\.[^.]+$/, "") || "image"
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" })
}
