import { useEffect, useRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

/**
 * Emoji picker popup
 * @param {Function} onSelect - callback nhận emoji string
 * @param {Function} onClose - đóng picker
 * @param {'up'|'down'} position - hiện phía trên hay dưới nút trigger
 */
function EmojiPicker({ onSelect, onClose, position = 'up' }) {
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                onClose?.();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className={`absolute z-[9999] ${position === 'up' ? 'bottom-12' : 'top-12'} right-0`}
            style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))' }}
        >
            <Picker
                data={data}
                onEmojiSelect={(e) => {
                    onSelect?.(e.native);
                    onClose?.();
                }}
                locale="vi"
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={2}
            />
        </div>
    );
}

export default EmojiPicker;
