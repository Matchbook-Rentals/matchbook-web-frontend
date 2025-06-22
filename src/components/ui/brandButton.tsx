import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const brandButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-secondaryBrand text-white hover:bg-primaryBrand transition-colors",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-primaryBrand bg-background text-primaryBrand hover:bg-primaryBrand hover:text-white transition-all duration-300",
        secondary:
          "bg-secondaryBrand text-white hover:bg-secondaryBrand/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "bg-transparent text-gray-600 hover:text-gray-900 transition-none rounded-none px-0 py-0 min-w-0",
      },
      size: {
        default: "h-[40px] min-w-[160px] rounded-md px-[14px] py-[10px] gap-1 font-['Poppins'] font-semibold text-sm leading-5 tracking-normal",
        sm: "h-[36px] min-w-[156px] rounded-md px-4 py-3 gap-1 font-['Poppins'] font-semibold text-sm leading-5 tracking-normal",
        lg: "h-[44px] min-w-[179px] rounded-md px-5 py-[10px] gap-2 font-['Poppins'] font-semibold text-base leading-6 tracking-normal",
        xl: "h-[48px] min-w-[183px] rounded-md px-[18px] py-3 gap-2 font-['Poppins'] font-semibold text-base leading-6 tracking-normal",
        "2xl": "h-[60px] min-w-[219px] rounded-md px-[22px] py-5 gap-[10px] font-['Poppins'] font-semibold text-lg leading-7 tracking-normal",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BrandButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof brandButtonVariants> {
  asChild?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const BrandButton = React.forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ className, variant, size, asChild = false, leftIcon, rightIcon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Special handling for link variant with 2xl size
    const isLink2xl = variant === "link" && size === "2xl"
    const link2xlClasses = isLink2xl ? "h-[28px] gap-4" : ""
    
    return (
      <Comp
        className={cn(
          brandButtonVariants({ variant, size, className }),
          link2xlClasses
        )}
        ref={ref}
        {...props}
      >
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Comp>
    )
  }
)
BrandButton.displayName = "BrandButton"

export { BrandButton, brandButtonVariants }