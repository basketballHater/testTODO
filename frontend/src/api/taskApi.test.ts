import { describe, expect, it, vi } from 'vitest'
import { ApiError, createTaskApi } from './taskApi'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const dto = { id: 7, title: 'T', description: 'D', completed: false, created_at: '2026-11-16T00:00:00Z' }

describe('taskApi', () => {
  it('lists tasks and maps snake_case fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ data: [dto] }))
    const api = createTaskApi('/api', fetchMock)

    const tasks = await api.list()

    expect(fetchMock).toHaveBeenCalledWith('/api/tasks', expect.any(Object))
    expect(tasks).toEqual([
      { id: 7, title: 'T', description: 'D', completed: false, createdAt: '2026-11-16T00:00:00Z' },
    ])
  })

  it('POSTs JSON when creating', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ data: dto }, 201))
    const api = createTaskApi('/api', fetchMock)

    await api.create({ title: 'T', description: 'D' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/tasks')
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual({ title: 'T', description: 'D' })
  })

  it('PUTs to the task URL when updating', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ data: dto }))
    await createTaskApi('/api', fetchMock).update(7, { title: 'T', description: 'D' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/tasks/7')
    expect(init.method).toBe('PUT')
  })

  it('PATCHes the complete endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ data: { ...dto, completed: true } }))
    await createTaskApi('/api', fetchMock).complete(7)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/tasks/7/complete')
    expect(init.method).toBe('PATCH')
  })

  it('handles 204 No Content on delete', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    await expect(createTaskApi('/api', fetchMock).remove(7)).resolves.toBeUndefined()
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE')
  })

  it('throws ApiError carrying field errors on 422', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(json({ message: 'Invalid', errors: { title: ['The title field is required.'] } }, 422))

    const error = await createTaskApi('/api', fetchMock)
      .create({ title: '', description: '' })
      .catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(422)
    expect((error as ApiError).fieldErrors.title).toEqual(['The title field is required.'])
  })

  it('throws a generic ApiError when the body is not JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('boom', { status: 500 }))
    await expect(createTaskApi('/api', fetchMock).list()).rejects.toThrow(/status 500/)
  })
})
