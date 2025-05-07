"use client"

import { useState, useEffect } from "react"

interface LoadingIndicatorProps {
  isVisible: boolean
}

export function LoadingIndicator({ isVisible }: LoadingIndicatorProps) {
  const [particleCount] = useState(6)
  const [particles, setParticles] = useState<
    Array<{ x: number; y: number; size: number; speed: number; opacity: number }>
  >([])

  useEffect(() => {
    if (!isVisible) return

    // Initialize particles
    const newParticles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      speed: 0.2 + Math.random() * 0.3,
      opacity: 0.3 + Math.random() * 0.7,
    }))
    setParticles(newParticles)

    // Particle animation
    const particleInterval = setInterval(() => {
      setParticles((prevParticles) =>
        prevParticles.map((particle) => ({
          ...particle,
          y: (particle.y - particle.speed) % 100,
          opacity: particle.y < 10 ? particle.y / 10 : particle.y > 90 ? (100 - particle.y) / 10 : particle.opacity,
        })),
      )
    }, 50)

    return () => {
      clearInterval(particleInterval)
    }
  }, [isVisible, particleCount])

  if (!isVisible) return null

  return (
    <div className="relative h-8 w-8">
      {/* Hexagonal background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-6 w-6 bg-blue-500/5 rounded-full"></div>
        <svg className="absolute" width="32" height="32" viewBox="0 0 32 32">
          <polygon
            points="16,3 27,9 27,22 16,28 5,22 5,9"
            fill="none"
            stroke="rgba(59, 130, 246, 0.3)"
            strokeWidth="1"
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* Particles */}
      <div className="absolute inset-0">
        {particles.map((particle, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-blue-400"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
            }}
          />
        ))}
      </div>

      {/* Center element */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-3 w-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 animate-pulse shadow-lg shadow-blue-500/30"></div>
      </div>
    </div>
  )
}
