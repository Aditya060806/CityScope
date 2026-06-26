import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white shadow-soft hover:bg-slate-800 hover:shadow-sleek hover:-translate-y-0.5",
        destructive:
          "bg-red-600 text-white shadow-soft hover:bg-red-700 hover:shadow-sleek hover:-translate-y-0.5",
        outline:
          "border border-slate-200 bg-white text-slate-700 shadow-soft hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 hover:-translate-y-0.5",
        secondary:
          "bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200/80 hover:-translate-y-0.5",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl",
        link:
          "text-indigo-600 underline-offset-4 hover:underline hover:text-indigo-700",
        success:
          "bg-emerald-600 text-white shadow-soft hover:bg-emerald-700 hover:shadow-sleek hover:-translate-y-0.5",
        warning:
          "bg-amber-600 text-white shadow-soft hover:bg-amber-700 hover:shadow-sleek hover:-translate-y-0.5",
        royal:
          "bg-slate-900 text-white shadow-soft hover:bg-slate-800 hover:shadow-sleek hover:-translate-y-0.5",
        powder:
          "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:-translate-y-0.5",
        bone:
          "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:-translate-y-0.5",
        premium:
          "bg-slate-900 text-white shadow-royal hover:bg-slate-800 hover:shadow-sleek-lg hover:-translate-y-0.5",
        quiet:
          "bg-white/80 text-slate-600 border border-transparent hover:bg-white hover:border-slate-200",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
