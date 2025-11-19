import { beforeEach, describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { EditorProvider, useEditorStore, useEditorActions, initialState } from './editorStore'
import type { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
  <EditorProvider>{children}</EditorProvider>
)

beforeEach(() => {
  // Reset state bằng cách dispatch CLEAR_ALL
  const { result } = renderHook(() => useEditorActions(), { wrapper })
  act(() => {
    result.current.clearAll()
  })
})

describe('editorStore', () => {
  it('sets pdf data and clears existing placements', () => {
    const { result: actionsResult } = renderHook(() => useEditorActions(), { wrapper })
    const { result: storeResult } = renderHook(() => useEditorStore((state) => state), { wrapper })

    // Set initial placements
    act(() => {
      actionsResult.current.addPlacement({
        id: 'placement-1',
        imageId: 'image-1',
        pageIndex: 0,
        x: 0.5,
        y: 0.5,
        widthRatio: 0.2,
      })
    })

    // Set PDF
    act(() => {
      actionsResult.current.setPdf({
        name: 'demo.pdf',
        data: new Uint8Array([1, 2, 3]),
      })
    })

    expect(storeResult.current.pdf?.name).toBe('demo.pdf')
    expect(storeResult.current.placements).toHaveLength(0)
  })

  it('removes placements when removing an image', () => {
    const { result: actionsResult } = renderHook(() => useEditorActions(), { wrapper })
    const { result: storeResult } = renderHook(() => useEditorStore((state) => state), { wrapper })

    // Add image and placement
    act(() => {
      actionsResult.current.addImages([
        {
          id: 'image-1',
          name: 'img.png',
          mimeType: 'image/png',
          dataUrl: 'data:image/png;base64,aaa',
          width: 100,
          height: 100,
        },
      ])
      actionsResult.current.addPlacement({
        id: 'placement-1',
        imageId: 'image-1',
        pageIndex: 0,
        x: 0.5,
        y: 0.5,
        widthRatio: 0.2,
      })
    })

    // Remove image
    act(() => {
      actionsResult.current.removeImage('image-1')
    })

    expect(storeResult.current.images).toHaveLength(0)
    expect(storeResult.current.placements).toHaveLength(0)
  })
})
