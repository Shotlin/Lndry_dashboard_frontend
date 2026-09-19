/** Help & FAQ entry — camelCase (backend formats via _format()) */
export interface HelpFaq {
  id: string
  question: string
  answer: string
  sortOrder: number
  isActive: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateHelpFaqPayload {
  question: string
  answer: string
  sortOrder?: number
  isActive?: boolean
}

export type UpdateHelpFaqPayload = Partial<CreateHelpFaqPayload>
