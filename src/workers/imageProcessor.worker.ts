import type { WorkerRequest, WorkerResponse } from '../types'
import { processImage } from '../lib/imageProcessing'

declare const self: DedicatedWorkerGlobalScope

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, imageData, settings } = e.data
  const result = processImage(imageData, settings)
  const response: WorkerResponse = { id, imageData: result }
  self.postMessage(response, [result.data.buffer])
}
