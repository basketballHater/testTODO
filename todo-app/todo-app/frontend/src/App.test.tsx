import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { createFakeTaskApi, makeTask } from './test/fakeTaskApi'

describe('App', () => {
  it('shows existing tasks', async () => {
    const api = createFakeTaskApi([makeTask({ id: 1, title: 'Clean home' })])
    render(<App api={api} />)

    expect(await screen.findByText('Clean home')).toBeInTheDocument()
  })

  it('creates a task through the form and shows it', async () => {
    render(<App api={createFakeTaskApi()} />)
    await screen.findByText(/all caught up/i)

    await userEvent.type(screen.getByLabelText('Title'), 'Play Cricket')
    await userEvent.type(screen.getByLabelText('Description'), 'Soft ball match on Sunday')
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByText('Play Cricket')).toBeInTheDocument()
    expect(screen.getByText('Soft ball match on Sunday')).toBeInTheDocument()
  })

  it('only shows the 5 most recent incomplete tasks', async () => {
    const seed = Array.from({ length: 7 }, (_, i) => makeTask({ id: i + 1, title: `Task ${i + 1}` }))
    render(<App api={createFakeTaskApi(seed)} />)

    expect(await screen.findAllByTestId('task-card')).toHaveLength(5)
    expect(screen.getByText('Task 7')).toBeInTheDocument()
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument()
  })

  it('edits a task: loads it in the form, saves, and returns to create mode', async () => {
    render(<App api={createFakeTaskApi([makeTask({ id: 1, title: 'Old title' })])} />)

    await userEvent.click(await screen.findByRole('button', { name: /edit old title/i }))
    expect(screen.getByLabelText('Title')).toHaveValue('Old title')

    await userEvent.clear(screen.getByLabelText('Title'))
    await userEvent.type(screen.getByLabelText('Title'), 'New title')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('New title')).toBeInTheDocument()
    expect(screen.queryByText('Old title')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue('')
  })

  it('cancelling an edit returns the form to create mode', async () => {
    render(<App api={createFakeTaskApi([makeTask()])} />)

    await userEvent.click(await screen.findByRole('button', { name: /edit buy books/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('hides a task once it is marked done, revealing an older one', async () => {
    const seed = Array.from({ length: 6 }, (_, i) => makeTask({ id: i + 1, title: `Task ${i + 1}` }))
    render(<App api={createFakeTaskApi(seed)} />)
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument()

    await userEvent.click(await screen.findByRole('button', { name: /mark task 6 as done/i }))

    expect(screen.queryByText('Task 6')).not.toBeInTheDocument()
    expect(await screen.findByText('Task 1')).toBeInTheDocument()
  })

  it('deletes a task permanently', async () => {
    render(<App api={createFakeTaskApi([makeTask({ id: 1, title: 'Doomed' })])} />)

    await userEvent.click(await screen.findByRole('button', { name: /delete doomed/i }))

    expect(await screen.findByText(/all caught up/i)).toBeInTheDocument()
  })

  it('leaves edit mode when the task being edited is deleted', async () => {
    render(<App api={createFakeTaskApi([makeTask({ id: 1, title: 'Doomed' })])} />)

    await userEvent.click(await screen.findByRole('button', { name: /edit doomed/i }))
    const card = screen.getByTestId('task-card')
    await userEvent.click(within(card).getByRole('button', { name: /delete doomed/i }))

    expect(await screen.findByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('shows an error banner when the API fails to load', async () => {
    const api = createFakeTaskApi()
    api.list = () => Promise.reject(new Error('Network down'))
    render(<App api={api} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Network down')
  })
})
