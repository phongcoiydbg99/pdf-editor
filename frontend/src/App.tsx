import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { EditorProvider } from './state/editorStore'
import { TopBar } from './components/TopBar'
import { ImageLibrary } from './components/ImageLibrary'
import { PdfWorkspace } from './components/PdfWorkspace'

const App = () => (
  <EditorProvider>
    <DndProvider backend={HTML5Backend}>
      <div className="flex min-h-screen flex-col bg-pdf-dark text-white">
        <TopBar />
        <div className="flex flex-1 items-start">
          <ImageLibrary />
          <PdfWorkspace />
        </div>
      </div>
    </DndProvider>
  </EditorProvider>
)

export default App
