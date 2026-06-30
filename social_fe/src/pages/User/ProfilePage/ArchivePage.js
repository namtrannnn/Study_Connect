import { useState } from 'react';

export default function ArchivePage({ onBack }) {
    const [activeTab, setActiveTab] = useState('saved');

    const archiveData = {
        saved: [
            {
                id: 1,
                title: 'Bài viết đã lưu 1',
                type: 'Ảnh',
                date: '12/03/2026',
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
            },
            {
                id: 2,
                title: 'Bài viết đã lưu 2',
                type: 'Reel',
                date: '10/03/2026',
                image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
            },
            {
                id: 3,
                title: 'Bài viết đã lưu 3',
                type: 'Ảnh',
                date: '08/03/2026',
                image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
            },
            {
                id: 4,
                title: 'Bài viết đã lưu 4',
                type: 'Story',
                date: '05/03/2026',
                image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
            },
            {
                id: 5,
                title: 'Bài viết đã lưu 5',
                type: 'Ảnh',
                date: '01/03/2026',
                image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
            },
            {
                id: 6,
                title: 'Bài viết đã lưu 6',
                type: 'Reel',
                date: '27/02/2026',
                image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
            },
        ],
        oldPhotos: [
            {
                id: 7,
                title: 'Ảnh cũ 1',
                type: 'Ảnh',
                date: '20/01/2026',
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
            },
            {
                id: 8,
                title: 'Ảnh cũ 2',
                type: 'Ảnh',
                date: '15/01/2026',
                image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
            },
            {
                id: 9,
                title: 'Ảnh cũ 3',
                type: 'Ảnh',
                date: '09/01/2026',
                image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
            },
        ],
        drafts: [
            {
                id: 10,
                title: 'Bài nháp lookbook tháng 3',
                type: 'Nháp',
                date: '18/03/2026',
                image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
            },
            {
                id: 11,
                title: 'Bài nháp cafe cuối tuần',
                type: 'Nháp',
                date: '17/03/2026',
                image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
            },
        ],
    };

    const currentItems = archiveData[activeTab];

    const tabButtonClass = (tab) =>
        `rounded-2xl px-4 py-2 text-sm font-medium transition ${
            activeTab === tab
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
        }`;

    return (
        <div className="min-h-screen bg-[#fafafa] text-neutral-900">
            <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-8">
                <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onBack}
                                    className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-neutral-50"
                                >
                                    ← Quay lại
                                </button>
                                <div>
                                    <h1 className="text-2xl font-semibold">Kho lưu trữ</h1>
                                    <p className="mt-1 text-sm text-neutral-500">
                                        Quản lý những nội dung đã lưu, ảnh cũ và bài nháp của bạn
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                            Tổng mục:{' '}
                            <span className="font-semibold text-neutral-900">
                                {archiveData.saved.length + archiveData.oldPhotos.length + archiveData.drafts.length}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button className={tabButtonClass('saved')} onClick={() => setActiveTab('saved')}>
                            Đã lưu
                        </button>
                        <button className={tabButtonClass('oldPhotos')} onClick={() => setActiveTab('oldPhotos')}>
                            Ảnh cũ
                        </button>
                        <button className={tabButtonClass('drafts')} onClick={() => setActiveTab('drafts')}>
                            Bài nháp
                        </button>
                    </div>
                </div>

                <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm md:p-5">
                    {currentItems.length === 0 ? (
                        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 text-center">
                            <div className="text-5xl">📦</div>
                            <h2 className="mt-4 text-lg font-semibold">Chưa có nội dung</h2>
                            <p className="mt-2 max-w-md text-sm text-neutral-500">
                                Khi bạn lưu bài viết, thêm ảnh cũ hoặc tạo bài nháp, nội dung sẽ xuất hiện ở đây.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                            {currentItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                >
                                    <div className="relative aspect-square overflow-hidden bg-neutral-100">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/35" />
                                        <div className="absolute bottom-3 left-3 right-3 translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                            <div className="rounded-xl bg-white/90 px-3 py-2 backdrop-blur-sm">
                                                <div className="text-xs font-semibold text-neutral-900">
                                                    {item.type}
                                                </div>
                                                <div className="mt-1 text-[11px] text-neutral-600">{item.date}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <h3 className="line-clamp-1 text-sm font-semibold text-neutral-900">
                                            {item.title}
                                        </h3>
                                        <p className="mt-1 text-xs text-neutral-500">Loại: {item.type}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
