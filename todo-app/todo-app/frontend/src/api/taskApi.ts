import type { FieldErrors, Task, TaskInput } from '../types'

/**
 * Abstraction the UI depends on (Dependency Inversion): components and hooks
 * never touch `fetch` directly, so tests can supply an in-memory fake.
 */
export interface TaskApi {
  list(): Promise<Task[]>
  create(input: TaskInput): Promise<Task>
  update(id: number, input: TaskInput): Promise<Task>
  complete(id: number): Promise<void>
  remove(id: number): Promise<void>
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors

  constructor(message: string, status: number, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

interface TaskDto {
  id: number
  title: string
  description: string
  completed: boolean
  created_at: string
}

const toTask = (dto: TaskDto): Task => ({
  id: dto.id,
  title: dto.title,
  description: dto.description,
  completed: dto.completed,
  createdAt: dto.created_at,
})

export function createTaskApi(baseUrl = '/api', fetchImpl: typeof fetch = (...args) => fetch(...args)): TaskApi {
  async function request(path: string, init: RequestInit = {}): Promise<unknown> {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })

    if (response.status === 204) return null

    const body = (await response.json().catch(() => null)) as {
      message?: string
      errors?: FieldErrors
      data?: unknown
    } | null

    if (!response.ok) {
      throw new ApiError(
        body?.message ?? `Request failed with status ${response.status}`,
        response.status,
        body?.errors ?? {},
      )
    }

    return body?.data ?? null
  }

  return {
    async list() {
      const data = (await request('/tasks')) as TaskDto[]
      return data.map(toTask)
    },
    async create(input) {
      const data = await request('/tasks', { method: 'POST', body: JSON.stringify(input) })
      return toTask(data as TaskDto)
    },
    async update(id, input) {
      const data = await request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(input) })
      return toTask(data as TaskDto)
    },
    async complete(id) {
      await request(`/tasks/${id}/complete`, { method: 'PATCH' })
    },
    async remove(id) {
      await request(`/tasks/${id}`, { method: 'DELETE' })
    },
  }
}

export const taskApi: TaskApi = createTaskApi(import.meta.env.VITE_API_BASE_URL ?? '/api')
