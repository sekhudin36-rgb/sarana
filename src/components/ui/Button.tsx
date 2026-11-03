import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            "bg-primary-600 text-white shadow-md shadow-primary-500/20 hover:bg-primary-700 active:scale-95": variant === "default",
            "bg-rose-600 text-white shadow-sm hover:bg-rose-700": variant === "destructive",
            "border border-sky-200 bg-white text-black shadow-xs hover:bg-sky-50 hover:border-sky-300 hover:text-black": variant === "outline",
            "bg-sky-100 text-black hover:bg-sky-200": variant === "secondary",
            "hover:bg-sky-50 text-black hover:text-primary-700": variant === "ghost",
            "text-primary-600 underline-offset-4 hover:underline font-semibold": variant === "link",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-lg px-3 text-xs": size === "sm",
            "h-11 rounded-xl px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
