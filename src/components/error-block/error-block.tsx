import type { ReactNode } from 'react'
import { createErrorBlock } from './create-error-block'
import {
  busyImageFactory,
  defaultImageFactory,
  disconnectedImageFactory,
  emptyImageFactory,
} from './images'

const imageRecord: Record<
  'default' | 'disconnected' | 'empty' | 'busy',
  (id: string) => ReactNode
> = {
  'default': defaultImageFactory,
  'disconnected': disconnectedImageFactory,
  'empty': emptyImageFactory,
  'busy': busyImageFactory,
}

export const ErrorBlock = createErrorBlock(imageRecord)
