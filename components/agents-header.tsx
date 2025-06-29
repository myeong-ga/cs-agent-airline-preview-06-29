"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plane, HelpCircle, MapPin, Calendar, XCircle, Briefcase, Users, RefreshCw, Zap } from "lucide-react"
import { useAgentAnimation } from "@/hooks/use-agent-animation"
import type { AgentInfo } from "@/types/chat"
import type { JSX } from "react"

interface AgentsHeaderProps {
  agents: AgentInfo[]
  currentAgent: string
  isLoading: boolean
  onRefresh?: () => void
  onAgentSelect?: (agentName: string) => void
}

const getAgentIcon = (agentName: string) => {
  const iconMap: Record<string, JSX.Element> = {
    "Triage Agent": <Users className="h-4 w-4" />,
    "FAQ Agent": <HelpCircle className="h-4 w-4" />,
    "Seat Booking Agent": <MapPin className="h-4 w-4" />,
    "Flight Status Agent": <Calendar className="h-4 w-4" />,
    "Cancellation Agent": <XCircle className="h-4 w-4" />,
    "Baggage Agent": <Briefcase className="h-4 w-4" />,
  }
  return iconMap[agentName] || <Plane className="h-4 w-4" />
}

const getAgentColor = (agentName: string, isActive: boolean, isAnimated: boolean) => {
  const colorMap: Record<string, { active: string; inactive: string; animated: string }> = {
    "Triage Agent": {
      active: "bg-accent hover:bg-accent/90 text-white border-accent  animate-pulse shadow-md shadow-accent/50 font-semibold",
      inactive: "bg-accent/10 hover:bg-accent/20 text-accent/70 border-accent/20",
      animated:
        "bg-accent hover:bg-accent/90 text-white border-accent animate-pulse shadow-lg shadow-accent/50 font-semibold",
    },
    "FAQ Agent": {
      active: "bg-primary hover:bg-primary/90 text-white border-primary shadow-md font-semibold",
      inactive: "bg-primary/10 hover:bg-primary/20 text-primary/70 border-primary/20",
      animated:
        "bg-primary hover:bg-primary/90 text-white border-primary animate-pulse shadow-lg shadow-primary/50 font-semibold",
    },
    "Seat Booking Agent": {
      active: "bg-chart-4 hover:bg-chart-4/90 text-white border-chart-4 shadow-md font-semibold",
      inactive: "bg-chart-4/10 hover:bg-chart-4/20 text-chart-4/70 border-chart-4/20",
      animated:
        "bg-chart-4 hover:bg-chart-4/90 text-white border-chart-4 animate-pulse shadow-lg shadow-chart-4/50 font-semibold",
    },
    "Flight Status Agent": {
      active: "bg-secondary hover:bg-secondary/90 text-white border-secondary shadow-md font-semibold",
      inactive: "bg-secondary/10 hover:bg-secondary/20 text-secondary/70 border-secondary/20",
      animated:
        "bg-secondary hover:bg-secondary/90 text-white border-secondary animate-pulse shadow-lg shadow-secondary/50 font-semibold",
    },
    "Cancellation Agent": {
      active: "bg-destructive hover:bg-destructive/90 text-white border-destructive shadow-md font-semibold",
      inactive: "bg-destructive/10 hover:bg-destructive/20 text-destructive/70 border-destructive/20",
      animated:
        "bg-destructive hover:bg-destructive/90 text-white border-destructive animate-pulse shadow-lg shadow-destructive/50 font-semibold",
    },
    "Baggage Agent": {
      active: "bg-chart-5 hover:bg-chart-5/90 text-white border-chart-5 shadow-md font-semibold",
      inactive: "bg-chart-5/10 hover:bg-chart-5/20 text-chart-5/70 border-chart-5/20",
      animated:
        "bg-chart-5 hover:bg-chart-5/90 text-white border-chart-5 animate-pulse shadow-lg shadow-chart-5/50 font-semibold",
    },
  }

  const colors = colorMap[agentName] || {
    active: "bg-muted hover:bg-muted/90 text-white border-border shadow-md font-semibold",
    inactive: "bg-muted/10 hover:bg-muted/20 text-muted-foreground/70 border-border/20",
    animated:
      "bg-muted hover:bg-muted/90 text-white border-border animate-pulse shadow-lg shadow-muted/50 font-semibold",
  }

  if (isAnimated) return colors.animated
  if (isActive) return colors.active
  return colors.inactive
}

export function AgentsHeader({ agents, currentAgent, isLoading, onRefresh, onAgentSelect }: AgentsHeaderProps) {
  const { isAnimating, phase, cycleCount, startAnimation, stopAnimation, isAgentAnimated, isAgentActive } =
    useAgentAnimation({
      agents,
      currentAgent,
      onAnimationComplete: () => {
        console.log("Agent animation completed!")
      },
    })

  const handleRefresh = async () => {
    if (isAnimating) {
      stopAnimation()
      return
    }

    // Start the animation first
    startAnimation()

    // Then trigger the actual refresh
    onRefresh?.()
  }

  if (isLoading && !isAnimating) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
        <span className="text-sm text-muted-foreground">Loading agents...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex flex-wrap gap-2">
        {agents.map((agent, index) => {
          const isActive = isAgentActive(agent.name)
          const isAnimated = isAgentAnimated(index)
          const shortcutNumber = index + 1

          return (
            <Button
              key={agent.name}
              variant="default"
              size="sm"
              className={`${getAgentColor(agent.name, isActive, isAnimated)} relative transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isAnimated ? "transform scale-105" : ""
              }`}
              disabled={ !(isActive && !isAnimating)}
              onClick={() => onAgentSelect?.(agent.name)}
              aria-label={`${agent.name} (Alt+${shortcutNumber})`}
              tabIndex={0}
            >
              {getAgentIcon(agent.name)}
              <span className="ml-2">{agent.name}</span>
             
              {isAnimated && (
                <div className="absolute -top-1 -right-1">
                  <Zap className="h-3 w-3 text-yellow-400 animate-bounce" />
                </div>
              )}
            </Button>
          )
        })}
      </div>

      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className={`text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 ${
            isAnimating ? "text-primary hover:text-primary/80" : ""
          }`}
          aria-label={isAnimating ? "Stop agent animation" : "Refresh agents"}
          disabled={isLoading && !isAnimating}
        >
          <RefreshCw
            className={`h-4 w-4 transition-transform duration-300 ${isAnimating ? "animate-spin text-primary" : ""}`}
          />
          {isAnimating && (
            <div className="ml-2 flex items-center space-x-1">
              <span className="text-xs text-primary font-medium">
                {phase === "sequential" ? `Cycle ${cycleCount + 1}` : "Random"}
              </span>
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}
