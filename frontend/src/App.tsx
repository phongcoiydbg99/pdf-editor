import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TopBar } from './components/TopBar'
import { ImageLibrary } from './components/ImageLibrary'
import { PdfWorkspace } from './components/PdfWorkspace'

const App = () => (
  <DndProvider backend={HTML5Backend}>
    <div className="flex min-h-screen flex-col bg-pdf-dark text-white">
      <TopBar />
      <div className="flex flex-1 items-start">
        <ImageLibrary />
        <PdfWorkspace />
      </div>
    </div>
  </DndProvider>
)

export default App
