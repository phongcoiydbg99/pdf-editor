import type { ChangeEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../state/editorStore'
import { fetchAsUint8Array, readFileAsArrayBuffer } from '../utils/file'

const DEFAULT_PDF = {
  url: 'https://gcs.tripi.vn/phms-dev/mkt-portal/file/489753zgI/signature.pdf',
  name: 'signature.pdf',
}

export const TopBar = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const setPdf = useEditorStore((state) => state.actions.setPdf)
  const setError = useEditorStore((state) => state.actions.setError)
  const currentPdf = useEditorStore((state) => state.pdf)
  const [isUploading, setUploading] = useState(false)
  const [defaultError, setDefaultError] = useState<string>()
  const defaultLoadedRef = useRef(false)

  const loadDefaultPdf = useCallback(async () => {
    try {
      setUploading(true)
      setDefaultError(undefined)
      const data = await fetchAsUint8Array(DEFAULT_PDF.url)
      setPdf({
        name: DEFAULT_PDF.name,
        data,
      })
    } catch (error) {
      console.error('Không thể tải PDF mặc định', error)
      setDefaultError('Không thể tải PDF mặc định. Thử lại sau.')
    } finally {
      setUploading(false)
    }
  }, [setPdf])

  useEffect(() => {
    if (currentPdf || defaultLoadedRef.current) return
    defaultLoadedRef.current = true
    loadDefaultPdf()
  }, [currentPdf, loadDefaultPdf])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Vui lòng chọn đúng file PDF.')
      return
    }

    try {
      setUploading(true)
      setError(undefined)
      const buffer = await readFileAsArrayBuffer(file)
      setPdf({
        name: file.name,
        data: new Uint8Array(buffer),
      })
    } catch (error) {
      console.error(error)
      setError('Tải PDF thất bại. Thử lại sau.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-white/5 bg-pdf-slate px-6 py-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-pdf-muted">PDF Editor</p>
        <h1 className="text-lg font-semibold">React Drag & Drop</h1>
        {defaultError && <p className="mt-1 text-xs text-red-400">{defaultError}</p>}
      </div>
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={handleFileChange}
        />
        <button
          className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Đang tải...' : 'Tải PDF'}
        </button>
        <button
          className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          type="button"
          onClick={loadDefaultPdf}
          disabled={isUploading}
        >
          Tải PDF mẫu
        </button>
      </div>
    </header>
  )
}

