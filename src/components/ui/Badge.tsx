import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.ComponentProps<"div"> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
  className?: string;
  children?: React.ReactNode;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 w-max",
        {
          "border-transparent bg-primary-600 text-white shadow-xs": variant === "default",
          "border border-sky-200 bg-sky-50 text-black font-semibold": variant === "secondary",
          "border-rose-200 bg-rose-50 text-rose-950 font-bold": variant === "destructive",
          "border-emerald-200 bg-emerald-50 text-emerald-950 font-bold": variant === "success",
          "border-amber-200 bg-amber-50 text-amber-950 font-bold": variant === "warning",
          "border-sky-200 bg-sky-100 text-sky-950 font-bold": variant === "info",
          "text-black border-slate-300 bg-white": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
