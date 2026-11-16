import { useState, type FormEvent } from 'react'
import { ApiError } from '../api/taskApi'
import type { FieldErrors, Task, TaskInput } from '../types'

export const TITLE_MAX_LENGTH = 255

interface Props {
  /** When set, the form edits this task; otherwise it creates a new one. */
  task: Task | null
  onSubmit: (input: TaskInput) => Promise<void>
  onCancel: () => void
}

const fieldClasses = (invalid: boolean) =>
  `mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 ${
    invalid
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
      : 'border-slate-300 focus:border-brand-600 focus:ring-brand-100'
  }`

export function TaskForm({ task, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const isEditing = task !== null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const input = { title: title.trim(), description: description.trim() }
    const clientErrors: FieldErrors = {}
    if (!input.title) clientErrors.title = ['Title is required.']
    else if (input.title.length > TITLE_MAX_LENGTH)
      clientErrors.title = [`Title may not be longer than ${TITLE_MAX_LENGTH} characters.`]

    if (clientErrors.title) {
      setErrors(clientErrors)
      return
    }

    setSubmitting(true)
    setErrors({})
    try {
      await onSubmit(input)
      if (!isEditing) {
        setTitle('')
        setDescription('')
      }
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fieldErrors)
    } finally {
      setSubmitting(false)
    }
  }

  const titleError = errors.title?.[0]
  const descriptionError = errors.description?.[0]

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={isEditing ? 'Edit task' : 'Add task'}>
      <h2 className="text-xl font-bold text-slate-900">Add / Edit a Task</h2>

      <div className="mt-5">
        <label htmlFor="task-title" className="block text-sm font-medium text-slate-600">
          Title
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={titleError ? true : undefined}
          aria-describedby={titleError ? 'task-title-error' : undefined}
          className={fieldClasses(Boolean(titleError))}
          autoComplete="off"
        />
        {titleError && (
          <p id="task-title-error" role="alert" className="mt-1 text-xs text-red-600">
            {titleError}
          </p>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="task-description" className="block text-sm font-medium text-slate-600">
          Description
        </label>
        <textarea
          id="task-description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={descriptionError ? true : undefined}
          aria-describedby={descriptionError ? 'task-description-error' : undefined}
          className={fieldClasses(Boolean(descriptionError))}
        />
        {descriptionError && (
          <p id="task-description-error" role="alert" className="mt-1 text-xs text-red-600">
            {descriptionError}
          </p>
        )}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isEditing ? 'Save' : 'Add'}
        </button>
      </div>
    </form>
  )
}
