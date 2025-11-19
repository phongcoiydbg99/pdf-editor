import type { ChangeEvent } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useDrag } from 'react-dnd'
import type { DragSourceMonitor } from 'react-dnd'
import type { UploadedImage } from '../state/editorStore'
import { useEditorStore, useEditorActions } from '../state/editorStore'
import { DragTypes } from '../constants/dragTypes'
import {
  createId,
  fetchAsDataUrl,
  getMimeTypeFromDataUrl,
  rasterizeToPng,
  readFileAsDataUrl,
  readImageDimensions,
} from '../utils/file'

const DEFAULT_REMOTE_IMAGES = [
  {
    url: 'https://storage.googleapis.com/download/storage/v1/b/tripi-train/o/img_1762844553831_signature_1762844557437.png?generation=1762844554193835&alt=media',
    name: 'signature-mẫu 1',
  },
  {
    url: 'https://storage.googleapis.com/download/storage/v1/b/tripi-train/o/img_1762744716079_signature-photo.png?generation=1762744716599936&alt=media',
    name: 'signature-mẫu 2',
  },
  {
    url: 'https://storage.googleapis.com/download/storage/v1/b/tripi-train/o/img_1762504260763_signature_1762504260.png?generation=1762504260941393&alt=media',
    name: 'signature-mẫu 3',
  },
]

const ImageItem = ({ image }: { image: UploadedImage }) => {
  const dragSpec = useMemo(
    () => ({
      type: DragTypes.IMAGE,
      item: { type: DragTypes.IMAGE, imageId: image.id },
      collect: (monitor: DragSourceMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [image.id],
  )
  const [{ isDragging }, drag] = useDrag(dragSpec)
  const dragRef = useCallback(
    (node: HTMLDivElement | null) => {
      drag(node)
    },
    [drag],
  )

  return (
    <div
      ref={dragRef}
      className="flex cursor-grab items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-2 text-left text-sm transition hover:border-white/20"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <img src={image.dataUrl} alt={image.name} className="h-12 w-12 rounded object-cover" />
      <div className="flex flex-1 flex-col">
        <span className="text-white">{image.name}</span>
        <span className="text-xs text-pdf-muted">
          {Math.round(image.width)}×{Math.round(image.height)}
        </span>
      </div>
    </div>
  )
}

export const ImageLibrary = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { addImages } = useEditorActions()
  const images = useEditorStore((state) => state.images)
  const [isUploading, setUploading] = useState(false)
  const [remoteLoadingId, setRemoteLoadingId] = useState<string | null>(null)
  const total = useMemo(() => images.length, [images])

  const handleAddRemoteImage = async (source: (typeof DEFAULT_REMOTE_IMAGES)[number]) => {
    try {
      setRemoteLoadingId(source.url)
      const dataUrl = await fetchAsDataUrl(source.url)
      const { width, height } = await readImageDimensions(dataUrl)
      const derivedMime = getMimeTypeFromDataUrl(dataUrl)?.toLowerCase() ?? 'image/png'
      let mimeType = derivedMime
      let finalDataUrl = dataUrl
      if (!/png|jpe?g/.test(mimeType)) {
        finalDataUrl = await rasterizeToPng(dataUrl, width, height)
        mimeType = 'image/png'
      }
      addImages([
        {
          id: createId(),
          name: source.name,
          mimeType,
          dataUrl: finalDataUrl,
          width,
          height,
        },
      ])
    } catch (error) {
      console.error(`Không thể tải ${source.name}`, error)
    } finally {
      setRemoteLoadingId(null)
    }
  }

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    const selectedFiles = files ? Array.from(files) : []
    event.target.value = ''
    if (selectedFiles.length === 0) return

    try {
      setUploading(true)
      const imageData: UploadedImage[] = []
      for (const file of selectedFiles) {
        const inferredExt = /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(file.name)
        if (!file.type && !inferredExt) continue
        const dataUrl = await readFileAsDataUrl(file)
        const { width, height } = await readImageDimensions(dataUrl)
        const derivedMime = getMimeTypeFromDataUrl(dataUrl)
        let mimeType = (file.type || derivedMime || 'image/png').toLowerCase()
        let finalDataUrl = dataUrl
        if (!/png|jpe?g/.test(mimeType)) {
          finalDataUrl = await rasterizeToPng(dataUrl, width, height)
          mimeType = 'image/png'
        }
        imageData.push({
          id: createId(),
          name: file.name,
          mimeType,
          dataUrl: finalDataUrl,
          width,
          height,
        })
      }
      if (imageData.length) {
        addImages(imageData)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <aside
      className="sticky top-0 flex w-72 flex-shrink-0 flex-col border-r border-white/5 bg-pdf-slate p-5"
      style={{ height: 'calc(100vh - 72px)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Thư viện ảnh</p>
          <p className="text-xs text-pdf-muted">{total} ảnh</p>
        </div>
        <button
          type="button"
          className="rounded-md bg-pdf-accent/80 px-3 py-1.5 text-xs font-medium text-white shadow transition hover:bg-pdf-accent disabled:opacity-50"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Đang tải' : 'Thêm ảnh'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleChange}
          data-testid="image-upload-input"
          className="sr-only"
        />
      </div>
      <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
        {images.length === 0 ? (
          <p className="text-sm text-pdf-muted">Tải ảnh để kéo vào PDF.</p>
        ) : (
          images.map((image) => <ImageItem key={image.id} image={image} />)
        )}
        <div className="sticky bottom-0 -mr-1 -ml-1 mt-3 space-y-2 border-t border-white/5 bg-pdf-slate p-2">
          <p className="text-xs font-semibold uppercase text-pdf-muted">Ảnh mẫu nhanh</p>
          <div className="space-y-2">
            {DEFAULT_REMOTE_IMAGES.map((source) => (
              <button
                key={source.url}
                type="button"
                className="flex w-full items-center gap-3 rounded-md border border-white/10 bg-white/5 p-2 text-left text-sm text-white transition hover:border-white/30 disabled:opacity-50"
                onClick={() => handleAddRemoteImage(source)}
                disabled={remoteLoadingId === source.url}
              >
                <img
                  src={source.url}
                  alt={source.name}
                  className="h-10 w-10 rounded object-cover"
                  loading="lazy"
                />
                <div className="flex-1">
                  <p>{source.name}</p>
                  <p className="text-xs text-pdf-muted">
                    {remoteLoadingId === source.url ? 'Đang tải...' : 'Nhấn để thêm'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

