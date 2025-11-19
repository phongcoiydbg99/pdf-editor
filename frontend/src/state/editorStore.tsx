import { createContext, useContext, useReducer, useCallback } from 'react'
import type { ReactNode } from 'react'

export type PdfDocument = {
  name: string
  data: Uint8Array
}

export type UploadedImage = {
  id: string
  name: string
  mimeType: string
  dataUrl: string
  width: number
  height: number
}

export type ImagePlacement = {
  id: string
  imageId: string
  pageIndex: number
  x: number
  y: number
  widthRatio: number
}

type UiState = {
  isSaving: boolean
  error?: string
}

export type EditorState = {
  pdf?: PdfDocument
  images: UploadedImage[]
  placements: ImagePlacement[]
  ui: UiState
}

type EditorAction =
  | { type: 'SET_PDF'; payload: PdfDocument | undefined }
  | { type: 'ADD_IMAGES'; payload: UploadedImage[] }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'ADD_PLACEMENT'; payload: ImagePlacement }
  | { type: 'REMOVE_PLACEMENT'; payload: string }
  | { type: 'UPDATE_PLACEMENT'; payload: { id: string; updates: Partial<ImagePlacement> } }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'CLEAR_ALL' }

export const initialState: EditorState = {
  pdf: undefined,
  images: [],
  placements: [],
  ui: { isSaving: false },
}

export const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  switch (action.type) {
    case 'SET_PDF':
      return {
        ...state,
        pdf: action.payload,
        placements: [],
      }
    case 'ADD_IMAGES':
      return {
        ...state,
        images: [...state.images, ...action.payload],
      }
    case 'REMOVE_IMAGE':
      return {
        ...state,
        images: state.images.filter((img) => img.id !== action.payload),
        placements: state.placements.filter((placement) => placement.imageId !== action.payload),
      }
    case 'ADD_PLACEMENT':
      return {
        ...state,
        placements: [...state.placements, action.payload],
      }
    case 'REMOVE_PLACEMENT':
      return {
        ...state,
        placements: state.placements.filter((placement) => placement.id !== action.payload),
      }
    case 'UPDATE_PLACEMENT':
      return {
        ...state,
        placements: state.placements.map((placement) =>
          placement.id === action.payload.id
            ? { ...placement, ...action.payload.updates }
            : placement,
        ),
      }
    case 'SET_SAVING':
      return {
        ...state,
        ui: { ...state.ui, isSaving: action.payload },
      }
    case 'SET_ERROR':
      return {
        ...state,
        ui: { ...state.ui, error: action.payload },
      }
    case 'CLEAR_ALL':
      return initialState
    default:
      return state
  }
}

type EditorContextValue = {
  state: EditorState
  dispatch: (action: EditorAction) => void
  actions: {
    setPdf: (pdf: PdfDocument | undefined) => void
    addImages: (images: UploadedImage[]) => void
    removeImage: (imageId: string) => void
    addPlacement: (placement: ImagePlacement) => void
    removePlacement: (placementId: string) => void
    updatePlacement: (placementId: string, updates: Partial<ImagePlacement>) => void
    setSaving: (isSaving: boolean) => void
    setError: (error?: string) => void
    clearAll: () => void
  }
}

const EditorContext = createContext<EditorContextValue | undefined>(undefined)

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(editorReducer, initialState)

  const actions = {
    setPdf: useCallback((pdf: PdfDocument | undefined) => {
      dispatch({ type: 'SET_PDF', payload: pdf })
    }, []),
    addImages: useCallback((images: UploadedImage[]) => {
      dispatch({ type: 'ADD_IMAGES', payload: images })
    }, []),
    removeImage: useCallback((imageId: string) => {
      dispatch({ type: 'REMOVE_IMAGE', payload: imageId })
    }, []),
    addPlacement: useCallback((placement: ImagePlacement) => {
      dispatch({ type: 'ADD_PLACEMENT', payload: placement })
    }, []),
    removePlacement: useCallback((placementId: string) => {
      dispatch({ type: 'REMOVE_PLACEMENT', payload: placementId })
    }, []),
    updatePlacement: useCallback((placementId: string, updates: Partial<ImagePlacement>) => {
      dispatch({ type: 'UPDATE_PLACEMENT', payload: { id: placementId, updates } })
    }, []),
    setSaving: useCallback((isSaving: boolean) => {
      dispatch({ type: 'SET_SAVING', payload: isSaving })
    }, []),
    setError: useCallback((error?: string) => {
      dispatch({ type: 'SET_ERROR', payload: error })
    }, []),
    clearAll: useCallback(() => {
      dispatch({ type: 'CLEAR_ALL' })
    }, []),
  }

  const contextValue: EditorContextValue = { state, dispatch, actions }

  // Store instance for getEditorStore (for testing/compatibility)
  storeInstance = contextValue

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  )
}

// Hook để tương thích với API cũ (selector pattern)
export const useEditorStore = <T,>(selector: (state: EditorState) => T): T => {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditorStore must be used within EditorProvider')
  }
  return selector(context.state)
}

// Hook để lấy actions
export const useEditorActions = () => {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditorActions must be used within EditorProvider')
  }
  return context.actions
}

// Hook để lấy toàn bộ context (cho getState trong main.tsx)
export const useEditorContext = () => {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditorContext must be used within EditorProvider')
  }
  return context
}

// Export store instance để test (tương thích với zustand API)
let storeInstance: EditorContextValue | undefined

export const getEditorStore = () => {
  if (!storeInstance) {
    throw new Error('EditorProvider must be mounted before using getEditorStore')
  }
  return storeInstance
}
