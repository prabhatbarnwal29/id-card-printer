'use client'

import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { ImageIcon, X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageCropper } from '@/components/image-cropper'

interface UploadZoneProps {
  label: string
  image: string | null
  onImageChange: (image: string | null) => void
}

export function UploadZone({ label, image, onImageChange }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPendingImage(result)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) processFile(file)
        break
      }
    }
  }, [processFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset input value so the same file can be selected again
    e.target.value = ''
  }, [processFile])

  const handleCropComplete = useCallback((croppedImageUrl: string) => {
    onImageChange(croppedImageUrl)
    setPendingImage(null)
  }, [onImageChange])

  const handleCropClose = useCallback(() => {
    setShowCropper(false)
    setPendingImage(null)
  }, [])

  const removeImage = useCallback(() => {
    onImageChange(null)
  }, [onImageChange])

  return (
    <>
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {label}
        </label>
        
        <div
          className={cn(
            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200',
            'min-h-[200px] cursor-pointer',
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50',
            image && 'border-solid border-primary/30 bg-card'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onPaste={handlePaste}
          tabIndex={0}
        >
          {image ? (
            <div className="relative w-full h-full p-4">
              <img
                src={image}
                alt={label}
                className="w-full h-auto max-h-[180px] object-contain rounded-md"
              />
              <Button
                variant="destructive"
                size="icon-sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage()
                }}
              >
                <X className="size-4" />
                <span className="sr-only">Remove image</span>
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-3 p-6 cursor-pointer w-full h-full">
              <div className="flex items-center justify-center size-12 rounded-full bg-primary/10">
                {isDragging ? (
                  <Upload className="size-6 text-primary" />
                ) : (
                  <ImageIcon className="size-6 text-primary" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {isDragging ? 'Drop your image here' : 'Drag & Drop a file here'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse • paste from clipboard
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleInputChange}
              />
            </label>
          )}
        </div>
      </div>

      {pendingImage && (
        <ImageCropper
          imageSrc={pendingImage}
          open={showCropper}
          onClose={handleCropClose}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  )
}
