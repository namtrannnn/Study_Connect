import { useEffect, useState } from 'react';
import { Sparkles, Loader2, Check, ChevronDown } from 'lucide-react';
import { generateRoomThemeWithAI, getPresetThemes } from '../../../services/chatServices';
import roomChatApi from '../roomChatApi';
import { getRoomId } from '../helpers';
import { toast } from 'react-toastify';

function ThemeSection({ room, onRoomUpdated, themeStyles = {} }) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('preset');
    const [presets, setPresets] = useState([]);
    const [fetchingPresets, setFetchingPresets] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [loadingAI, setLoadingAI] = useState(false);
    const [loadingPreset, setLoadingPreset] = useState('');
    const [aiMsg, setAiMsg] = useState('');

    const roomId = getRoomId(room);
    const currentThemeName = room?.themeConfig?.name || 'Default';

    // Chỉ fetch presets khi mở lần đầu
    useEffect(() => {
        if (!open || fetched) return;
        setFetchingPresets(true);
        getPresetThemes()
            .then((data) => {
                setPresets(data);
                setFetched(true);
            })
            .catch(() => {})
            .finally(() => setFetchingPresets(false));
    }, [open, fetched]);

    const handleSelectPreset = async (preset) => {
        if (loadingPreset) return;
        try {
            setLoadingPreset(preset.name);
            const res = await roomChatApi.updateTheme(roomId, { ...preset, prompt: '' });
            onRoomUpdated(res.data?.data || res.data);
            toast.success(`Đã đổi theme: ${preset.name}`);
        } catch {
            toast.error('Đổi theme thất bại');
        } finally {
            setLoadingPreset('');
        }
    };

    const handleGenerateAI = async () => {
        if (!prompt.trim()) {
            setAiMsg('Nhập mô tả theme trước.');
            return;
        }
        try {
            setLoadingAI(true);
            setAiMsg('');
            const data = await generateRoomThemeWithAI({ roomId, prompt: prompt.trim() });
            onRoomUpdated({ ...room, themeConfig: data?.themeConfig || data });
            setAiMsg(
                data?.coverImageGenerated
                    ? '✓ Tạo theme và ảnh cover thành công!'
                    : data?.coverImageError || '✓ Đã tạo màu, chưa có ảnh cover.',
            );
        } catch (e) {
            setAiMsg(e?.response?.data?.message || 'Tạo theme thất bại.');
        } finally {
            setLoadingAI(false);
        }
    };

    return (
        <div
            className="overflow-hidden rounded-2xl border"
            style={{
                backgroundColor: themeStyles.header?.backgroundColor || 'white',
                borderColor: themeStyles.isDark ? 'rgba(255,255,255,0.08)' : 'rgb(219 234 254)',
            }}
        >
            {/* Header — toggle */}
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="flex w-full items-center justify-between px-3 py-2.5 transition"
                style={{ backgroundColor: themeStyles.isDark ? 'rgba(255,255,255,0.05)' : 'rgb(239 246 255 / 0.6)' }}
            >
                <div className="flex items-center gap-2">
                    <span
                        className="text-[15px] font-normal tracking-widest"
                        style={themeStyles.isDark ? { color: 'rgba(241,245,249,0.5)' } : { color: '#94a3b8' }}
                    >
                        Chủ đề
                    </span>
                    {currentThemeName !== 'Default' && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                            {currentThemeName}
                        </span>
                    )}
                </div>
                <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    style={themeStyles.isDark ? { color: 'rgba(241,245,249,0.4)' } : { color: '#94a3b8' }}
                />
            </button>

            {/* Body */}
            {open && (
                <>
                    {/* Tabs */}
                    <div className="flex border-b border-blue-50 dark:border-white/5">
                        <button
                            type="button"
                            onClick={() => setTab('preset')}
                            className={`flex-1 py-2.5 text-xs font-semibold transition ${tab === 'preset' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            Có sẵn
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('ai')}
                            className={`flex-1 py-2.5 text-xs font-semibold transition ${tab === 'ai' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            <span className="flex items-center justify-center gap-1">
                                <Sparkles className="h-3 w-3" /> AI tạo
                            </span>
                        </button>
                    </div>

                    {/* Preset grid */}
                    {tab === 'preset' && (
                        <div className="p-3">
                            {fetchingPresets ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-5 gap-2">
                                    {presets.map((preset) => {
                                        const isActive = currentThemeName === preset.name;
                                        const isLoading = loadingPreset === preset.name;
                                        return (
                                            <button
                                                key={preset.name}
                                                type="button"
                                                onClick={() => handleSelectPreset(preset)}
                                                disabled={!!loadingPreset}
                                                title={preset.name}
                                                className={`flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition disabled:opacity-60 ${isActive ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-[#181b22]' : 'hover:bg-blue-50 dark:hover:bg-white/5'}`}
                                            >
                                                <div
                                                    className="relative h-9 w-9 overflow-hidden rounded-full shadow-sm"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${preset.bubbleMe} 50%, ${preset.background} 50%)`,
                                                    }}
                                                >
                                                    {(isActive || isLoading) && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                                                            {isLoading ? (
                                                                <Loader2 className="h-3 w-3 animate-spin text-white" />
                                                            ) : (
                                                                <Check className="h-3.5 w-3.5 text-white" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <span
                                                    className={`text-[9px] font-semibold leading-none ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}
                                                >
                                                    {preset.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* AI tab */}
                    {tab === 'ai' && (
                        <div className="p-3">
                            <p className="mb-2 text-xs leading-relaxed text-gray-400">
                                Mô tả theme bạn muốn, AI sẽ tự tạo bảng màu phù hợp.
                            </p>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={3}
                                placeholder="Ví dụ: 'Tông xanh biển cả, tươi mát'"
                                className="w-full resize-none rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
                            />
                            {aiMsg && (
                                <p
                                    className={`mt-1.5 text-[11px] leading-snug ${aiMsg.startsWith('✓') ? 'text-green-500' : 'text-gray-400'}`}
                                >
                                    {aiMsg}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={handleGenerateAI}
                                disabled={loadingAI}
                                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                            >
                                {loadingAI ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-3.5 w-3.5" /> Tạo theme bằng AI
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default ThemeSection;
