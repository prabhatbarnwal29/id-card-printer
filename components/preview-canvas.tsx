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

    // A4 aspect ratio: 210mm x 297mm (width x height)
    const A4_WIDTH = 794 // pixels at 96 DPI
    const A4_HEIGHT = 1123

    canvas.width = A4_WIDTH
    canvas.height = A4_HEIGHT

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT)

    const loadAndDraw = async () => {
      const images: HTMLImageElement[] = []
      const sources = [image1, image2].filter(Boolean) as string[]

      // Load all images
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

      // Clear canvas again
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT)

      if (orientation === 'vertical') {
        // Top half for image 1, bottom half for image 2
        const halfHeight = A4_HEIGHT / 2

        if (images[0]) {
          drawImageCentered(ctx, images[0], 0, 0, A4_WIDTH, halfHeight)
        }

        if (images[1]) {
          drawImageCentered(ctx, images[1], 0, halfHeight, A4_WIDTH, halfHeight)
        }

        // Draw a subtle divider line
        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(40, halfHeight)
        ctx.lineTo(A4_WIDTH - 40, halfHeight)
        ctx.stroke()
      } else {
        // Left half for image 1, right half for image 2
        const halfWidth = A4_WIDTH / 2

        if (images[0]) {
          drawImageCentered(ctx, images[0], 0, 0, halfWidth, A4_HEIGHT)
        }

        if (images[1]) {
          drawImageCentered(ctx, images[1], halfWidth, 0, halfWidth, A4_HEIGHT)
        }

        // Draw a subtle divider line
        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(halfWidth, 40)
        ctx.lineTo(halfWidth, A4_HEIGHT - 40)
        ctx.stroke()
      }
    }

    loadAndDraw()
  }, [image1, image2, orientation])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  return (
    <div className={cn('relative', className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-lg shadow-lg border border-border bg-card print-canvas"
        style={{ maxHeight: '600px', objectFit: 'contain' }}
      />
    </div>
  )
}

function drawImageCentered(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  areaWidth: number,
  areaHeight: number
) {
  const padding = 40 // Padding from edges
  const scaleFactor = 0.6 // Scale images to 60% of available area

  const availableWidth = areaWidth - padding * 2
  const availableHeight = areaHeight - padding * 2

  const imgRatio = img.width / img.height
  const areaRatio = availableWidth / availableHeight

  let drawWidth: number
  let drawHeight: number

  if (imgRatio > areaRatio) {
    // Image is wider than area - fit to width
    drawWidth = availableWidth
    drawHeight = availableWidth / imgRatio
  } else {
    // Image is taller than area - fit to height
    drawHeight = availableHeight
    drawWidth = availableHeight * imgRatio
  }

  // Apply 60% scale factor
  drawWidth *= scaleFactor
  drawHeight *= scaleFactor

  // Center the scaled image in the area
  const drawX = x + (areaWidth - drawWidth) / 2
  const drawY = y + (areaHeight - drawHeight) / 2

  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
}

export function getCanvasDataUrl(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const canvas = canvasRef.current
  if (!canvas) return null
  return canvas.toDataURL('image/png')
}
