import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeTask } from '../test/fakeTaskApi'
import { TaskCard } from './TaskCard'

function setup(overrides = {}) {
  const task = makeTask()
  const handlers = { onEdit: vi.fn(), onComplete: vi.fn(), onDelete: vi.fn() }
  render(
    <ul>
      <TaskCard task={task} isEditing={false} {...handlers} {...overrides} />
    </ul>,
  )
  return { task, ...handlers }
}

describe('TaskCard', () => {
  it('shows the title and description', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Buy books' })).toBeInTheDocument()
    expect(screen.getByText('Buy books for the next school year')).toBeInTheDocument()
  })

  it('calls onEdit with the task when Edit is clicked', async () => {
    const { task, onEdit } = setup()
    await userEvent.click(screen.getByRole('button', { name: /edit buy books/i }))
    expect(onEdit).toHaveBeenCalledWith(task)
  })

  it('calls onComplete with the task when Done is clicked', async () => {
    const { task, onComplete } = setup()
    await userEvent.click(screen.getByRole('button', { name: /mark buy books as done/i }))
    expect(onComplete).toHaveBeenCalledWith(task)
  })

  it('calls onDelete with the task when Delete is clicked', async () => {
    const { task, onDelete } = setup()
    await userEvent.click(screen.getByRole('button', { name: /delete buy books/i }))
    expect(onDelete).toHaveBeenCalledWith(task)
  })

  it('omits the description paragraph when empty', () => {
    render(
      <ul>
        <TaskCard
          task={makeTask({ description: '' })}
          isEditing={false}
          onEdit={vi.fn()}
          onComplete={vi.fn()}
          onDelete={vi.fn()}
        />
      </ul>,
    )
    expect(screen.queryByText('Buy books for the next school year')).not.toBeInTheDocument()
  })
})
