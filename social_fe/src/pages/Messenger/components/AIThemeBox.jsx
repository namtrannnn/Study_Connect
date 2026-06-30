import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { generateRoomThemeWithAI } from '../../../services/chatServices';

function AIThemeBox({ roomId, onThemeGenerated }) {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) { setMsg('Nhập mô tả theme trước.'); return; }
        try {
            setLoading(true); setMsg('');
            const data = await generateRoomThemeWithAI({ roomId, prompt: prompt.trim() });
            onThemeGenerated(data?.themeConfig || data);
            setMsg(data?.coverImageGenerated ? 'Tạo theme thành công!' : (data?.coverImageError || 'Đã tạo màu, chưa tạo được ảnh cover.'));
        } catch (e) {
            setMsg(e?.response?.data?.message || 'Tạo theme thất bại.');
        } finally { setLoading(false); }
    };

    return (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-3xl border border-blue-100 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#181b22]">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" /> AI tạo theme
            </div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
                placeholder="Mô tả theme bạn muốn, ví dụ: 'Tông xanh dương biển cả'"
                className="w-full resize-none rounded-2xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/5" />
            {msg && <p className="mt-1 text-xs text-gray-500">{msg}</p>}
            <button type="button" onClick={handleGenerate} disabled={loading}
                className="mt-2 w-full rounded-2xl bg-primary py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
                {loading ? 'Đang tạo...' : 'Tạo theme'}
            </button>
        </div>
    );
}

export default AIThemeBox;
