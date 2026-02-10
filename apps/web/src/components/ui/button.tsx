import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/src/lib/cn";

type ButtonVariant = "primary" | "secondary" | "text";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-kira-black text-kira-offwhite hover:bg-kira-darkgray active:bg-kira-black disabled:bg-kira-darkgray",
  secondary:
    "border border-kira-darkgray bg-transparent text-kira-darkgray hover:bg-kira-warmgray/18 active:bg-kira-warmgray/28",
  text: "bg-transparent text-kira-darkgray hover:text-kira-black",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      className={cn(
        "kira-focus-ring inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
