import { ChevronDown, ChevronUp } from 'lucide-react';

export default function SliderMenu({ items, showMore, setShowMore }) {
    return (
        <>
            {items.map((item) => (
                <a
                    key={item.id}
                    href={item.path}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors group"
                >
                    <div className="shrink-0">{item.icon}</div>
                    <span className="font-medium text-foreground group-hover:text-foreground">{item.title}</span>
                </a>
            ))}

            <button
                onClick={() => setShowMore(!showMore)}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors w-full text-left"
            >
                <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center">
                    {showMore ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
                <span className="font-medium">{showMore ? 'Ẩn bớt' : 'Xem thêm'}</span>
            </button>
        </>
    );
}
