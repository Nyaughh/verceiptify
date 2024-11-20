'use client'

import React, { ReactNode, useRef, useEffect } from 'react'

interface Point {
  x: number
  y: number
  size: number
  speed: number
  angle: number
}

interface VercelBackgroundProps {
  children: ReactNode
}

export default function VercelBackground({ children }: VercelBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let points: Point[] = []
    let mouse = { x: 0, y: 0 }

    const colors = {
      background: '#000',
      point: 'rgba(255, 255, 255, 0.7)',
      line: 'rgba(255, 255, 255, 0.05)',
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initPoints()
    }

    const initPoints = () => {
      points = []
      const density = 2000 // Reduced density for fewer points
      const numPoints = Math.floor((canvas.width * canvas.height) / density)

      for (let i = 0; i < numPoints; i++) {
        points.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 1, // Fixed size for all points
          speed: 0.03 + Math.random() * 0.02, // Slower movement
          angle: Math.random() * Math.PI * 2,
        })
      }
    }

    const drawBackground = () => {
      ctx.fillStyle = colors.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const drawLines = () => {
      ctx.strokeStyle = colors.line
      ctx.lineWidth = 0.5

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const pointI = points[i];
          const pointJ = points[j];
          if (pointI && pointJ) { // Check if points are defined
            const dx = pointI.x - pointJ.x
            const dy = pointI.y - pointJ.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 80) { // Reduced connection distance
              ctx.beginPath()
              ctx.moveTo(pointI.x, pointI.y)
              ctx.lineTo(pointJ.x, pointJ.y)
              ctx.stroke()
            }
          }
        }
      }
    }

    const drawPoints = () => {
      ctx.fillStyle = colors.point
      points.forEach((point) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawBackground()
      drawLines()
      drawPoints()

      points.forEach((point) => {
        point.x += Math.cos(point.angle) * point.speed
        point.y += Math.sin(point.angle) * point.speed

        // Minimal cursor interaction
        const dx = mouse.x - point.x
        const dy = mouse.y - point.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < 60) { // Reduced interaction radius
          point.x -= dx * 0.01
          point.y -= dy * 0.01
        }

        // Boundary check
        if (point.x < 0 || point.x > canvas.width) point.angle = Math.PI - point.angle
        if (point.y < 0 || point.y > canvas.height) point.angle = -point.angle
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    animate()

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches[0]) { // Check if touches[0] is defined
        mouse.x = e.touches[0].clientX
        mouse.y = e.touches[0].clientY
      }
    }

    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 -z-10"
      />
      {children}
    </div>
  )
}