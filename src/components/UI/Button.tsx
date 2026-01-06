import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        const variants = {
            primary: "bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg",
            secondary: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm",
            outline: "border-2 border-gray-200 bg-transparent hover:border-gray-900 hover:text-gray-900 text-gray-600",
            ghost: "bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900",
        };

        const sizes = {
            sm: "h-9 px-4 text-xs rounded-full",
            md: "h-11 px-6 py-2 rounded-full",
            lg: "h-14 px-8 text-lg rounded-full",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";
