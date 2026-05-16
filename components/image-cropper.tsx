'use client'

import { useState, useRef, useCallback } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, X, RotateCcw } from 'lucide-react'

interface ImageCropperProps {
  imageSrc: string
  open: boolean
  onClose: () => void
  onCropComplete: (croppedImageUrl: string) => void
  aspectRatio?: number
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

export function ImageCropper({
  imageSrc,
  open,
  onClose,
  onCropComplete,
  aspectRatio = 1.586, // Standard ID card aspect ratio (85.6mm x 53.98mm)
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, aspectRatio))
    },
    [aspectRatio]
  )

  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return

    const image = imgRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    const pixelCrop = {
      x: completedCrop.x * scaleX,
      y: completedCrop.y * scaleY,
      width: completedCrop.width * scaleX,
      height: completedCrop.height * scaleY,
    }

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    const croppedImageUrl = canvas.toDataURL('image/png', 1.0)
    onCropComplete(croppedImageUrl)
    onClose()
  }, [completedCrop, onCropComplete, onClose])

  const handleReset = useCallback(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current
      setCrop(centerAspectCrop(width, height, aspectRatio))
    }
  }, [aspectRatio])

  const handleSkipCrop = useCallback(() => {
    onCropComplete(imageSrc)
    onClose()
  }, [imageSrc, onCropComplete, onClose])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-xl max-h-[85vh] flex flex-col p-4 gap-3">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-base">Crop Image</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex items-center justify-center bg-muted/50 rounded-lg p-2 min-h-0">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            className="max-h-[45vh]"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-h-[45vh] max-w-full object-contain"
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        <p className="text-xs text-muted-foreground text-center px-2">
          Drag corners to adjust crop area. Aspect ratio locked to ID card dimensions.
        </p>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between pt-0">
          <div className="flex gap-2 justify-center sm:justify-start">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="size-3.5 mr-1.5" />
              Reset
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSkipCrop}>
              Skip
            </Button>
          </div>
          <div className="flex gap-2 justify-center sm:justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="size-3.5 mr-1.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleCropComplete}>
              <Check className="size-3.5 mr-1.5" />
              Apply
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
