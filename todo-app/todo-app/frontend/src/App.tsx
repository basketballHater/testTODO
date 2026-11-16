import { useState } from 'react'
import { taskApi, type TaskApi } from './api/taskApi'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'
import { useTasks } from './hooks/useTasks'
import type { Task, TaskInput } from './types'

interface Props {
  api?: TaskApi
}

export default function App({ api = taskApi }: Props) {
  const { tasks, loading, error, create, update, complete, remove } = useTasks(api)
  const [editing, setEditing] = useState<Task | null>(null)

  async function handleSubmit(input: TaskInput) {
    if (editing) {
      await update(editing.id, input)
      setEditing(null)
    } else {
      await create(input)
    }
  }

  async function handleComplete(task: Task) {
    await complete(task.id).catch(() => undefined)
    if (editing?.id === task.id) setEditing(null)
  }

  async function handleDelete(task: Task) {
    await remove(task.id).catch(() => undefined)
    if (editing?.id === task.id) setEditing(null)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-start justify-center px-4 py-10">
      <div className="w-full overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="border-b border-slate-200 bg-brand-50/60 p-6 md:border-b-0 md:border-r">
          {/* key resets the form's internal state whenever the target task changes */}
          <TaskForm
            key={editing?.id ?? 'new'}
            task={editing}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        </section>

        <section className="p-6" aria-label="Task list">
          {error && (
            <div role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <TaskList
            tasks={tasks}
            loading={loading}
            editingId={editing?.id ?? null}
            onEdit={setEditing}
            onComplete={handleComplete}
            onDelete={handleDelete}
          />
        </section>
      </div>
    </main>
  )
}
