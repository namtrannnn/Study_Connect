import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function SlidePanel({
    title,
    onClose,
    children,
    sidebarWidth = 72,
    headerHeight = 59,
    panelWidth = 380,
    open = true,
}) {
    // khóa scroll body giống IG
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => (document.body.style.overflow = prev);
    }, [open]);

    // ESC để đóng
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onClose?.();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <>
            {/* overlay phủ phần bên phải sidebar + panel */}
            <div
                className="fixed z-[9998] bg-black/35"
                onClick={onClose}
                style={{
                    top: headerHeight,
                    left: panelWidth, // 👈 chuẩn IG: không phủ lên panel
                    right: 0,
                    bottom: 0,
                }}
            />

            {/* panel */}
            <div
                className="fixed z-[9999] bg-background border border-border shadow-xl overflow-hidden"
                style={{
                    top: headerHeight,
                    left: 0,
                    width: panelWidth,
                    height: `calc(100vh - ${headerHeight}px)`,
                }}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="text-lg font-semibold">{title}</div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-muted transition"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="h-full overflow-y-auto">{children}</div>
            </div>
        </>,
        document.body,
    );
}
