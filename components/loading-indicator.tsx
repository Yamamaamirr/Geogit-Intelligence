"use client"

import { useState, useEffect } from "react"

interface LoadingIndicatorProps {
  isVisible: boolean
}

export function LoadingIndicator({ isVisible }: LoadingIndicatorProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [particleCount] = useState(12)
  const [particles, setParticles] = useState<
    Array<{ x: number; y: number; size: number; speed: number; opacity: number }>
  >([])

  const loadingMessages = [
    "Analyzing geo data...",
    "Processing spatial information...",
    "Parsing satellite imagery...",
    "Evaluating topographic features...",
    "Interpreting vector layers...",
  ]

  useEffect(() => {
    if (!isVisible) return

    // Initialize particles
    const newParticles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      speed: 0.2 + Math.random() * 0.3,
      opacity: 0.3 + Math.random() * 0.7,
    }))
    setParticles(newParticles)

    // Message rotation
    const messageInterval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length)
    }, 2000)

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
      clearInterval(messageInterval)
      clearInterval(particleInterval)
    }
  }, [isVisible, loadingMessages.length, particleCount])

  if (!isVisible) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#1A1A1E]/90 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-6 max-w-xs w-full px-6">
        {/* Unique, professional animation */}
        <div className="relative h-24 w-24">
          {/* Hexagonal background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 bg-blue-500/5 rounded-full"></div>
            <svg className="absolute" width="100" height="100" viewBox="0 0 100 100">
              <polygon
                points="50,10 85,30 85,70 50,90 15,70 15,30"
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

          {/* Rotating elements */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-16 w-16">
              {/* Outer ring */}
              <svg
                className="absolute animate-spin"
                style={{ animationDuration: "8s" }}
                width="64"
                height="64"
                viewBox="0 0 64 64"
              >
                <circle cx="32" cy="32" r="28" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" fill="none" />
                <circle cx="32" cy="4" r="3" fill="rgba(59, 130, 246, 0.8)" />
              </svg>

              {/* Middle ring */}
              <svg
                className="absolute animate-spin"
                style={{ animationDuration: "6s", animationDirection: "reverse" }}
                width="64"
                height="64"
                viewBox="0 0 64 64"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="22"
                  stroke="rgba(59, 130, 246, 0.2)"
                  strokeWidth="1"
                  fill="none"
                  strokeDasharray="4 2"
                />
                <circle cx="32" cy="10" r="2" fill="rgba(59, 130, 246, 0.6)" />
              </svg>

              {/* Inner ring */}
              <svg
                className="absolute animate-spin"
                style={{ animationDuration: "4s" }}
                width="64"
                height="64"
                viewBox="0 0 64 64"
              >
                <circle cx="32" cy="32" r="16" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" fill="none" />
                <circle cx="32" cy="16" r="2" fill="rgba(59, 130, 246, 0.6)" />
              </svg>

              {/* Center element */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 animate-pulse shadow-lg shadow-blue-500/30"></div>
              </div>
            </div>
          </div>

          {/* Pulsing glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-blue-500/20 animate-ping"></div>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2 w-full">
          <div className="text-sm font-medium text-white flex items-center">
            <span className="text-blue-400 mr-2">GeoLLM</span> Processing
          </div>

          <div className="h-5 text-xs text-blue-400 min-w-[180px] text-center">{loadingMessages[messageIndex]}</div>

          {/* Progress bar */}
          <div className="w-full mt-2 h-0.5 bg-blue-500/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500/50 animate-progress"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
