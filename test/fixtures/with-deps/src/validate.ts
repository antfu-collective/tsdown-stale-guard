export function validate(input: string): boolean {
  return input.length > 0 && input.length < 1000
}
