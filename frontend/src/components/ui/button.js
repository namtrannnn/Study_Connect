import React from 'react';
import { cn } from './utils';

const base =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all ' +
    'disabled:pointer-events-none disabled:opacity-50 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-white hover:bg-destructive/90',
    outline: 'border bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
};

const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3',
    lg: 'h-10 rounded-md px-6',
    icon: 'h-9 w-9 p-0',
};

function Button({ className, variant = 'default', size = 'default', type = 'button', ...props }) {
    return <button type={type} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

export { Button };
