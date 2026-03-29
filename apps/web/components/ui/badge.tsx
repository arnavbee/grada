import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-kira-brown/30 focus-visible:ring-offset-2 focus-visible:ring-offset-kira-offwhite dark:focus-visible:ring-offset-[#141b18] [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-kira-black/10 bg-kira-black text-kira-offwhite dark:border-white/10 dark:bg-kira-offwhite dark:text-[#141b18]",
        secondary:
          "border-kira-warmgray/40 bg-kira-warmgray/20 text-kira-black dark:border-white/10 dark:bg-white/8 dark:text-kira-offwhite",
        destructive: "border-red-200 bg-red-100 text-red-800",
        outline:
          "border-kira-darkgray/20 bg-transparent text-kira-darkgray dark:border-white/12 dark:text-kira-midgray",
        ghost:
          "border-transparent bg-white/60 text-kira-darkgray dark:bg-white/8 dark:text-kira-midgray",
        link: "border-transparent px-0 text-kira-black underline-offset-4 hover:underline dark:text-kira-offwhite",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
