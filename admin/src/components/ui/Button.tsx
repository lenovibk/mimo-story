import { Link, type LinkProps } from "react-router-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "danger-solid" | "ghost";
type Size = "sm" | "md";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-sky-600 text-white hover:bg-sky-700 disabled:hover:bg-sky-600",
  secondary: "border border-slate-300 text-slate-600 hover:bg-slate-50",
  danger: "text-red-500 hover:bg-red-50",
  "danger-solid": "bg-red-500 text-white hover:bg-red-600",
  ghost: "text-sky-600 hover:bg-sky-50",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

function classes(variant: Variant, size: Size, className?: string) {
  return `inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className ?? ""}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export function Button({ variant = "primary", size = "md", icon, className, children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={classes(variant, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

/** Same visual language as Button, for navigation actions ("+ Thêm bài học") that must stay real links. */
export function ButtonLink({ variant = "primary", size = "md", icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={classes(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
