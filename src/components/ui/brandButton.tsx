import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import Link from "next/link"

import { cn } from "@/lib/utils"

const brandButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
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
        link: "bg-transparent text-secondaryBrand hover:text-primaryBrand transition-none  rounded-none px-0 py-0 min-w-0",
      },
      size: {
        default: "h-[40px] min-w-[160px] rounded-lg px-[14px] py-[10px] gap-1 font-['Poppins'] font-semibold text-sm leading-5 tracking-normal",
        sm: "h-[36px] min-w-[156px] rounded-lg px-4 py-3 gap-1 font-['Poppins'] font-semibold text-sm leading-5 tracking-normal",
        lg: "h-[44px] min-w-[179px] rounded-lg px-5 py-[10px] gap-2 font-['Poppins'] font-semibold text-base leading-6 tracking-normal",
        xl: "h-[48px] min-w-[183px] rounded-lg px-[18px] py-3 gap-2 font-['Poppins'] font-semibold text-base leading-6 tracking-normal",
        "2xl": "h-[60px] min-w-[219px] rounded-lg px-[22px] py-5 gap-[10px] font-['Poppins'] font-semibold text-lg leading-7 tracking-normal",
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
  href?: string
  ringOffsetColor?: string
  ringInset?: boolean
}

const BrandButton = React.forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ className, variant, size, asChild = false, leftIcon, rightIcon, children, href, ringOffsetColor, ringInset, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Special handling for link variant with 2xl size
    const isLink2xl = variant === "link" && size === "2xl"
    const link2xlClasses = isLink2xl ? "h-[28px] gap-4" : ""
    
    // If href is provided, render as non-interactive div with Link overlay
    if (href) {
      // Create group-hover versions of the hover styles
      const getGroupHoverClasses = (variant: string) => {
        switch (variant) {
          case "default":
            return "group-hover:bg-primaryBrand"
          case "destructive":
            return "group-hover:bg-destructive/90"
          case "outline":
            return "group-hover:bg-primaryBrand group-hover:text-white"
          case "secondary":
            return "group-hover:bg-secondaryBrand/80"
          case "ghost":
            return "group-hover:bg-accent group-hover:text-accent-foreground"
          case "link":
            return "group-hover:text-primaryBrand"
          default:
            return "group-hover:bg-primaryBrand"
        }
      }

      // Extract all focus-visible classes from className (including opacity syntax)
      const focusClasses = className?.match(/focus-visible:[\w-\/]+/g) || [];
      
      // Separate different types of focus classes
      const customFocusOutlineWidth = focusClasses.find(cls => cls.match(/focus-visible:outline-\d+/)) || "";
      const customFocusOutlineColor = focusClasses.find(cls => cls.match(/focus-visible:outline-\w+/) && !cls.match(/focus-visible:outline-\d+/) && !cls.match(/focus-visible:outline-offset/)) || "";
      const customOutlineOffset = focusClasses.find(cls => cls.match(/focus-visible:outline-offset-/)) || "";

      return (
        <div className="relative inline-block group">
          <div
            className={cn(
              brandButtonVariants({ variant, size }),
              link2xlClasses,
              "pointer-events-none select-none transition-all duration-300",
              getGroupHoverClasses(variant || "default"),
              // Remove focus styles from the visual div, keeping only other classes
              className?.replace(/focus-visible:[\w-]+/g, '').trim()
            )}
          >
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </div>
          <Link 
            href={href} 
            className={cn(
              "absolute inset-0 w-full h-full focus:outline-none focus-within:outline-none rounded-lg",
              // Only add default outline width if no custom one is provided
              !customFocusOutlineWidth && "focus-visible:outline-2",
              // Only add default outline color if no custom one is provided
              !customFocusOutlineColor && "focus-visible:outline-ring",
              // Only add default outline-offset if no custom one is provided and no prop provided and not inset
              !customOutlineOffset && !ringOffsetColor && !ringInset && "focus-visible:outline-offset-2",
              customFocusOutlineWidth,
              customFocusOutlineColor,
              customOutlineOffset,
              // Apply outline offset color from prop if provided
              ringOffsetColor && `focus-visible:outline-offset-${ringOffsetColor}`,
              // Apply outline inset if prop is true (though outline doesn't support inset, we'll keep the prop)
              ringInset && "focus-visible:outline-inset"
            )}
            tabIndex={0}
          />
        </div>
      )
    }
    
    const buttonContent = (
      <Comp
        className={cn(
          brandButtonVariants({ variant, size, className }),
          link2xlClasses,
          "focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        )}
        ref={ref}
        {...props}
      >
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Comp>
    )
    
    return buttonContent
  }
)
BrandButton.displayName = "BrandButton"

export { BrandButton, brandButtonVariants }
