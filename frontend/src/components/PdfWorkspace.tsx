import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Document, Page } from 'react-pdf'
import { useDrop } from 'react-dnd'
import { PDFDocument, PDFImage } from 'pdf-lib'
import { useEditorStore } from '../state/editorStore'
import { DragTypes } from '../constants/dragTypes'
import {
  clamp,
  createId,
  dataUrlToUint8Array,
  downloadBlob,
} from '../utils/file'

const PdfPage = ({ pageNumber }: { pageNumber: number }) => {
  const pageIndex = pageNumber - 1
  const placements = useEditorStore((state) => state.placements)
  const images = useEditorStore((state) => state.images)
  const addPlacement = useEditorStore((state) => state.actions.addPlacement)
  const removePlacement = useEditorStore((state) => state.actions.removePlacement)
  const updatePlacement = useEditorStore((state) => state.actions.updatePlacement)
  const pagePlacements = useMemo(
    () => placements.filter((placement) => placement.pageIndex === pageIndex),
    [placements, pageIndex],
  )

  const [width, setWidth] = useState<number>()
  const frameRef = useRef<HTMLDivElement | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const [selectedPlacementId, setSelectedPlacementId] = useState<string>()
  const [dragState, setDragState] = useState<{ id: string } | null>(null)
  const [resizeState, setResizeState] = useState<{ id: string; corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' } | null>(null)

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: DragTypes.IMAGE,
      drop: (item: { imageId: string }, monitor) => {
        const offset = monitor.getClientOffset()
        const node = frameRef.current
        if (!offset || !node) return
        const rect = node.getBoundingClientRect()
        const x = clamp((offset.x - rect.left) / rect.width, 0, 1)
        const y = clamp((offset.y - rect.top) / rect.height, 0, 1)
        addPlacement({
          id: createId(),
          imageId: item.imageId,
          pageIndex,
          x,
          y,
          widthRatio: 0.22,
        })
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [pageIndex, addPlacement],
  )

  const cleanupResizeObserver = useCallback(() => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect()
      resizeObserverRef.current = null
    }
  }, [])

  useLayoutEffect(() => () => cleanupResizeObserver(), [cleanupResizeObserver])

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      cleanupResizeObserver()
      frameRef.current = node
      if (node) {
        drop(node)
        if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
          const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) {
              setWidth(entry.contentRect.width)
            }
          })
          observer.observe(node)
          resizeObserverRef.current = observer
        } else {
          setWidth(node.clientWidth)
        }
      }
    },
    [cleanupResizeObserver, drop],
  )

  useEffect(() => {
    if (!dragState && !resizeState) return undefined
    const handleMove = (event: PointerEvent) => {
      const node = frameRef.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const pointerX = clamp((event.clientX - rect.left) / rect.width, 0, 1)
      const pointerY = clamp((event.clientY - rect.top) / rect.height, 0, 1)

      if (dragState) {
        updatePlacement(dragState.id, { x: pointerX, y: pointerY })
      } else if (resizeState) {
        const placement = placements.find((p) => p.id === resizeState.id)
        if (!placement) return
        const deltaX = pointerX - placement.x
        const deltaY = pointerY - placement.y
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2)
        const nextWidth = clamp(distance * 2, 0.05, 1)
        updatePlacement(resizeState.id, { widthRatio: nextWidth })
      }
    }
    const handleUp = () => {
      setDragState(null)
      setResizeState(null)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [dragState, resizeState, updatePlacement, placements])

  return (
    <div className="mb-8 flex justify-center">
      <div className="w-full max-w-4xl rounded-lg border border-white/10 bg-pdf-slate/70 p-4">
        <div ref={setRefs} className="relative mx-auto">
          <Page
            pageNumber={pageNumber}
            width={width ?? 720}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            className="rounded shadow-lg"
          />
          <div
            className="pointer-events-none absolute inset-0"
            data-testid={`page-overlay-${pageNumber}`}
            onClick={() => setSelectedPlacementId(undefined)}
          >
            {pagePlacements.map((placement) => {
              const image = images.find((img) => img.id === placement.imageId)
              if (!image) return null
              const isSelected = selectedPlacementId === placement.id
              return (
                <div
                  key={placement.id}
                  className={`group pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-move rounded-lg ${
                    isSelected ? 'ring-2 ring-pdf-accent shadow-lg' : ''
                  }`}
                  style={{
                    left: `${placement.x * 100}%`,
                    top: `${placement.y * 100}%`,
                    width: `${placement.widthRatio * 100}%`,
                  }}
                  onPointerDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setSelectedPlacementId(placement.id)
                    setDragState({ id: placement.id })
                  }}
                  onClick={(event) => {
                    event.stopPropagation()
                    setSelectedPlacementId(placement.id)
                  }}
                  onWheel={(event) => {
                    if (!isSelected) return
                    event.preventDefault()
                    const delta = event.deltaY < 0 ? 0.02 : -0.02
                    const nextWidth = clamp(placement.widthRatio + delta, 0.05, 1)
                    updatePlacement(placement.id, { widthRatio: nextWidth })
                  }}
                >
                  <img
                    src={image.dataUrl}
                    alt={image.name}
                    className="w-full select-none rounded"
                    draggable={false}
                  />
                  <button
                    type="button"
                    className="pointer-events-auto absolute -right-2 -top-2 hidden h-6 w-6 rounded-full bg-red-500 text-xs font-bold text-white group-hover:flex items-center justify-center"
                    onClick={() => removePlacement(placement.id)}
                  >
                    ×
                  </button>
                  {isSelected && (
                    <>
                      {(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const).map((corner) => (
                        <div
                          key={corner}
                          className={`pointer-events-auto absolute h-3 w-3 rounded-full border border-white bg-white/80 ${
                            corner === 'topLeft'
                              ? '-left-2 -top-2'
                              : corner === 'topRight'
                                ? '-right-2 -top-2'
                                : corner === 'bottomLeft'
                                  ? '-left-2 -bottom-2'
                                  : '-right-2 -bottom-2'
                          }`}
                          onPointerDown={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            setResizeState({ id: placement.id, corner })
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              )
            })}
          </div>
          {isOver && (
            <div className="pointer-events-none absolute inset-0 rounded border-2 border-dashed border-pdf-accent/60 bg-pdf-accent/10" />
          )}
        </div>
      </div>
    </div>
  )
}

export const PdfWorkspace = () => {
  const pdf = useEditorStore((state) => state.pdf)
  const placements = useEditorStore((state) => state.placements)
  const images = useEditorStore((state) => state.images)
  const { isSaving, error } = useEditorStore((state) => state.ui)
  const setSaving = useEditorStore((state) => state.actions.setSaving)
  const setError = useEditorStore((state) => state.actions.setError)
  const [numPages, setNumPages] = useState(0)
  const fileSource = useMemo(() => (pdf ? { data: pdf.data.slice() } : null), [pdf])
  const pageNumbers = useMemo(
    () => Array.from({ length: numPages }, (_, index) => index + 1),
    [numPages],
  )

  useEffect(() => {
    if (!pdf) {
      setNumPages(0)
    }
  }, [pdf])

  const handleSave = async () => {
    if (!pdf) return
    setError(undefined)
    setSaving(true)
    try {
      const pdfDoc = await PDFDocument.load(pdf.data)
      const imageCache = new Map<string, PDFImage>()

      const pages = pdfDoc.getPages()
      for (const placement of placements) {
        const page = pages[placement.pageIndex]
        const image = images.find((img) => img.id === placement.imageId)
        if (!page || !image) continue

        const mimeType = image.mimeType?.toLowerCase() ?? ''
        let embedded = imageCache.get(image.id)
        if (!embedded) {
          const imageBytes = dataUrlToUint8Array(image.dataUrl)
          if (mimeType.includes('png')) {
            embedded = await pdfDoc.embedPng(imageBytes)
          } else if (mimeType.includes('jpg') || mimeType.includes('jpeg')) {
            embedded = await pdfDoc.embedJpg(imageBytes)
          } else {
            continue
          }
          imageCache.set(image.id, embedded)
        }

        const pageWidth = page.getWidth()
        const pageHeight = page.getHeight()
        const width = pageWidth * placement.widthRatio
        const aspect = image.height / image.width || 1
        const height = width * aspect

        const centerX = placement.x * pageWidth
        const centerY = placement.y * pageHeight
        const x = centerX - width / 2
        const y = pageHeight - centerY - height / 2

        page.drawImage(embedded, { x, y, width, height })
      }

      const bytes = await pdfDoc.save()
      const filename = pdf.name.replace(/\.pdf$/i, '')
      const pdfArray = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer
      const blob = new Blob([pdfArray], { type: 'application/pdf' })
      downloadBlob(blob, `${filename || 'edited'}-edited.pdf`)
    } catch (err) {
      console.error(err)
      setError('Không thể lưu PDF. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="flex flex-1 flex-col bg-pdf-dark">
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {!fileSource ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-pdf-muted">
            <p className="text-lg font-semibold text-white">Bắt đầu bằng cách tải PDF</p>
            <p className="text-sm">Nhấn nút &quot;Tải PDF&quot; ở trên và chọn file.</p>
          </div>
        ) : (
          <Document
            file={fileSource}
            onLoadSuccess={({ numPages: total }) => setNumPages(total)}
            onLoadError={() => setError('Không thể hiển thị PDF này.')}
          >
            {pageNumbers.map((pageNumber) => (
              <PdfPage key={pageNumber} pageNumber={pageNumber} />
            ))}
          </Document>
        )}
      </div>
      <footer className="sticky bottom-0 border-t border-white/5 bg-pdf-slate px-6 py-4 shadow-[0_-8px_16px_rgba(0,0,0,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">
              {pdf ? pdf.name : 'Chưa có PDF'}
            </p>
            <p className="text-xs text-pdf-muted">
              {placements.length} ảnh đang đặt trong tài liệu
            </p>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!pdf || placements.length === 0 || isSaving}
            className="rounded-md bg-pdf-accent px-6 py-2 text-sm font-semibold text-white transition hover:bg-pdf-accent/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu PDF'}
          </button>
        </div>
      </footer>
    </section>
  )
}

