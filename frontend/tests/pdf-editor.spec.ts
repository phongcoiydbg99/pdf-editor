import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect } from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..')
const pdfPath = path.join(workspaceRoot, 'de-nghi-thanh-toan-707.pdf')
const imagePath = path.join(workspaceRoot, 'tests/fixtures/signature.png')

declare global {
  interface Window {
    __PDF_EDITOR_TEST_HOOKS__?: {
      placeImageOnPage: (payload: {
        imageId: string
        pageIndex: number
        x: number
        y: number
        widthRatio: number
      }) => void
      getState: () => {
        images: { id: string }[]
        placements: { id: string }[]
      }
    }
  }
}

test.describe('React PDF editor happy path', () => {
  test('uploads sample PDF and places an image on the canvas', async ({ page }) => {
    await page.goto('/')

    await page.setInputFiles('input[accept="application/pdf"]', pdfPath)

    const documentLocator = page.locator('.react-pdf__Document')
    await expect(documentLocator).toBeVisible({ timeout: 15_000 })

    const canvasLocator = documentLocator.locator('canvas')
    await expect(canvasLocator).toHaveCount(1, { timeout: 15_000 })
    await expect(canvasLocator.first()).toBeVisible()
    await expect(page.getByText('Không thể hiển thị PDF này.')).toHaveCount(0)

    const imageInput = page.locator('[data-testid="image-upload-input"]')
    await imageInput.setInputFiles(imagePath)

    const libraryItem = page.locator('aside .cursor-grab').filter({ hasText: 'signature.png' }).first()
    await expect(libraryItem).toBeVisible()

    const imageId = await page.evaluate(() => {
      const state = window.__PDF_EDITOR_TEST_HOOKS__?.getState()
      return state?.images.at(-1)?.id
    })
    expect(imageId).toBeTruthy()
    await page.evaluate(
      ({ imageId: targetId }) => {
        if (!targetId) return
        window.__PDF_EDITOR_TEST_HOOKS__?.placeImageOnPage({
          imageId: targetId,
          pageIndex: 0,
          x: 0.5,
          y: 0.5,
          widthRatio: 0.2,
        })
      },
      { imageId },
    )

    const saveButton = page.getByRole('button', { name: 'Lưu PDF' })
    await expect(saveButton).toBeEnabled()
    const downloadPromise = page.waitForEvent('download')
    await saveButton.click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('-edited.pdf')
  })
})

