import api from "@/lib/api"
import type { ApiResponse } from "@/types"

export interface GarmentTypeAdmin {
  id: string
  name: string
  slug: string
  category_id: string | null
  category_name: string | null
  unit: string
  cost_price: number | null
  thumbnail_url: string | null
  is_active: boolean
  created_at: string
}

export interface CreateGarmentTypePayload {
  name: string
  categoryId: string
  unit: "kg" | "piece"
  costPrice?: number
  thumbnailUrl?: string
  isActive?: boolean
}

export interface UpdateGarmentTypePayload {
  name?: string
  categoryId?: string
  unit?: "kg" | "piece"
  costPrice?: number
  thumbnailUrl?: string
  isActive?: boolean
}

function normalizeGarmentType(row: GarmentTypeAdmin): GarmentTypeAdmin {
  return {
    ...row,
    // Postgres numeric columns arrive as strings over JSON — coerce once
    // here so every consumer gets a real number, never string concatenation.
    cost_price: row.cost_price == null ? null : Number(row.cost_price),
  }
}

export const garmentTypesService = {
  async getAll(categoryId?: string): Promise<GarmentTypeAdmin[]> {
    const { data } = await api.get<ApiResponse<GarmentTypeAdmin[]>>("/garment-types", {
      params: { limit: 100, ...(categoryId ? { category: categoryId } : {}) },
    })
    return Array.isArray(data.data) ? data.data.map(normalizeGarmentType) : []
  },

  async create(payload: CreateGarmentTypePayload): Promise<GarmentTypeAdmin> {
    const { data } = await api.post<ApiResponse<GarmentTypeAdmin>>("/garment-types", payload)
    return normalizeGarmentType(data.data)
  },

  async update(id: string, payload: UpdateGarmentTypePayload): Promise<GarmentTypeAdmin> {
    const { data } = await api.put<ApiResponse<GarmentTypeAdmin>>(`/garment-types/${id}`, payload)
    return normalizeGarmentType(data.data)
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/garment-types/${id}`)
  },
}
