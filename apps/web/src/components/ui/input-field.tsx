import type { InputHTMLAttributes } from "react";

import { cn } from "@/src/lib/cn";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function InputField({
  className,
  label,
  hint,
  error,
  id,
  ...props
}: InputFieldProps): JSX.Element {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label className="block" htmlFor={fieldId}>
      <span className="mb-1 block text-sm font-medium text-kira-darkgray">{label}</span>
      <input
        className={cn(
          "kira-focus-ring w-full border-0 border-b bg-transparent px-0 pb-2 pt-1 text-kira-black placeholder:text-kira-midgray",
          error ? "border-kira-warmgray" : "border-kira-midgray/55",
          "focus:border-kira-brown",
          className,
        )}
        id={fieldId}
        {...props}
      />
      {error ? (
        <small className="mt-1 block text-kira-warmgray">{error}</small>
      ) : hint ? (
        <small className="mt-1 block text-kira-midgray">{hint}</small>
      ) : null}
    </label>
  );
}
