import { useCallback, useEffect, useState } from 'react'
import type { TaskApi } from '../api/taskApi'
import type { Task, TaskInput } from '../types'

export interface UseTasks {
  tasks: Task[]
  loading: boolean
  error: string | null
  create: (input: TaskInput) => Promise<void>
  update: (id: number, input: TaskInput) => Promise<void>
  complete: (id: number) => Promise<void>
  remove: (id: number) => Promise<void>
}

const messageOf = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')

/**
 * Owns the task list state. The server decides which tasks are visible (the
 * latest 5 incomplete ones), so every mutation re-fetches rather than patching
 * local state — the UI can never drift from the backend rule.
 *
 * Mutations rethrow so callers (e.g. the form) can react to validation errors,
 * while list-level failures are also surfaced through `error`.
 */
export function useTasks(api: TaskApi): UseTasks {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setTasks(await api.list())
      setError(null)
    } catch (e) {
      setError(messageOf(e))
    } finally {
      setLoading(false)
    }
  }, [api])

  // Initial load. The cancellation flag stops a late response from touching
  // state after unmount (or after `api` changes).
  useEffect(() => {
    let cancelled = false
    api
      .list()
      .then((list) => {
        if (cancelled) return
        setTasks(list)
        setError(null)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(messageOf(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api])

  const mutate = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action()
      } catch (e) {
        setError(messageOf(e))
        throw e
      }
      await refresh()
    },
    [refresh],
  )

  return {
    tasks,
    loading,
    error,
    create: (input) => mutate(() => api.create(input)),
    update: (id, input) => mutate(() => api.update(id, input)),
    complete: (id) => mutate(() => api.complete(id)),
    remove: (id) => mutate(() => api.remove(id)),
  }
}
