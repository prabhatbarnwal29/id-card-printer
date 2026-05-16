'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { UploadZone } from '@/components/upload-zone'
import { PreviewCanvas } from '@/components/preview-canvas'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Download, FileDown, Shield, RotateCcw, ArrowRightLeft, ArrowUpDown } from 'lucide-react'
import { jsPDF } from 'jspdf'

export default function Home() {
  const [image1, setImage1] = useState<string | null>(null)
  const [image2, setImage2] = useState<string | null>(null)
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical')
  const printRef = useRef<HTMLDivElement>(null)

  const bothImagesUploaded = image1 && image2

  const handleSavePDF = useCallback(() => {
    const canvas = printRef.current?.querySelector('canvas')
    if (!canvas) return

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    // A4 dimensions in mm
    const pageWidth = 210
    const pageHeight = 297
    
    // Calculate dimensions to fit canvas on A4 while maintaining aspect ratio
    const canvasRatio = canvas.width / canvas.height
    const pageRatio = pageWidth / pageHeight
    
    let imgWidth: number
    let imgHeight: number
    
    if (canvasRatio > pageRatio) {
      imgWidth = pageWidth
      imgHeight = pageWidth / canvasRatio
    } else {
      imgHeight = pageHeight
      imgWidth = pageHeight * canvasRatio
    }
    
    // Center the image on the page
    const x = (pageWidth - imgWidth) / 2
    const y = (pageHeight - imgHeight) / 2
    
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)
    pdf.save('id-merged.pdf')
  }, [])

  const handleDownload = useCallback(() => {
    const canvas = printRef.current?.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.download = 'id-merged.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  const handleReset = useCallback(() => {
    setImage1(null)
    setImage2(null)
  }, [])

  // Handle paste events globally
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
              const result = event.target?.result as string
              if (!image1) {
                setImage1(result)
              } else if (!image2) {
                setImage2(result)
              }
            }
            reader.readAsDataURL(file)
          }
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [image1, image2])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm no-print">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary text-primary-foreground">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M15 8h2" />
                <path d="M15 12h2" />
                <path d="M7 16h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">ID Merger & Printer</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Combine and print ID cards easily
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 no-print">
        {/* Hero Section */}
        <section className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-balance">
            Upload, Merge & Print Your ID Cards
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-pretty">
            Upload the front and back of your ID card to create a single, perfectly formatted printable document.
          </p>
        </section>

        {/* Upload Section */}
        <section className="mb-10">
          <Card className="border-2 border-dashed border-border bg-card/50">
            <CardContent className="p-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <UploadZone
                  label="Upload Front / Photo 1"
                  image={image1}
                  onImageChange={setImage1}
                />
                <UploadZone
                  label="Upload Back / Photo 2"
                  image={image2}
                  onImageChange={setImage2}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Controls */}
        <section className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-secondary rounded-lg px-4 py-2">
                <ArrowUpDown className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Vertical</span>
                <Switch
                  checked={orientation === 'horizontal'}
                  onCheckedChange={(checked) =>
                    setOrientation(checked ? 'horizontal' : 'vertical')
                  }
                />
                <span className="text-sm font-medium text-foreground">Horizontal</span>
                <ArrowRightLeft className="size-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(image1 || image2) && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="gap-2"
                >
                  <RotateCcw className="size-4" />
                  Reset
                </Button>
              )}

              <Button
                onClick={handleDownload}
                disabled={!bothImagesUploaded}
                variant="outline"
                className="gap-2"
              >
                <Download className="size-4" />
                Download PNG
              </Button>

              <Button
                onClick={handleSavePDF}
                disabled={!bothImagesUploaded}
                className="gap-2"
              >
                <FileDown className="size-4" />
                Save PDF
              </Button>
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Live Preview</h3>
            <span className="text-xs text-muted-foreground">
              {orientation === 'vertical' ? 'Top / Bottom Split' : 'Left / Right Split'}
            </span>
          </div>

          <div 
            ref={printRef}
            className="flex justify-center"
          >
            <div className="w-full max-w-md">
              <PreviewCanvas
                image1={image1}
                image2={image2}
                orientation={orientation}
              />
            </div>
          </div>

          {!bothImagesUploaded && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Upload both images to see the merged preview and enable printing
            </p>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 no-print">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="size-4 text-primary" />
              <span>
                <strong className="text-foreground">100% Private:</strong> All processing happens in your browser. No data is ever uploaded to any server.
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Built with privacy in mind
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
