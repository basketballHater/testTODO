import type { Task } from '../types'
import { TaskCard } from './TaskCard'

interface Props {
  tasks: Task[]
  loading: boolean
  editingId: number | null
  onEdit: (task: Task) => void
  onComplete: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskList({ tasks, loading, editingId, onEdit, onComplete, onDelete }: Props) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-500">Loading tasks…</p>
  }

  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-base font-medium text-slate-700">You're all caught up!</p>
        <p className="mt-1 text-sm text-slate-500">Add a task using the form to get started.</p>
      </div>
    )
  }

  return (
    <ul aria-label="Tasks">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isEditing={task.id === editingId}
          onEdit={onEdit}
          onComplete={onComplete}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
