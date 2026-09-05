import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

const variantClasses: Record<string, string> = {
  default: 'bg-[#6C63FF] text-white hover:bg-[#5a53d6] shadow-sm',
  outline: 'border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800',
  ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600',
}

const sizeClasses: Record<string, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button({ className, variant = 'default', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] disabled:opacity-50 disabled:pointer-events-none',
        'font-sans',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
}
