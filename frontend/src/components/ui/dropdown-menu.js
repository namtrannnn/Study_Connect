import React, { useEffect, useRef, useState, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

/* CONTENT — renders via portal to escape overflow:hidden */
export function DropdownMenuContent({ align = 'end', className, children }) {
    const { open, setOpen, ref } = useDropdownMenu();
    const contentRef = useRef(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    // Calculate position based on trigger element
    useEffect(() => {
        if (!open || !ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;

        setPos({
            top: rect.bottom + scrollY + 8,
            left: align === 'end'
                ? rect.right + scrollX
                : rect.left + scrollX,
        });
    }, [open, align, ref]);

    // Close on scroll
    useEffect(() => {
        if (!open) return;
        const onScroll = () => setOpen(false);
        window.addEventListener('scroll', onScroll, true);
        return () => window.removeEventListener('scroll', onScroll, true);
    }, [open, setOpen]);

    if (!open) return null;

    return createPortal(
        <div
            ref={contentRef}
            style={{
                position: 'fixed',
                top: pos.top - (window.scrollY || 0),
                ...(align === 'end'
                    ? { right: window.innerWidth - (ref.current?.getBoundingClientRect().right || 0) }
                    : { left: ref.current?.getBoundingClientRect().left || 0 }),
                zIndex: 99999,
            }}
            className={cn(
                'min-w-[180px] rounded-xl border border-gray-200 bg-white shadow-lg p-1 dark:border-white/10 dark:bg-[#1e2028]',
                className,
            )}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {children}
        </div>,
        document.body,
    );
}

/* ITEM */
export function DropdownMenuItem({ className, onClick, onSelect, children }) {
    const { setOpen } = useDropdownMenu();

    const handleClick = (e) => {
        e.stopPropagation();

        if (onSelect) {
            // onSelect can call e.preventDefault() to keep dropdown open
            const syntheticEvent = { preventDefault: () => { /* noop handled below */ }, _defaultPrevented: false };
            syntheticEvent.preventDefault = () => { syntheticEvent._defaultPrevented = true; };
            onSelect(syntheticEvent);
            if (!syntheticEvent._defaultPrevented) {
                setOpen(false);
            }
        } else {
            onClick?.(e);
            setOpen(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={cn('w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-white/10', className)}
        >
            {children}
        </button>
    );
}
