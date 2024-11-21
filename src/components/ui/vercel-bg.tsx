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

function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

export default function VercelBackground({ children }: VercelBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const pointsRef = useRef<Point[]>([])

    const seed = 12345

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animationFrameId: number
        let mouse = { x: 0, y: 0 }

        const colors = {
            background: '#000',
            point: 'rgba(255, 255, 255, 0.7)',
            line: 'rgba(255, 255, 255, 0.05)'
        }

        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            if (pointsRef.current.length === 0) {
                initPoints()
            }
        }

        const initPoints = () => {
            const density = 2000
            const numPoints = Math.floor((canvas.width * canvas.height) / density)

            for (let i = 0; i < numPoints; i++) {
                const x = seededRandom(seed + i) * canvas.width
                const y = seededRandom(seed + i + numPoints) * canvas.height
                pointsRef.current.push({
                    x,
                    y,
                    size: 1,
                    speed: 0.03 + seededRandom(seed + i + 2 * numPoints) * 0.02,
                    angle: seededRandom(seed + i + 3 * numPoints) * Math.PI * 2
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

            for (let i = 0; i < pointsRef.current.length; i++) {
                for (let j = i + 1; j < pointsRef.current.length; j++) {
                    const pointI = pointsRef.current[i]
                    const pointJ = pointsRef.current[j]
                    if (pointI && pointJ) {
                        const dx = pointI.x - pointJ.x
                        const dy = pointI.y - pointJ.y
                        const distance = Math.sqrt(dx * dx + dy * dy)

                        if (distance < 80) {
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
            pointsRef.current.forEach((point) => {
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

            pointsRef.current.forEach((point) => {
                point.x += Math.cos(point.angle) * point.speed
                point.y += Math.sin(point.angle) * point.speed

                const dx = mouse.x - point.x
                const dy = mouse.y - point.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance < 60) {
                    point.x -= dx * 0.01
                    point.y -= dy * 0.01
                }

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
            if (e.touches[0]) {
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
            <canvas ref={canvasRef} className="absolute inset-0 -z-10" />
            {children}
        </div>
    )
}
