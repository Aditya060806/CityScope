import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-200 shadow-sleek",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

// Cache of failed image URLs to prevent repeated 429 hammering on hot-reloads
const failedSrcs = new Set<string>();

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, onError, ...props }, ref) => {
  // If this src already failed (e.g. 429) don't even attempt to load it
  const shouldLoad = src && !failedSrcs.has(src);
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (src) failedSrcs.add(src);
    onError?.(e);
  };
  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={shouldLoad ? src : undefined}
      referrerPolicy="no-referrer"
      className={cn("aspect-square h-full w-full object-cover", className)}
      onError={handleError}
      {...props}
    />
  );
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-royal/10 text-royal font-bold text-sm",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }