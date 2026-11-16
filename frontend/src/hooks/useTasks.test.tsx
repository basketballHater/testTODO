import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/taskApi'
import { createFakeTaskApi, makeTask } from '../test/fakeTaskApi'
import { useTasks } from './useTasks'

describe('useTasks', () => {
  it('loads tasks on mount', async () => {
    const api = createFakeTaskApi([makeTask({ id: 1 }), makeTask({ id: 2, title: 'Two' })])
    const { result } = renderHook(() => useTasks(api))

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tasks.map((t) => t.id)).toEqual([2, 1])
  })

  it('re-fetches after creating so the server decides what is visible', async () => {
    const api = createFakeTaskApi()
    const { result } = renderHook(() => useTasks(api))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(() => result.current.create({ title: 'New', description: '' }))

    expect(api.list).toHaveBeenCalledTimes(2)
    expect(result.current.tasks).toHaveLength(1)
  })

  it('removes a task from the list once it is completed', async () => {
    const api = createFakeTaskApi([makeTask({ id: 1 })])
    const { result } = renderHook(() => useTasks(api))
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))

    await act(() => result.current.complete(1))

    expect(result.current.tasks).toHaveLength(0)
  })

  it('removes a task from the list once it is deleted', async () => {
    const api = createFakeTaskApi([makeTask({ id: 1 })])
    const { result } = renderHook(() => useTasks(api))
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))

    await act(() => result.current.remove(1))

    expect(result.current.tasks).toHaveLength(0)
  })

  it('exposes load failures through `error`', async () => {
    const api = createFakeTaskApi()
    api.list = vi.fn().mockRejectedValue(new ApiError('Server exploded', 500))
    const { result } = renderHook(() => useTasks(api))

    await waitFor(() => expect(result.current.error).toBe('Server exploded'))
    expect(result.current.loading).toBe(false)
  })

  it('rethrows mutation errors so callers can react', async () => {
    const api = createFakeTaskApi()
    const { result } = renderHook(() => useTasks(api))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(act(() => result.current.create({ title: '', description: '' }))).rejects.toBeInstanceOf(ApiError)
  })
})
