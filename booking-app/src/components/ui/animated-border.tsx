import * as React from "react"
import { cn } from "@/lib/utils"

interface AnimatedBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  duration?: number
  colorFrom?: string
  colorTo?: string
  reverse?: boolean
}

const AnimatedBorder = React.forwardRef<HTMLDivElement, AnimatedBorderProps>(
  ({ className, duration = 3, colorFrom = "#3b82f6", colorTo = "#8b5cf6", reverse = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden rounded-xl", className)}
        {...props}
      >
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(90deg, ${colorFrom}, ${colorTo}, ${colorFrom})`,
            backgroundSize: "300% 100%",
            padding: "2px",
            animation: `borderAnimation ${duration}s linear infinite ${reverse ? 'reverse' : ''}`
          }}
        >
          <div className="h-full w-full rounded-xl bg-white dark:bg-gray-900">
            {children}
          </div>
        </div>
        <style jsx>{`
          @keyframes borderAnimation {
            0% {
              background-position: 0% 50%;
            }
            100% {
              background-position: 300% 50%;
            }
          }
        `}</style>
      </div>
    )
  }
)
AnimatedBorder.displayName = "AnimatedBorder"

export { AnimatedBorder }