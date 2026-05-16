'use client'

import { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface PreviewCanvasProps {
  image1: string | null
  image2: string | null
  orientation: 'vertical' | 'horizontal'
  className?: string
}

export function PreviewCanvas({ image1, image2, orientation, className }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // A4 at 150 DPI: 210mm x 297mm → 1240 x 1754 px
    const A4_WIDTH = 1240
    const A4_HEIGHT = 1754

    canvas.width = A4_WIDTH
    canvas.height = A4_HEIGHT

    // White page background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT)

    const loadAndDraw = async () => {
      const images: HTMLImageElement[] = []
      const sources = [image1, image2].filter(Boolean) as string[]

      await Promise.all(
        sources.map(
          (src, index) =>
            new Promise<void>((resolve) => {
              const img = new Image()
              img.crossOrigin = 'anonymous'
              img.onload = () => {
                images[index] = img
                resolve()
              }
              img.onerror = () => resolve()
              img.src = src
            })
        )
      )

      // White background again after async
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT)

      const padding = 60

      if (orientation === 'vertical') {
        const slotHeight = A4_HEIGHT / 2

        if (images[0]) {
          drawImageFit(ctx, images[0], padding, padding, A4_WIDTH - padding * 2, slotHeight - padding * 1.5)
        } else {
          drawPlaceholder(ctx, padding, padding, A4_WIDTH - padding * 2, slotHeight - padding * 1.5, 'Front / Photo 1')
        }

        if (images[1]) {
          drawImageFit(ctx, images[1], padding, slotHeight + padding * 0.5, A4_WIDTH - padding * 2, slotHeight - padding * 1.5)
        } else {
          drawPlaceholder(ctx, padding, slotHeight + padding * 0.5, A4_WIDTH - padding * 2, slotHeight - padding * 1.5, 'Back / Photo 2')
        }
      } else {
        const slotWidth = A4_WIDTH / 2

        if (images[0]) {
          drawImageFit(ctx, images[0], padding, padding, slotWidth - padding * 1.5, A4_HEIGHT - padding * 2)
        } else {
          drawPlaceholder(ctx, padding, padding, slotWidth - padding * 1.5, A4_HEIGHT - padding * 2, 'Front / Photo 1')
        }

        if (images[1]) {
          drawImageFit(ctx, images[1], slotWidth + padding * 0.5, padding, slotWidth - padding * 1.5, A4_HEIGHT - padding * 2)
        } else {
          drawPlaceholder(ctx, slotWidth + padding * 0.5, padding, slotWidth - padding * 1.5, A4_HEIGHT - padding * 2, 'Back / Photo 2')
        }
      }

      // Divider line
      ctx.save()
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 2
      ctx.setLineDash([12, 8])
      if (orientation === 'vertical') {
        ctx.beginPath()
        ctx.moveTo(padding * 2, A4_HEIGHT / 2)
        ctx.lineTo(A4_WIDTH - padding * 2, A4_HEIGHT / 2)
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.moveTo(A4_WIDTH / 2, padding * 2)
        ctx.lineTo(A4_WIDTH / 2, A4_HEIGHT - padding * 2)
        ctx.stroke()
      }
      ctx.restore()
    }

    loadAndDraw()
  }, [image1, image2, orientation])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  return (
    <div className={cn('relative', className)}>
      {/* Paper shadow effect */}
      <div className="relative mx-auto" style={{ maxWidth: '420px' }}>
        <div className="absolute inset-0 translate-y-1 translate-x-1 rounded-sm bg-black/10 blur-sm" />
        <canvas
          ref={canvasRef}
          className="relative w-full h-auto rounded-sm border border-border/60 bg-white print-canvas"
        />
      </div>
    </div>
  )
}

function drawImageFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  areaWidth: number,
  areaHeight: number
) {
  const imgRatio = img.width / img.height
  const areaRatio = areaWidth / areaHeight

  let drawWidth: number
  let drawHeight: number

  if (imgRatio > areaRatio) {
    drawWidth = areaWidth
    drawHeight = areaWidth / imgRatio
  } else {
    drawHeight = areaHeight
    drawWidth = areaHeight * imgRatio
  }

  const drawX = x + (areaWidth - drawWidth) / 2
  const drawY = y + (areaHeight - drawHeight) / 2

  // Subtle rounded rect clip
  ctx.save()
  roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, 8)
  ctx.clip()
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
  ctx.restore()
}

function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string
) {
  ctx.save()
  roundedRect(ctx, x, y, w, h, 12)
  ctx.fillStyle = '#f8fafc'
  ctx.fill()
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 2
  ctx.setLineDash([10, 6])
  ctx.stroke()

  ctx.fillStyle = '#94a3b8'
  ctx.font = `bold ${Math.round(h * 0.04)}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + w / 2, y + h / 2)
  ctx.restore()
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

export function getCanvasDataUrl(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const canvas = canvasRef.current
  if (!canvas) return null
  return canvas.toDataURL('image/png')
}
