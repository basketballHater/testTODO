export interface Task {
  id: number
  title: string
  description: string
  completed: boolean
  createdAt: string
}

export interface TaskInput {
  title: string
  description: string
}

/** Field-level validation messages returned by the API (HTTP 422). */
export type FieldErrors = Partial<Record<keyof TaskInput, string[]>>
