import { UserRound } from 'lucide-react';

function TypingIndicator({ name }) {
    return (
        <div className="msg-other flex items-end gap-2">
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <UserRound className="h-4 w-4" />
            </div>
            <div className="flex flex-col items-start">
                {name && <div className="mb-1 px-1 text-xs font-medium text-gray-500">{name}</div>}
                <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-md border border-blue-100 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#181b22]">
                    <span className="typing-dot h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500" />
                    <span className="typing-dot h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500" />
                    <span className="typing-dot h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500" />
                </div>
            </div>
        </div>
    );
}

export default TypingIndicator;
