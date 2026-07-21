// Stub service for backwards compatibility of remaining product-related components (e.g., reviews page).
import api from "@/lib/api"
import type { ApiResponse } from "@/types"

export async function getProducts(filters: any): Promise<any> {
  return {
    products: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 }
  }
}

export async function getProductDetail(id: string): Promise<any> {
  return null
}

export async function createProduct(payload: any): Promise<any> {
  return null
}

export async function updateProduct(id: string, payload: any): Promise<any> {
  return null
}

export async function updateProductStock(id: string, stock: number): Promise<any> {
  return null
}

export async function deleteProduct(id: string): Promise<any> {
  return null
}

export async function duplicateProduct(id: string): Promise<any> {
  return null
}

export async function exportProductsCsv(format: string): Promise<any> {
  return new Blob()
}

export async function bulkUpdateProducts(products: any): Promise<any> {
  return { updated: [] }
}
