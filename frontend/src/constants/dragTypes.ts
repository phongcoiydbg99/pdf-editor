export const DragTypes = {
  IMAGE: 'SIDEBAR_IMAGE',
} as const

export type DragTypesKey = (typeof DragTypes)[keyof typeof DragTypes]

