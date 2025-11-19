import { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import { pdfjs } from 'react-pdf'
import './index.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import App from './App.tsx'

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

// Set worker for react-pdf v7
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

// Note: Test hooks will be set up after App mounts since we need EditorContext
// This will be handled in a component if needed

ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById('root')!,
)
