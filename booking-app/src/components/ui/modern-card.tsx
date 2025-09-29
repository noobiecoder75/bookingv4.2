import * as React from "react"
import { cn } from "@/lib/utils"

const ModernCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "elevated" | "outline" | "ghost"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm",
    elevated: "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300",
    outline: "border-2 border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors duration-200",
    ghost: "bg-gray-50 dark:bg-gray-800/50 border-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl p-6 transition-all duration-200",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
ModernCard.displayName = "ModernCard"

const ModernCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-2 mb-4", className)} {...props} />
))
ModernCardHeader.displayName = "ModernCardHeader"

const ModernCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight",
      className
    )}
    {...props}
  />
))
ModernCardTitle.displayName = "ModernCardTitle"

const ModernCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-gray-600 dark:text-gray-300", className)} {...props} />
))
ModernCardContent.displayName = "ModernCardContent"

export { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent }