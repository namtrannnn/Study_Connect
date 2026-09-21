import React from 'react';
import { cn } from './utils';

const Input = React.forwardRef(
    (
        {
            className,
            type = 'text',
            icon: Icon,
            rightElement,
            error,
            size = 'default',
            containerClassName,
            ...props
        },
        ref,
    ) => {
        const sizes = {
            sm: 'h-9 text-xs px-3',
            default: 'h-11 text-xs sm:text-sm px-3.5',
            lg: 'h-12 text-sm px-4',
        };

        return (
            <div className={cn('relative flex w-full items-center group', containerClassName)}>
                {Icon && (
                    <div className="pointer-events-none absolute left-3.5 flex items-center justify-center text-gray-400 transition-colors group-focus-within:text-blue-500 dark:text-gray-500 dark:group-focus-within:text-blue-400">
                        <Icon size={16} />
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        'flex w-full rounded-2xl border border-blue-200/80 bg-white/95 text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#1a1d26] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20',
                        sizes[size],
                        Icon && 'pl-10',
                        rightElement && 'pr-28',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                        className,
                    )}
                    ref={ref}
                    {...props}
                />
                {rightElement && (
                    <div className="absolute right-1.5 flex items-center">
                        {rightElement}
                    </div>
                )}
            </div>
        );
    },
);

Input.displayName = 'Input';

export { Input };
