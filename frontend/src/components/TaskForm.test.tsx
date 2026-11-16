import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/taskApi'
import { makeTask } from '../test/fakeTaskApi'
import { TaskForm, TITLE_MAX_LENGTH } from './TaskForm'

describe('TaskForm', () => {
  it('submits trimmed values and clears the fields in create mode', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TaskForm task={null} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Title'), '  Water plants  ')
    await userEvent.type(screen.getByLabelText('Description'), 'Balcony first')
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Water plants', description: 'Balcony first' })
    expect(screen.getByLabelText('Title')).toHaveValue('')
    expect(screen.getByLabelText('Description')).toHaveValue('')
  })

  it('blocks submission and shows an error when the title is blank', async () => {
    const onSubmit = vi.fn()
    render(<TaskForm task={null} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Title is required.')
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true')
  })

  it('rejects titles longer than the maximum length', async () => {
    const onSubmit = vi.fn()
    render(<TaskForm task={null} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Title'), 'x'.repeat(TITLE_MAX_LENGTH + 1))
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/may not be longer/i)
  })

  it('pre-fills the fields and shows Save / Cancel in edit mode', async () => {
    const onCancel = vi.fn()
    render(<TaskForm task={makeTask()} onSubmit={vi.fn()} onCancel={onCancel} />)

    expect(screen.getByLabelText('Title')).toHaveValue('Buy books')
    expect(screen.getByLabelText('Description')).toHaveValue('Buy books for the next school year')
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('keeps the entered values after saving an edit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TaskForm task={makeTask()} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.clear(screen.getByLabelText('Title'))
    await userEvent.type(screen.getByLabelText('Title'), 'Buy notebooks')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Buy notebooks',
      description: 'Buy books for the next school year',
    })
  })

  it('shows server-side validation errors', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError('Invalid', 422, { description: ['Description is too long.'] }))
    render(<TaskForm task={null} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Title'), 'Something')
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Description is too long.')
  })
})
