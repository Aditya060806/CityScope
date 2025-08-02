import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-button text-white rounded-2xl shadow-royal hover:shadow-glow hover:-translate-y-1 hover:scale-105",
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl shadow-md hover:shadow-lg hover:scale-105",
        outline: "border-2 border-royal bg-transparent text-royal rounded-2xl hover:bg-royal hover:text-white shadow-md hover:shadow-royal hover:scale-105",
        secondary: "bg-gradient-card text-royal rounded-2xl shadow-powder hover:shadow-lg hover:scale-105",
        ghost: "text-royal hover:bg-gradient-card rounded-xl hover:scale-105",
        link: "text-royal underline-offset-4 hover:underline hover:scale-105",
        bone: "bg-gradient-to-br from-bone to-bone/80 text-royal rounded-2xl shadow-bone hover:shadow-md hover:scale-105",
        gradient: "bg-gradient-civic text-white rounded-2xl shadow-royal hover:shadow-glow hover:scale-110",
        premium: "bg-gradient-to-r from-royal via-blue-600 to-royal text-white rounded-2xl shadow-glow hover:shadow-xl hover:-translate-y-2 hover:scale-105",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4 py-2 text-sm",
        lg: "h-14 rounded-2xl px-8 py-4 text-lg",
        icon: "h-12 w-12 rounded-xl",
        xl: "h-16 rounded-3xl px-10 py-5 text-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
