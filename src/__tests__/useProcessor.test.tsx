// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, createElement, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useAppStore } from '../store/useAppStore'
import { useProcessor } from '../lib/useProcessor'
import type { SourceEntry, WorkerRequest } from '../types'

// How useProcessor schedules and cancels document loads. The real worker and
// pdf.js need a browser, so the pipeline is stubbed: every page is a 2x2
// image and the "worker" echoes it back on the next macrotask.
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

class FakeWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  private terminated = false

  postMessage(req: WorkerRequest) {
    setTimeout(() => {
      // Like the real one, a terminated worker never answers.
      if (this.terminated) return
      this.onmessage?.({ data: { id: req.id, imageData: req.imageData } } as MessageEvent)
    }, 0)
  }

  terminate() {
    this.terminated = true
  }
}

vi.stubGlobal('Worker', FakeWorker)

vi.mock('../lib/pdfRenderer', () => ({
  loadImage: async () => new ImageData(2, 2),
  loadPdf: async () => ({
    totalPages: 2,
    renderPage: async () => new ImageData(2, 2),
  }),
}))

// jsdom has no canvas: enough for putImageData to be callable.
HTMLCanvasElement.prototype.getContext = (() => ({
  putImageData() {},
})) as unknown as typeof HTMLCanvasElement.prototype.getContext

function Probe() {
  useProcessor()
  return null
}

function source(name: string, type: 'pdf' | 'image'): SourceEntry {
  return {
    file: new File([''], name, { type: type === 'pdf' ? 'application/pdf' : 'image/png' }),
    type,
  }
}

function docs() {
  return useAppStore.getState().documents
}

/** Advances timers inside act() until the condition holds or the timeout passes. */
async function waitFor(condition: () => boolean, timeoutMs = 1000) {
  const start = Date.now()
  while (!condition() && Date.now() - start < timeoutMs) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 5))
    })
  }
}

let container: HTMLDivElement
let root: Root

async function mount(strict = false) {
  const probe = createElement(Probe)
  await act(async () => {
    root.render(strict ? createElement(StrictMode, null, probe) : probe)
  })
}

beforeEach(() => {
  useAppStore.getState().reset()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

describe('useProcessor', () => {
  it('loads a document that was added before the editor mounted, under StrictMode', async () => {
    // Landing page flow: the file is added to the store, then the editor mounts.
    // StrictMode mounts, unmounts and remounts once in development.
    useAppStore.getState().addDocuments([source('score.png', 'image')])
    await mount(true)

    await waitFor(() => !docs()[0].isLoading)

    const doc = docs()[0]
    expect(doc.isLoading).toBe(false)
    expect(doc.loadingProgress).toBe(1)
    expect(doc.pages[0]?.processedCanvas).toBeDefined()
  })

  it('keeps loading the first document when another one is added meanwhile', async () => {
    await mount()
    await act(async () => {
      useAppStore.getState().addDocuments([source('a.pdf', 'pdf')])
    })
    // a.pdf is now waiting on the worker for its first page
    await act(async () => {
      useAppStore.getState().addDocuments([source('b.pdf', 'pdf')])
    })

    await waitFor(() => docs().every((d) => !d.isLoading))

    for (const doc of docs()) {
      expect(doc.isLoading).toBe(false)
      expect(doc.pages.filter(Boolean)).toHaveLength(2)
    }
  })

  it('keeps loading the remaining documents when one is removed meanwhile', async () => {
    await mount()
    await act(async () => {
      useAppStore.getState().addDocuments([source('a.pdf', 'pdf'), source('b.pdf', 'pdf')])
    })
    await act(async () => {
      useAppStore.getState().removeDocument(1)
    })

    await waitFor(() => !docs()[0].isLoading)

    expect(docs()).toHaveLength(1)
    expect(docs()[0].isLoading).toBe(false)
    expect(docs()[0].pages.filter(Boolean)).toHaveLength(2)
  })

  it('re-renders every document when the DPI changes', async () => {
    await mount()
    await act(async () => {
      useAppStore.getState().addDocuments([source('a.pdf', 'pdf')])
    })
    await waitFor(() => !docs()[0].isLoading)
    const before = docs()[0].pages[0].processedCanvas

    await act(async () => {
      useAppStore.getState().setExportDpi(200)
    })
    await waitFor(() => !docs()[0].isLoading && docs()[0].pages[0].processedCanvas !== before)

    expect(docs()[0].isLoading).toBe(false)
    expect(docs()[0].pages[0].processedCanvas).not.toBe(before)
  })
})
