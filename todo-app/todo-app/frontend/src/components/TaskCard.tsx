import type { Task } from '../types'

interface Props {
  task: Task
  isEditing: boolean
  onEdit: (task: Task) => void
  onComplete: (task: Task) => void
  onDelete: (task: Task) => void
}

const actionBase =
  'rounded-md px-2 py-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1'

export function TaskCard({ task, isEditing, onEdit, onComplete, onDelete }: Props) {
  return (
    <li
      data-testid="task-card"
      className={`animate-card-in border-b border-slate-200 py-3 last:border-b-0 ${
        isEditing ? 'rounded-lg bg-brand-50 px-3' : ''
      }`}
    >
      <h3 className="break-words text-base font-semibold text-slate-900">{task.title}</h3>
      {task.description && <p className="mt-0.5 break-words text-sm text-slate-600">{task.description}</p>}
      <div className="mt-1.5 flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Edit ${task.title}`}
          className={`${actionBase} text-sky-700 hover:bg-sky-50 focus-visible:ring-sky-500`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onComplete(task)}
          aria-label={`Mark ${task.title} as done`}
          className={`${actionBase} text-emerald-700 hover:bg-emerald-50 focus-visible:ring-emerald-500`}
        >
          Done
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label={`Delete ${task.title}`}
          className={`${actionBase} text-red-700 hover:bg-red-50 focus-visible:ring-red-500`}
        >
          Delete
        </button>
      </div>
    </li>
  )
}
