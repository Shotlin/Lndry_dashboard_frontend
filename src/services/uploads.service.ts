import api from "@/lib/api"
import type { ApiResponse } from "@/types"
import type { UploadedFile, UploadedImage } from "@/types/upload.types"

type UploadProgressHandler = (progress: number) => void

/** Upload a single image to Cloudinary via backend. `folder` segments
 * different admin surfaces (e.g. "categories", "garment-types") into
 * distinct Cloudinary folders instead of one shared bucket. */
export async function uploadImage(
  file: File,
  onProgress?: UploadProgressHandler,
  folder?: string
): Promise<UploadedImage> {
  const formData = new FormData()
  // `folder` must precede `image` — the backend reads form fields off the
  // streaming multipart parser up to the file part, so fields declared
  // after it aren't seen.
  if (folder) formData.append("folder", folder)
  formData.append("image", file)

  const { data } = await api.post<ApiResponse<UploadedImage>>(
    "/uploads/image",
    formData,
    {
      onUploadProgress: (event) => {
        if (!onProgress) return
        const total = event.total ?? file.size
        const progress = total
          ? Math.round((event.loaded / total) * 100)
          : 0
        onProgress(progress)
      },
    }
  )
  return data.data
}

export async function uploadFile(
  file: File,
  onProgress?: UploadProgressHandler
): Promise<UploadedFile> {
  const formData = new FormData()
  formData.append("file", file)

  const { data } = await api.post<ApiResponse<UploadedFile>>(
    "/uploads/file",
    formData,
    {
      onUploadProgress: (event) => {
        if (!onProgress) return
        const total = event.total ?? file.size
        const progress = total
          ? Math.round((event.loaded / total) * 100)
          : 0
        onProgress(progress)
      },
    }
  )
  return data.data
}

/** Upload multiple images */
export async function uploadMultipleImages(files: File[]): Promise<UploadedImage[]> {
  const formData = new FormData()
  files.forEach((f) => formData.append("images", f))

  const { data } = await api.post<ApiResponse<UploadedImage[]>>(
    "/uploads/images",
    formData
  )
  return data.data
}

/** Delete an uploaded image. Accepts either a raw Cloudinary publicId or a
 * full delivery URL (whichever is on hand) — the backend normalizes either
 * shape before destroying the asset. */
export async function deleteImage(publicId: string) {
  const { data } = await api.delete<ApiResponse<null>>("/uploads/image", {
    data: { publicId },
  })
  return data.data
}

/** Bulk import products from CSV */
export async function bulkImportProducts(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const { data } = await api.post<
    ApiResponse<{ imported: number; skipped: number; errors: string[] }>
  >("/products/bulk-import", formData)
  return data.data
}

/** Create manual order (admin places order for a customer) */
export async function createManualOrder(payload: {
  userId: string
  items: { productId: string; quantity: number }[]
  paymentMethod?: "COD" | "MANUAL"
  deliveryAddress?: Record<string, unknown>
  couponCode?: string
}) {
  const { data } = await api.post<
    ApiResponse<{ id: string; order_number: string; total_amount: number }>
  >("/admin/orders/manual", payload)
  return data.data
}
