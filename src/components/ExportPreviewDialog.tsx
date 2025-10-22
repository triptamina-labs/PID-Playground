import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X, Eye, FileImage } from 'lucide-react'
import { useSimulation } from './SimulationProvider'
import html2canvas from 'html2canvas'

interface ExportPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  onExport: (range: { type: 'window'; seconds: number } | { type: 'all' }) => void
}

// Polyfill para roundRect si no está disponible
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius)
  } else {
    // Polyfill manual para roundRect
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }
}

async function captureElementAsCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  console.log('📸 Capturando elemento:', {
    tagName: element.tagName,
    className: element.className,
    offsetWidth: element.offsetWidth,
    offsetHeight: element.offsetHeight
  })
  
  return await html2canvas(element, {
    backgroundColor: '#0f172a',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    width: element.offsetWidth,
    height: element.offsetHeight
  })
}

export function ExportPreviewDialog({ isOpen, onClose, onExport }: ExportPreviewDialogProps) {
  const { state } = useSimulation()
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [exportRange, setExportRange] = useState<'window' | 'all'>('window')
  const previewRef = useRef<HTMLDivElement>(null)

  // Generar vista previa cuando se abre el diálogo o cambia el rango
  useEffect(() => {
    if (isOpen) {
      // Limpiar el canvas anterior y generar uno nuevo
      setPreviewCanvas(null)
      setTimeout(() => {
        generatePreview()
      }, 100)
    }
  }, [isOpen, exportRange])

  const generatePreview = async () => {
    setIsGenerating(true)
    try {
      console.log('🔍 Generando vista previa...')
      const elements = document.querySelectorAll('.recharts-wrapper')
      console.log(`🔍 Encontrados ${elements.length} elementos .recharts-wrapper`)
      
      if (elements.length < 2) {
        console.warn('⚠️ No se encontraron suficientes gráficas para la vista previa')
        setPreviewCanvas(null)
        setIsGenerating(false)
        return
      }

      console.log('📸 Capturando gráficas...')
      // Capturar ambas gráficas
      const [tempCanvas, outputCanvas] = await Promise.all([
        captureElementAsCanvas(elements[0] as HTMLElement),
        captureElementAsCanvas(elements[1] as HTMLElement)
      ])

      // Crear canvas combinado con formato de card
      const combinedCanvas = document.createElement('canvas')
      const ctx = combinedCanvas.getContext('2d')
      
      if (!ctx) {
        console.error('No se pudo obtener el contexto del canvas')
        return
      }

      // Configurar dimensiones del card
      const cardPadding = 40
      const cardBorderRadius = 20
      const cardShadow = 20
      const chartsGap = 30
      const paramsPanelWidth = 300
      
      const chartsWidth = Math.max(tempCanvas.width, outputCanvas.width)
      const chartsHeight = tempCanvas.height + outputCanvas.height + chartsGap
      const cardWidth = chartsWidth + paramsPanelWidth + cardPadding * 3
      const cardHeight = chartsHeight + cardPadding * 2
      
      combinedCanvas.width = cardWidth + cardShadow * 2
      combinedCanvas.height = cardHeight + cardShadow * 2

      // Configurar contexto
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Dibujar sombra del card
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = cardShadow
      ctx.shadowOffsetX = cardShadow
      ctx.shadowOffsetY = cardShadow

      // Dibujar fondo del card con bordes redondeados
      ctx.fillStyle = '#1e293b'
      roundRect(ctx, cardShadow, cardShadow, cardWidth, cardHeight, cardBorderRadius)
      ctx.fill()

      // Resetear sombra
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Dibujar gráficas en el lado izquierdo
      const chartsX = cardShadow + cardPadding
      const chartsY = cardShadow + cardPadding
      
      ctx.drawImage(tempCanvas, chartsX, chartsY)
      ctx.drawImage(outputCanvas, chartsX, chartsY + tempCanvas.height + chartsGap)

      // Dibujar panel de parámetros en el lado derecho
      const paramsX = cardShadow + cardPadding + chartsWidth + cardPadding
      const paramsY = cardShadow + cardPadding
      
      // Fondo del panel de parámetros
      ctx.fillStyle = '#334155'
      roundRect(ctx, paramsX, paramsY, paramsPanelWidth, cardHeight - cardPadding * 2, 15)
      ctx.fill()

      // Título del panel
      ctx.fillStyle = '#f8fafc'
      ctx.font = 'bold 18px Inter, system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('Parámetros PID', paramsX + 20, paramsY + 30)

             console.log('📊 Obteniendo parámetros...')
       // Obtener parámetros actuales del estado
       const currentData = state.currentData
       const rangeData = getDataForRange()
       
       console.log('📊 Datos obtenidos:', {
         currentData: !!currentData,
         rangeDataLength: rangeData.length,
         state: state
       })
       
               if (currentData && rangeData.length > 0) {
          const latestData = rangeData[rangeData.length - 1]
          console.log('✅ Datos obtenidos correctamente:', latestData)
        } else {
          console.warn('⚠️ No hay datos suficientes, usando datos por defecto')
          // Usar datos por defecto si no hay datos reales
          const defaultData = {
            SP: 25,
            PV: 0,
            u: 0,
            t: 0
          }
          const defaultCurrentData = {
            PID: { kp: 2.0, ki: 0.1, kd: 10 },
            plant: { K: 0.03, tau: 90, L: 3, T_amb: 25 }
          }
          
          // Continuar con datos por defecto
          const latestData = defaultData
          const currentData = defaultCurrentData
        
        // Configurar fuente para parámetros
        ctx.font = '14px Inter, system-ui, sans-serif'
        ctx.textAlign = 'left'
        
        let yOffset = paramsY + 70
        
        // Parámetros del controlador
        ctx.fillStyle = '#e2e8f0'
        ctx.font = 'bold 14px Inter, system-ui, sans-serif'
        ctx.fillText('Controlador:', paramsX + 20, yOffset)
        yOffset += 25
        
        ctx.fillStyle = '#cbd5e1'
        ctx.font = '13px Inter, system-ui, sans-serif'
        ctx.fillText(`Kp: ${currentData.PID?.kp?.toFixed(2) || 'N/A'}`, paramsX + 20, yOffset)
        yOffset += 20
        ctx.fillText(`Ki: ${currentData.PID?.ki?.toFixed(3) || 'N/A'} s⁻¹`, paramsX + 20, yOffset)
        yOffset += 20
        ctx.fillText(`Kd: ${currentData.PID?.kd?.toFixed(1) || 'N/A'} s`, paramsX + 20, yOffset)
        yOffset += 30

        // Parámetros de la planta
        ctx.fillStyle = '#e2e8f0'
        ctx.font = 'bold 14px Inter, system-ui, sans-serif'
        ctx.fillText('Planta:', paramsX + 20, yOffset)
        yOffset += 25
        
        ctx.fillStyle = '#cbd5e1'
        ctx.font = '13px Inter, system-ui, sans-serif'
        ctx.fillText(`K: ${currentData.plant?.K?.toFixed(3) || 'N/A'}`, paramsX + 20, yOffset)
        yOffset += 20
        ctx.fillText(`τ: ${currentData.plant?.tau?.toFixed(1) || 'N/A'} s`, paramsX + 20, yOffset)
        yOffset += 20
        ctx.fillText(`L: ${currentData.plant?.L?.toFixed(1) || 'N/A'} s`, paramsX + 20, yOffset)
        yOffset += 20
        ctx.fillText(`T_amb: ${currentData.plant?.T_amb?.toFixed(1) || 'N/A'}°C`, paramsX + 20, yOffset)
        yOffset += 30

        // Estado actual
        ctx.fillStyle = '#e2e8f0'
        ctx.font = 'bold 14px Inter, system-ui, sans-serif'
        ctx.fillText('Estado Actual:', paramsX + 20, yOffset)
        yOffset += 25
        
        ctx.fillStyle = '#cbd5e1'
        ctx.font = '13px Inter, system-ui, sans-serif'
        ctx.fillText(`SP: ${latestData?.SP?.toFixed(1) || 'N/A'}°C`, paramsX + 20, yOffset)
        yOffset += 20
        ctx.fillText(`PV: ${latestData?.PV?.toFixed(1) || 'N/A'}°C`, paramsX + 20, yOffset)
        yOffset += 20
        ctx.fillText(`Salida: ${(latestData?.u * 100)?.toFixed(1) || 'N/A'}%`, paramsX + 20, yOffset)
        yOffset += 20
        ctx.fillText(`Tiempo: ${latestData?.t?.toFixed(1) || 'N/A'}s`, paramsX + 20, yOffset)
        yOffset += 30

        // Métricas de rendimiento
        if (state.metrics) {
          ctx.fillStyle = '#e2e8f0'
          ctx.font = 'bold 14px Inter, system-ui, sans-serif'
          ctx.fillText('Métricas:', paramsX + 20, yOffset)
          yOffset += 25
          
          ctx.fillStyle = '#cbd5e1'
          ctx.font = '13px Inter, system-ui, sans-serif'
          ctx.fillText(`Overshoot: ${state.metrics.overshoot?.toFixed(1) || 'N/A'}%`, paramsX + 20, yOffset)
          yOffset += 20
          ctx.fillText(`T. Est.: ${state.metrics.settling_time?.toFixed(1) || 'N/A'}s`, paramsX + 20, yOffset)
        }
      }

      console.log('🎨 Vista previa generada exitosamente')
      setPreviewCanvas(combinedCanvas)
    } catch (error) {
      console.error('❌ Error generando vista previa:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExport = () => {
    const range = exportRange === 'window' 
      ? { type: 'window' as const, seconds: 60 } 
      : { type: 'all' as const }
    
    onExport(range)
    onClose()
  }

     // Obtener datos según el rango seleccionado
   const getDataForRange = () => {
     console.log('📊 getDataForRange - Estado actual:', {
       bufferLength: state.buffer?.length || 0,
       exportRange,
       currentData: state.currentData
     })
     
     if (!state.buffer || state.buffer.length === 0) {
       console.warn('⚠️ No hay datos en el buffer')
       return []
     }
     
     if (exportRange === 'window') {
       // Usar datos de la ventana de 60s
       const windowData = state.buffer.slice(-600) // 60s * 10 muestras/s = 600 muestras
       console.log(`📊 Datos de ventana: ${windowData.length} muestras`)
       return windowData
     } else {
       // Usar todos los datos
       console.log(`📊 Todos los datos: ${state.buffer.length} muestras`)
       return state.buffer
     }
   }

  const handleRefresh = () => {
    setPreviewCanvas(null)
    generatePreview()
  }

  return (
         <Dialog open={isOpen} onOpenChange={onClose}>
       <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-[hsl(var(--notion-background))] border-[hsl(var(--notion-border))] backdrop-blur-md shadow-2xl">
        <DialogHeader className="border-b border-[hsl(var(--notion-border))] pb-4">
          <DialogTitle className="flex items-center gap-2 text-[hsl(var(--notion-text))]">
            <FileImage className="h-5 w-5 text-[hsl(var(--notion-blue))]" />
            Vista Previa de Exportación
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--notion-text-secondary))]">
            Revisa cómo se verá la imagen exportada antes de descargarla
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Controles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[hsl(var(--notion-text))]">Rango:</span>
                <select
                  value={exportRange}
                  onChange={(e) => setExportRange(e.target.value as 'window' | 'all')}
                  className="px-3 py-1.5 text-sm border border-[hsl(var(--notion-border))] rounded-md bg-[hsl(var(--notion-background))] text-[hsl(var(--notion-text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--notion-blue))] focus:border-transparent transition-all duration-200"
                >
                  <option value="window">Ventana (60s)</option>
                  <option value="all">Todo</option>
                </select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isGenerating}
                className="flex items-center gap-2 notion-button"
              >
                <Eye className="h-4 w-4" />
                Actualizar
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="notion-button">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleExport} disabled={!previewCanvas || isGenerating} className="notion-button-primary">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

                     {/* Vista previa */}
           <div 
             ref={previewRef}
             className="border border-[hsl(var(--notion-border))] rounded-lg overflow-auto bg-[hsl(var(--notion-background))] flex items-center justify-center min-h-[500px] shadow-inner"
           >
             {isGenerating ? (
               <div className="flex flex-col items-center gap-4 text-[hsl(var(--notion-text-secondary))]">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--notion-blue))]"></div>
                 <span>Generando vista previa...</span>
               </div>
             ) : previewCanvas ? (
               <div className="p-4 w-full flex justify-center">
                 <canvas
                   ref={(canvas) => {
                     if (canvas && previewCanvas) {
                       const ctx = canvas.getContext('2d')
                       if (ctx) {
                         // Escalar el canvas para que quepa en la vista previa
                         const maxWidth = 800
                         const maxHeight = 600
                         const scaleX = maxWidth / previewCanvas.width
                         const scaleY = maxHeight / previewCanvas.height
                         const scale = Math.min(scaleX, scaleY, 0.8) // Permitir escalado hasta 80% del original
                         
                         canvas.width = previewCanvas.width * scale
                         canvas.height = previewCanvas.height * scale
                         
                         // Limpiar el canvas
                         ctx.clearRect(0, 0, canvas.width, canvas.height)
                         
                         // Configurar suavizado
                         ctx.imageSmoothingEnabled = true
                         ctx.imageSmoothingQuality = 'high'
                         
                         // Dibujar la imagen escalada
                         ctx.drawImage(previewCanvas, 0, 0, canvas.width, canvas.height)
                         
                         console.log('🎨 Canvas renderizado exitosamente:', {
                           originalSize: { width: previewCanvas.width, height: previewCanvas.height },
                           scaledSize: { width: canvas.width, height: canvas.height },
                           scale,
                           canvasVisible: canvas.offsetWidth > 0 && canvas.offsetHeight > 0
                         })
                       } else {
                         console.error('❌ No se pudo obtener el contexto del canvas')
                       }
                     } else {
                       console.warn('⚠️ Canvas o previewCanvas no disponible')
                     }
                   }}
                   className="border border-[hsl(var(--notion-border))] rounded-lg shadow-lg max-w-full max-h-full"
                   style={{ display: 'block' }}
                 />
               </div>
             ) : (
               <div className="text-center text-[hsl(var(--notion-text-secondary))]">
                 <FileImage className="h-12 w-12 mx-auto mb-2 opacity-50" />
                 <p>No se pudo generar la vista previa</p>
               </div>
             )}
           </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
