"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseAgentAnimationOptions {
  agents: Array<{ name: string }>
  currentAgent: string
  onAnimationComplete?: () => void
}

interface AnimationState {
  isAnimating: boolean
  activeIndex: number
  phase: "sequential" | "random"
  cycleCount: number
}

export function useAgentAnimation({ agents, currentAgent, onAnimationComplete }: UseAgentAnimationOptions) {
  const [animationState, setAnimationState] = useState<AnimationState>({
    isAnimating: false,
    activeIndex: -1,
    phase: "sequential",
    cycleCount: 0,
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startAnimation = useCallback(() => {
    if (animationState.isAnimating) return

    setAnimationState({
      isAnimating: true,
      activeIndex: 0,
      phase: "sequential",
      cycleCount: 0,
    })

    let currentIndex = 0
    let cycleCount = 0
    let phase: "sequential" | "random" = "sequential"
    const totalDuration = 5000 // 10 seconds
    const sequentialCycles = 20 // Number of complete cycles before going random
    let intervalDuration = 300 // Base interval duration

    const animate = () => {
      if (phase === "sequential") {
        currentIndex = (currentIndex + 1) % agents.length

        // Check if we completed a full cycle
        if (currentIndex === 0) {
          cycleCount++
        }

        //Switch to random phase after specified cycles
        if (cycleCount >= sequentialCycles) {
          phase = "random"
        }
      } else {
        // Random phase
        const availableIndices = agents.map((_, index) => index).filter((index) => index !== currentIndex)
        currentIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
      }

      setAnimationState((prev) => ({
        ...prev,
        activeIndex: currentIndex,
        phase,
        cycleCount,
      }))
    }

    // Start the animation loop
    intervalRef.current = setInterval(animate, intervalDuration)

    // Stop animation after total duration
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      setAnimationState({
        isAnimating: false,
        activeIndex: -1,
        phase: "sequential",
        cycleCount: 0,
      })

      onAnimationComplete?.()
    }, totalDuration)
  }, [agents.length, animationState.isAnimating, onAnimationComplete])

  const stopAnimation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setAnimationState({
      isAnimating: false,
      activeIndex: -1,
      phase: "sequential",
      cycleCount: 0,
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Determine if an agent should appear active
  const isAgentAnimated = useCallback(
    (index: number) => {
      if (!animationState.isAnimating) return false
      return animationState.activeIndex === index
    },
    [animationState.isAnimating, animationState.activeIndex],
  )

  // Determine if an agent is actually active (not just animated)
  const isAgentActive = useCallback(
    (agentName: string) => {
      if (animationState.isAnimating) return false
      return agentName === currentAgent
    },
    [animationState.isAnimating, currentAgent],
  )

  return {
    isAnimating: animationState.isAnimating,
    phase: animationState.phase,
    cycleCount: animationState.cycleCount,
    startAnimation,
    stopAnimation,
    isAgentAnimated,
    isAgentActive,
  }
}
