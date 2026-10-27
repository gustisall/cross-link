import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
})
Object.defineProperty(window, 'scrollTo', { writable: true, value: vi.fn() })
