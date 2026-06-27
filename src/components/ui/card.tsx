import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sleek",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/40 before:via-transparent before:to-blue-50/60 before:opacity-0 group-hover:opacity-100 before:transition-opacity before:duration-300",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-2 p-6 relative z-10", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-bold text-xl text-slate-900 leading-tight tracking-tight group-hover:text-royal/90 transition-colors duration-300", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-300", className)} {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0 relative z-10", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center justify-between p-6 pt-0 relative z-10", className)} {...props} />
))
CardFooter.displayName = "CardFooter"

// Additional sleek card variants
const CardSleek = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-powder/5 shadow-sleek transition-all duration-300 ease-out hover:shadow-sleek-lg hover:-translate-y-1 hover:border-royal/20 group relative overflow-hidden",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-royal/5 before:via-transparent before:to-powder/10 before:opacity-0 group-hover:opacity-100 before:transition-opacity before:duration-300",
      className
    )}
    {...props}
  />
))
CardSleek.displayName = "CardSleek"

const CardGlass = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl border border-white/60 bg-white/80 backdrop-blur-md shadow-sleek transition-all duration-300 ease-out hover:shadow-sleek-lg hover:-translate-y-0.5 hover:bg-white group relative overflow-hidden",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:via-royal/5 before:to-powder/10 before:opacity-0 group-hover:opacity-100 before:transition-opacity before:duration-300",
      className
    )}
    {...props}
  />
))
CardGlass.displayName = "CardGlass"

const CardPremium = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl border border-royal/20 bg-gradient-to-br from-royal/5 via-white to-powder/10 shadow-sleek-lg transition-all duration-300 ease-out hover:shadow-sleek-xl hover:-translate-y-1 hover:border-royal/30 group relative overflow-hidden",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-royal/10 before:via-powder/10 before:to-bone/20 before:opacity-0 group-hover:opacity-100 before:transition-opacity before:duration-300",
      "after:absolute after:inset-0 after:bg-gradient-to-br after:from-transparent after:via-white/10 after:to-transparent after:opacity-0 group-hover:opacity-100 after:transition-opacity after:duration-300",
      className
    )}
    {...props}
  />
))
CardPremium.displayName = "CardPremium"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardSleek, CardGlass, CardPremium }