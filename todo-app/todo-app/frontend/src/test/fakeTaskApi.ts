import { vi } from 'vitest'
import { ApiError, type TaskApi } from '../api/taskApi'
import type { Task, TaskInput } from '../types'

export const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 1,
  title: 'Buy books',
  description: 'Buy books for the next school year',
  completed: false,
  createdAt: '2026-11-16T07:00:00.000000Z',
  ...overrides,
})

/**
 * In-memory TaskApi that mimics the backend rules (validation, completed tasks
 * hidden, only the latest 5 incomplete tasks listed) so UI tests exercise the
 * real user flows without a network.
 */
export function createFakeTaskApi(seed: Task[] = []) {
  let rows = [...seed]
  let nextId = Math.max(0, ...rows.map((t) => t.id)) + 1

  const api: TaskApi = {
    list: vi.fn(async () =>
      rows
        .filter((t) => !t.completed)
        .sort((a, b) => b.id - a.id)
        .slice(0, 5),
    ),
    create: vi.fn(async (input: TaskInput) => {
      if (!input.title) throw new ApiError('Invalid', 422, { title: ['The title field is required.'] })
      const task = makeTask({ id: nextId++, ...input })
      rows.push(task)
      return task
    }),
    update: vi.fn(async (id: number, input: TaskInput) => {
      const existing = rows.find((t) => t.id === id)
      if (!existing) throw new ApiError('Not found', 404)
      Object.assign(existing, input)
      return existing
    }),
    complete: vi.fn(async (id: number) => {
      const existing = rows.find((t) => t.id === id)
      if (!existing) throw new ApiError('Not found', 404)
      existing.completed = true
    }),
    remove: vi.fn(async (id: number) => {
      rows = rows.filter((t) => t.id !== id)
    }),
  }

  return api
}
