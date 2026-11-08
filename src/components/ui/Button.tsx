import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "teal" | "yellow";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-coral hover:bg-coral-dark text-white shadow-sm active:scale-95",
  secondary: "bg-soft-gray dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-navy dark:text-white active:scale-95",
  ghost: "bg-transparent hover:bg-soft-gray dark:hover:bg-gray-800 text-navy dark:text-white active:scale-95",
  danger: "bg-red-100 hover:bg-red-200 text-red-700 active:scale-95",
  teal: "bg-teal hover:bg-teal-dark text-white shadow-sm active:scale-95",
  yellow: "bg-yellow hover:bg-yellow-dark text-navy shadow-sm active:scale-95",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-xl",
  md: "px-6 py-3 text-sm rounded-2xl",
  lg: "px-8 py-4 text-base rounded-2xl",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        "font-bold transition-all duration-150 inline-flex items-center justify-center gap-2 select-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        disabled || loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        className,
      ].filter(Boolean).join(" ")}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
