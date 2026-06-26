import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-royal text-white shadow-sleek hover:bg-royal/80",
        secondary:
          "border-transparent bg-powder text-royal shadow-sleek hover:bg-powder/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sleek hover:bg-destructive/80",
        outline: "text-foreground border-gray-200 bg-white shadow-sleek",
        success:
          "border-transparent bg-success text-white shadow-sleek hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-white shadow-sleek hover:bg-warning/80",
        royal:
          "border-transparent bg-royal text-white shadow-sleek hover:bg-royal/80",
        powder:
          "border-transparent bg-powder text-royal shadow-sleek hover:bg-powder/80",
        bone:
          "border-transparent bg-bone text-royal shadow-sleek hover:bg-bone/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
