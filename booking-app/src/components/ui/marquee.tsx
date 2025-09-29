import * as React from "react"
import { cn } from "@/lib/utils"

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  reverse?: boolean
  pauseOnHover?: boolean
  vertical?: boolean
  repeat?: number
  speed?: "slow" | "normal" | "fast"
}

const Marquee = React.forwardRef<HTMLDivElement, MarqueeProps>(
  ({
    className,
    reverse = false,
    pauseOnHover = false,
    vertical = false,
    repeat = 4,
    speed = "normal",
    children,
    ...props
  }, ref) => {
    const speeds = {
      slow: "60s",
      normal: "40s",
      fast: "20s"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex overflow-hidden",
          vertical ? "flex-col" : "flex-row",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "flex shrink-0 gap-4",
            vertical ? "animate-marquee-vertical flex-col" : "animate-marquee flex-row",
            pauseOnHover && "hover:[animation-play-state:paused]"
          )}
          style={{
            animationDirection: reverse ? "reverse" : "normal",
            animationDuration: speeds[speed]
          }}
        >
          {Array.from({ length: repeat }).map((_, i) => (
            <React.Fragment key={i}>
              {children}
            </React.Fragment>
          ))}
        </div>

        <style jsx>{`
          @keyframes marquee {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-100%);
            }
          }

          @keyframes marquee-vertical {
            from {
              transform: translateY(0);
            }
            to {
              transform: translateY(-100%);
            }
          }
        `}</style>
      </div>
    )
  }
)
Marquee.displayName = "Marquee"

export { Marquee }