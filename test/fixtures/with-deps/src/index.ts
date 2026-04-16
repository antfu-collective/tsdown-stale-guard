import { format } from './format'
import { validate } from './validate'

export function process(input: string): string {
  if (!validate(input))
    throw new Error('Invalid input')
  return format(input)
}
