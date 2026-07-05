import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { cn } from './utils';

const DropdownMenuContext = createContext(null);

/* ROOT */
export function DropdownMenu({ children }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onDown = (e) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, []);

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen, ref }}>
            <div ref={ref} className="relative inline-block">
                {children}
            </div>
        </DropdownMenuContext.Provider>
    );
}

function useDropdownMenu() {
    const ctx = useContext(DropdownMenuContext);
    if (!ctx) throw new Error('DropdownMenu components must be used inside <DropdownMenu>');
    return ctx;
}

/* TRIGGER */
export function DropdownMenuTrigger({ asChild, children }) {
    const { open, setOpen } = useDropdownMenu();

    const triggerProps = {
        onClick: (e) => {
            e.stopPropagation();
            setOpen(!open);
        },
    };

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            ...triggerProps,
            ...children.props,
        });
    }

    return (
        <button type="button" {...triggerProps}>
            {children}
        </button>
    );
}

/* CONTENT */
export function DropdownMenuContent({ align = 'end', className, children }) {
    const { open } = useDropdownMenu();
    if (!open) return null;

    const alignClass = align === 'end' ? 'right-0' : 'left-0';

    return (
        <div
            className={cn(
                `absolute ${alignClass} mt-2 min-w-[160px] rounded-md border bg-white shadow-md p-1 z-[9999]`,
                className,
            )}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {children}
        </div>
    );
}

/* ITEM */
export function DropdownMenuItem({ className, onClick, children }) {
    const { setOpen } = useDropdownMenu();

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
                setOpen(false);
            }}
            className={cn('w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100', className)}
        >
            {children}
        </button>
    );
}
