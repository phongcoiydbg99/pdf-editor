import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from './editorStore'

beforeEach(() => {
  const actions = useEditorStore.getState().actions
  useEditorStore.setState(
    {
      pdf: undefined,
      images: [],
      placements: [],
      ui: { isSaving: false },
      actions,
    },
    true,
  )
})

describe('editorStore', () => {
  it('sets pdf data and clears existing placements', () => {
    const { actions } = useEditorStore.getState()

    useEditorStore.setState({
      placements: [
        {
          id: 'placement-1',
          imageId: 'image-1',
          pageIndex: 0,
          x: 0.5,
          y: 0.5,
          widthRatio: 0.2,
        },
      ],
    })

    actions.setPdf({
      name: 'demo.pdf',
      data: new Uint8Array([1, 2, 3]),
    })

    const state = useEditorStore.getState()
    expect(state.pdf?.name).toBe('demo.pdf')
    expect(state.placements).toHaveLength(0)
  })

  it('removes placements when removing an image', () => {
    const { actions } = useEditorStore.getState()

    useEditorStore.setState({
      images: [
        {
          id: 'image-1',
          name: 'img.png',
          mimeType: 'image/png',
          dataUrl: 'data:image/png;base64,aaa',
          width: 100,
          height: 100,
        },
      ],
      placements: [
        {
          id: 'placement-1',
          imageId: 'image-1',
          pageIndex: 0,
          x: 0.5,
          y: 0.5,
          widthRatio: 0.2,
        },
      ],
    })

    actions.removeImage('image-1')

    const state = useEditorStore.getState()
    expect(state.images).toHaveLength(0)
    expect(state.placements).toHaveLength(0)
  })
})

