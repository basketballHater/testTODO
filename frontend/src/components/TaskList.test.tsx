import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeTask } from '../test/fakeTaskApi'
import { TaskList } from './TaskList'

const handlers = { onEdit: vi.fn(), onComplete: vi.fn(), onDelete: vi.fn() }

describe('TaskList', () => {
  it('renders a card per task', () => {
    const tasks = [makeTask({ id: 1, title: 'One' }), makeTask({ id: 2, title: 'Two' })]
    render(<TaskList tasks={tasks} loading={false} editingId={null} {...handlers} />)
    expect(screen.getAllByTestId('task-card')).toHaveLength(2)
  })

  it('shows a loading message while loading', () => {
    render(<TaskList tasks={[]} loading editingId={null} {...handlers} />)
    expect(screen.getByText(/loading tasks/i)).toBeInTheDocument()
  })

  it('shows an empty state when there are no tasks', () => {
    render(<TaskList tasks={[]} loading={false} editingId={null} {...handlers} />)
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument()
  })
})
