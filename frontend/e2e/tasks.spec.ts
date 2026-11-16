import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

/** Delete every task through the API so each test starts from an empty database. */
async function resetTasks(request: APIRequestContext) {
  // The list endpoint only returns 5 at a time, so keep going until it is empty.
  for (let guard = 0; guard < 100; guard++) {
    const { data } = await (await request.get('/api/tasks')).json()
    if (data.length === 0) return
    for (const task of data) await request.delete(`/api/tasks/${task.id}`)
  }
  throw new Error('Could not empty the task table')
}

async function addTask(page: Page, title: string, description = '') {
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Description').fill(description)
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
}

const cards = (page: Page) => page.getByTestId('task-card')

test.beforeEach(async ({ page, request }) => {
  await resetTasks(request)
  await page.goto('/')
  await expect(page.getByText(/all caught up/i)).toBeVisible()
})

test('creates a task and keeps it after a reload', async ({ page }) => {
  await addTask(page, 'Buy books', 'Buy books for the next school year')

  await expect(page.getByText('Buy books for the next school year')).toBeVisible()
  // the form is cleared, ready for the next task
  await expect(page.getByLabel('Title')).toHaveValue('')

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Buy books' })).toBeVisible()
})

test('shows a validation error instead of creating a task without a title', async ({ page }) => {
  await page.getByRole('button', { name: 'Add', exact: true }).click()

  await expect(page.getByRole('alert')).toHaveText('Title is required.')
  await expect(cards(page)).toHaveCount(0)
})

test('edits the title and description of an existing task', async ({ page }) => {
  await addTask(page, 'Clean home', 'Need to clean the bedroom')

  await page.getByRole('button', { name: 'Edit Clean home' }).click()
  await expect(page.getByLabel('Title')).toHaveValue('Clean home')

  await page.getByLabel('Title').fill('Clean the kitchen')
  await page.getByLabel('Description').fill('Dishes first')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByRole('heading', { name: 'Clean the kitchen' })).toBeVisible()
  await expect(page.getByText('Dishes first')).toBeVisible()
  await expect(page.getByText('Clean home')).toHaveCount(0)
  await expect(cards(page)).toHaveCount(1)

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Clean the kitchen' })).toBeVisible()
})

test('marking a task as done removes it from the list for good', async ({ page }) => {
  await addTask(page, 'Takehome assignment', 'Finish the mid-term assignment')

  await page.getByRole('button', { name: 'Mark Takehome assignment as done' }).click()

  await expect(cards(page)).toHaveCount(0)
  await page.reload()
  await expect(page.getByText(/all caught up/i)).toBeVisible()
})

test('deleting a task removes it permanently', async ({ page }) => {
  await addTask(page, 'Play Cricket', 'Plan the soft ball match on Sunday')

  await page.getByRole('button', { name: 'Delete Play Cricket' }).click()

  await expect(cards(page)).toHaveCount(0)
  await page.reload()
  await expect(page.getByText(/all caught up/i)).toBeVisible()
})

test('only the 5 most recent incomplete tasks are shown, newest first', async ({ page }) => {
  for (let n = 1; n <= 6; n++) await addTask(page, `Task ${n}`)

  await expect(cards(page)).toHaveCount(5)
  await expect(page.getByRole('heading', { name: 'Task 1', exact: true })).toHaveCount(0)
  await expect(cards(page).first()).toContainText('Task 6')
  await expect(cards(page).last()).toContainText('Task 2')

  // finishing the newest task lets the oldest one back into the top five
  await page.getByRole('button', { name: 'Mark Task 6 as done' }).click()
  await expect(page.getByRole('heading', { name: 'Task 1', exact: true })).toBeVisible()
  await expect(cards(page)).toHaveCount(5)
})

test('cancelling an edit returns the form to "add" mode', async ({ page }) => {
  await addTask(page, 'Help Saman')

  await page.getByRole('button', { name: 'Edit Help Saman' }).click()
  await page.getByRole('button', { name: 'Cancel' }).click()

  await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeVisible()
  await expect(page.getByLabel('Title')).toHaveValue('')
})
