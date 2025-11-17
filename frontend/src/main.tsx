import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { pdfjs } from 'react-pdf'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import './index.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import App from './App.tsx'
import { useEditorStore } from './state/editorStore.ts'
import { createId } from './utils/file.ts'

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

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

if (import.meta.env.DEV) {
  window.__PDF_EDITOR_TEST_HOOKS__ = {
    placeImageOnPage: ({ imageId, pageIndex, x, y, widthRatio }) => {
      const { addPlacement } = useEditorStore.getState().actions
      addPlacement({
        id: createId(),
        imageId,
        pageIndex,
        x,
        y,
        widthRatio,
      })
    },
    getState: () => {
      const state = useEditorStore.getState()
      return {
        images: state.images.map(({ id }) => ({ id })),
        placements: state.placements.map(({ id }) => ({ id })),
      }
    },
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
