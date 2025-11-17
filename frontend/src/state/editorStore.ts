import { create } from 'zustand'

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

type EditorState = {
  pdf?: PdfDocument
  images: UploadedImage[]
  placements: ImagePlacement[]
  ui: UiState
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

export const useEditorStore = create<EditorState>((set) => ({
  pdf: undefined,
  images: [],
  placements: [],
  ui: { isSaving: false },
  actions: {
    setPdf: (pdf) =>
      set(() => ({
        pdf,
        placements: [],
      })),
    addImages: (newImages) =>
      set((state) => ({
        images: [...state.images, ...newImages],
      })),
    removeImage: (imageId) =>
      set((state) => ({
        images: state.images.filter((img) => img.id !== imageId),
        placements: state.placements.filter((placement) => placement.imageId !== imageId),
      })),
    addPlacement: (placement) =>
      set((state) => ({
        placements: [...state.placements, placement],
      })),
    removePlacement: (placementId) =>
      set((state) => ({
        placements: state.placements.filter((placement) => placement.id !== placementId),
      })),
    updatePlacement: (placementId, updates) =>
      set((state) => ({
        placements: state.placements.map((placement) =>
          placement.id === placementId ? { ...placement, ...updates } : placement,
        ),
      })),
    setSaving: (isSaving) =>
      set((state) => ({
        ui: { ...state.ui, isSaving },
      })),
    setError: (error) =>
      set((state) => ({
        ui: { ...state.ui, error },
      })),
    clearAll: () =>
      set({
        pdf: undefined,
        images: [],
        placements: [],
        ui: { isSaving: false },
      }),
  },
}))

