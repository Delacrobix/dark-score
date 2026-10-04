import { useCallback, useEffect, useLayoutEffect } from 'react'
import { useAppStore, defaultZoomMode, selectEffectiveZoom, type ZoomMode } from '../store/useAppStore'

export const ZOOM_STEP = 25
export const MIN_ZOOM = 1
export const MAX_ZOOM = 500

/** Breathing room around a fitted page, in CSS pixels per side. */
const FIT_PADDING = 16

export function clampZoom(v: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(v)))
}

/**
 * Zoom after one +/− step. A manual zoom moves by 25. A fitted zoom (say 34%)
 * lands on the next multiple of 25 instead (50% / 25%), so the first step
 * from "Fit" reads as a normal zoom level.
 */
export function stepZoom(current: number, direction: 1 | -1, fromFit: boolean): number {
  if (!fromFit) return clampZoom(current + direction * ZOOM_STEP)
  const next = direction > 0
    ? Math.floor(current / ZOOM_STEP) * ZOOM_STEP + ZOOM_STEP
    : Math.ceil(current / ZOOM_STEP) * ZOOM_STEP - ZOOM_STEP
  return clampZoom(next > 0 ? next : current / 2)
}

/** The viewer's zoom state and the actions the zoom controls need. */
export function useViewerZoom() {
  const zoom = useAppStore(selectEffectiveZoom)
  const storedMode = useAppStore((s) => s.zoomMode)
  const setZoomPercent = useAppStore((s) => s.setZoomPercent)
  const setZoomMode = useAppStore((s) => s.setZoomMode)
  const mode: ZoomMode = storedMode ?? defaultZoomMode()
  const fitMode: ZoomMode = defaultZoomMode()
  const isFit = mode !== 'manual'

  const step = useCallback(
    (direction: 1 | -1) => setZoomPercent(stepZoom(zoom, direction, isFit)),
    [zoom, isFit, setZoomPercent]
  )

  return {
    zoom,
    mode,
    isFit,
    /** The fit this editor offers ('manual' when the design keeps the plain 100% start). */
    fitMode,
    zoomIn: () => step(1),
    zoomOut: () => step(-1),
    setZoom: (percent: number) => setZoomPercent(clampZoom(percent)),
    fit: () => setZoomMode(fitMode),
  }
}

/**
 * Measures how much of a page fits in the scroll container and publishes it
 * as the fit percentage. Width fit uses the container's width; page fit also
 * caps by its height (its max-height when it has one, else its own height).
 */
export function useFitToViewer(
  el: HTMLElement | null,
  contentWidth: number | undefined,
  contentHeight: number | undefined
) {
  const storedMode = useAppStore((s) => s.zoomMode)
  const setFitPercent = useAppStore((s) => s.setFitPercent)
  const mode = storedMode ?? defaultZoomMode()

  useLayoutEffect(() => {
    if (!el || !contentWidth || !contentHeight || mode === 'manual') return

    const measure = () => {
      const maxHeight = Number.parseFloat(getComputedStyle(el).maxHeight)
      const availWidth = el.clientWidth - FIT_PADDING * 2
      const availHeight = (Number.isFinite(maxHeight) ? maxHeight : el.clientHeight) - FIT_PADDING * 2
      const byWidth = availWidth / contentWidth
      const fit = mode === 'fit-page' ? Math.min(byWidth, availHeight / contentHeight) : byWidth
      if (fit > 0) setFitPercent(clampZoom(Math.floor(fit * 100)))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [el, contentWidth, contentHeight, mode, setFitPercent])
}

/** Ctrl / ⌘ + wheel over the viewer zooms instead of zooming the browser. */
export function useWheelZoom(el: HTMLElement | null) {
  const { zoomIn, zoomOut } = useViewerZoom()

  useEffect(() => {
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      if (e.deltaY < 0) zoomIn()
      else zoomOut()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [el, zoomIn, zoomOut])
}
