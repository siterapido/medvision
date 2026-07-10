import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success/20 dark:focus-visible:ring-success/40",
        cta: "rounded-xl border border-[#0e7490]/40 bg-[linear-gradient(135deg,#0891b2_0%,#06b6d4_100%)] text-white font-semibold shadow-[0_10px_35px_rgba(6,182,212,0.45)] hover:shadow-[0_18px_45px_rgba(6,182,212,0.5)] hover:bg-[linear-gradient(135deg,#0e7490_0%,#0891b2_100%)] active:scale-95 focus-visible:ring-primary/40 focus-visible:ring-offset-0",
        blue: "rounded-xl border border-[#0e7490]/30 bg-[linear-gradient(135deg,#0891b2_0%,#06b6d4_100%)] text-white font-semibold shadow-[0_10px_30px_rgba(8,145,178,0.35)] hover:bg-[linear-gradient(135deg,#0e7490_0%,#0891b2_100%)] hover:shadow-[0_16px_40px_rgba(6,182,212,0.45)] active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-14 rounded-xl px-8 text-base font-semibold has-[>svg]:px-6",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/** Spinner inline usado durante loading state */
function ButtonSpinner() {
  return (
    <svg
      className="animate-spin size-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Exibe spinner e desabilita o botão enquanto uma ação está em andamento */
  isLoading?: boolean
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  // Slot (asChild) exige exatamente 1 elemento filho — spinner/span quebram Children.only
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    )
  }

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && <ButtonSpinner />}
      {/* children invisível mas ocupa espaço para não pular layout */}
      <span className={isLoading ? "invisible" : undefined}>{children}</span>
    </Comp>
  )
}

export { Button, buttonVariants }
