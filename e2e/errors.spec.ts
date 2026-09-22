import { test, expect } from '@playwright/test'
import { FIXTURES, openEditor, openEditorWith, pickFiles, previewCanvas, waitForResult } from './helpers'

test('ERR-01 a corrupt PDF is reported in the preview and in its tab', async ({ page }) => {
  await openEditor(page)
  await pickFiles(page, FIXTURES.corrupt)
  const tab = page.getByRole('tab', { name: /corrupt/ })
  await expect(tab).toBeVisible()
  await expect(page.getByText(/Processing\.\.\./)).toHaveCount(0)
  await expect(page.getByRole('alert')).toContainText('This file could not be read')
  await expect(tab).toContainText('!')
  await expect(page.getByRole('button', { name: 'Download' })).toBeDisabled()
})

test('ERR-01 a password-protected PDF says so', async ({ page }) => {
  await openEditor(page)
  await pickFiles(page, FIXTURES.encrypted)
  await expect(page.getByRole('alert')).toContainText('password-protected')
})

test('ERR-01 the error is translated with the rest of the interface', async ({ page }) => {
  await openEditor(page, 'es')
  await pickFiles(page, FIXTURES.corrupt)
  await expect(page.getByRole('alert')).toContainText('No se pudo leer este archivo')
})

test('ERR-01 after a corrupt PDF the next document still works', async ({ page }) => {
  await openEditor(page)
  await pickFiles(page, FIXTURES.corrupt)
  await expect(page.getByRole('alert')).toBeVisible()

  await pickFiles(page, FIXTURES.png)
  await expect(page.getByRole('tab')).toHaveCount(2)
  await waitForResult(page)
  await expect(page.getByRole('button', { name: 'Download' })).toBeEnabled()

  // the failed document keeps its own error, the good one its result
  await page.getByRole('tab').first().click()
  await expect(page.getByRole('alert')).toContainText('This file could not be read')
  await page.getByRole('tab').nth(1).click()
  await expect(previewCanvas(page)).toBeVisible()

  // and a clean session afterwards is unaffected
  await openEditorWith(page, FIXTURES.pdf1)
  await expect(previewCanvas(page)).toBeVisible()
})

test('ERR-01 removing the failed document clears the error', async ({ page }) => {
  await openEditor(page)
  await pickFiles(page, [FIXTURES.corrupt, FIXTURES.png])
  // the corrupt one is the active tab, so the stage shows its error
  await expect(page.getByRole('alert')).toContainText('This file could not be read')
  await page.getByRole('button', { name: /^Remove corrupt/ }).click()
  await expect(page.getByRole('tab')).toHaveCount(1)
  await expect(page.getByText('This file could not be read')).toHaveCount(0)
  await expect(previewCanvas(page)).toBeVisible()
})
