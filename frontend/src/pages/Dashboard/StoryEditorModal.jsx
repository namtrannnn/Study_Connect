import React, { useState, useRef, useEffect } from 'react';
import {
    X,
    Type,
    Music,
    Upload,
    Play,
    Pause,
    Check,
    Trash2,
    Globe,
    Users,
    Lock,
    Sparkles,
    Search,
    Volume2,
    ArrowRight,
    ArrowLeft,
    ChevronDown,
    Bold,
    Italic,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { searchJamendoTracks } from '../../services/jamendo.services';
import { createStory } from '../../services/story.services';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '../../components/ui/dropdown-menu';

const COLOR_PRESETS = [
    { type: 'color', label: 'Indigo', value: '#4f46e5' },
    { type: 'color', label: 'Purple', value: '#7c3aed' },
    { type: 'color', label: 'Pink', value: '#db2777' },
    { type: 'color', label: 'Teal', value: '#0d9488' },
    { type: 'color', label: 'Dark', value: '#09090b' },
    { type: 'gradient', label: 'Cyberpunk', value: 'linear-gradient(to bottom right, #8a2387, #e94057, #f27121)' },
    { type: 'gradient', label: 'Ocean', value: 'linear-gradient(to bottom right, #00c6ff, #0072ff)' },
    { type: 'gradient', label: 'Sunset', value: 'linear-gradient(to bottom right, #ff7e5f, #feb47b)' },
    { type: 'gradient', label: 'Emerald', value: 'linear-gradient(to bottom right, #11998e, #38ef7d)' },
    { type: 'gradient', label: 'Midnight', value: 'linear-gradient(to bottom right, #0f2027, #203a43, #2c5364)' },
];

const FONTS = [
    { label: 'Chuẩn', value: 'sans-serif' },
    { label: 'Serif Trang Nhã', value: 'serif' },
    { label: 'Monospace Code', value: 'monospace' },
    { label: 'Cursive Nghệ Thuật', value: 'cursive' },
    { label: 'Poppins Hiện Đại', value: 'Poppins, sans-serif' },
    { label: 'Outfit Sang Trọng', value: 'Outfit, sans-serif' },
];

const TEXT_COLOR_SWATCHES = ['#ffffff', '#000000', '#facc15', '#f43f5e', '#a855f7', '#3b82f6', '#10b981'];

function StoryEditorModal({ isOpen, onClose, onSuccess, currentUser }) {
    const [step, setStep] = useState(1);

    // Step 1: Background
    const [bgType, setBgType] = useState('color'); // 'color' | 'media'
    const [bgColor, setBgColor] = useState('#4f46e5');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState('');
    const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'

    // Step 2: Text Overlays
    const [textOverlays, setTextOverlays] = useState([]);
    const [selectedTextId, setSelectedTextId] = useState(null);
    const [showTextInputModal, setShowTextInputModal] = useState(false);
    const [editingText, setEditingText] = useState('');
    const [editingFont, setEditingFont] = useState('sans-serif');
    const [editingSize, setEditingSize] = useState(24);
    const [editingColor, setEditingColor] = useState('#ffffff');
    const [editingBold, setEditingBold] = useState(false);
    const [editingItalic, setEditingItalic] = useState(false);

    // Step 2: Music
    const [showMusicModal, setShowMusicModal] = useState(false);
    const [musicTab, setMusicTab] = useState('library'); // 'library' | 'upload'
    const [selectedMusic, setSelectedMusic] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [jamendoSearch, setJamendoSearch] = useState('');
    const [jamendoTracks, setJamendoTracks] = useState([]);
    const [loadingJamendo, setLoadingJamendo] = useState(false);
    const [previewAudioUrl, setPreviewAudioUrl] = useState(null);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const [musicStartTime, setMusicStartTime] = useState(0);

    // Step 3: Visibility
    const [visibility, setVisibility] = useState('public');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const previewContainerRef = useRef(null);
    const previewAudioRef = useRef(null);
    const editorAudioRef = useRef(null);

    // Live music preview playback during story editing
    useEffect(() => {
        if (!selectedMusic?.url) {
            if (editorAudioRef.current) {
                editorAudioRef.current.pause();
            }
            return;
        }

        const audio = editorAudioRef.current;
        if (audio) {
            audio.src = selectedMusic.url;
            audio.currentTime = musicStartTime || 0;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch((err) => console.log('Editor live audio play blocked:', err));
            }
        }
    }, [selectedMusic, musicStartTime]);

    useEffect(() => {
        if (showMusicModal && musicTab === 'library') {
            loadJamendoMusic('');
        }
    }, [showMusicModal, musicTab]);

    const loadJamendoMusic = async (q) => {
        setLoadingJamendo(true);
        try {
            const tracks = await searchJamendoTracks(q);
            setJamendoTracks(tracks);
        } catch (error) {
            console.log('Error loading Jamendo:', error);
        } finally {
            setLoadingJamendo(false);
        }
    };

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            toast.error('Dung lượng file tối đa là 50MB');
            return;
        }

        const isVid = file.type.startsWith('video/');
        setMediaType(isVid ? 'video' : 'image');
        setMediaFile(file);
        setBgType('media');

        const objectUrl = URL.createObjectURL(file);
        setMediaPreview(objectUrl);
        setStep(2);
    };

    const handleAddOrUpdateText = () => {
        if (!editingText.trim()) return;

        if (selectedTextId !== null) {
            setTextOverlays((prev) =>
                prev.map((item) =>
                    item.id === selectedTextId
                        ? {
                              ...item,
                              text: editingText,
                              fontFamily: editingFont,
                              fontSize: editingSize,
                              color: editingColor,
                              isBold: editingBold,
                              isItalic: editingItalic,
                          }
                        : item,
                ),
            );
        } else {
            const newOverlay = {
                id: Date.now(),
                text: editingText,
                fontFamily: editingFont,
                fontSize: editingSize,
                color: editingColor,
                isBold: editingBold,
                isItalic: editingItalic,
                position: { x: 50, y: 50 },
            };
            setTextOverlays((prev) => [...prev, newOverlay]);
        }

        setShowTextInputModal(false);
        setEditingText('');
        setSelectedTextId(null);
    };

    const handleEditText = (item) => {
        setSelectedTextId(item.id);
        setEditingText(item.text);
        setEditingFont(item.fontFamily || 'sans-serif');
        setEditingSize(item.fontSize || 24);
        setEditingColor(item.color || '#ffffff');
        setEditingBold(!!item.isBold);
        setEditingItalic(!!item.isItalic);
        setShowTextInputModal(true);
    };

    const handleDeleteText = (id) => {
        setTextOverlays((prev) => prev.filter((item) => item.id !== id));
    };

    const handleTextDragStart = (e, id) => {
        e.preventDefault();
        const container = previewContainerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();

        const onMouseMove = (moveEvent) => {
            const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

            let xPct = ((clientX - rect.left) / rect.width) * 100;
            let yPct = ((clientY - rect.top) / rect.height) * 100;

            xPct = Math.max(8, Math.min(92, xPct));
            yPct = Math.max(8, Math.min(92, yPct));

            setTextOverlays((prev) =>
                prev.map((item) => (item.id === id ? { ...item, position: { x: xPct, y: yPct } } : item)),
            );
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onMouseMove);
            window.removeEventListener('touchend', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onMouseMove);
        window.addEventListener('touchend', onMouseUp);
    };

    const handleTogglePreviewAudio = (audioUrl) => {
        if (previewAudioUrl === audioUrl && isPlayingPreview) {
            previewAudioRef.current?.pause();
            setIsPlayingPreview(false);
        } else {
            setPreviewAudioUrl(audioUrl);
            setIsPlayingPreview(true);
            if (previewAudioRef.current) {
                previewAudioRef.current.src = audioUrl;
                previewAudioRef.current.play().catch((err) => console.log('Audio preview block:', err));
            }
        }
    };

    const handleSelectJamendoTrack = (track) => {
        setSelectedMusic({
            url: track.audio,
            title: track.name,
            artist: track.artist_name,
            source: 'jamendo',
            startTime: 0,
            duration: 15,
        });
        setAudioFile(null);
        setShowMusicModal(false);
        if (previewAudioRef.current) previewAudioRef.current.pause();
    };

    const handleUploadMusicFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAudioFile(file);
        setSelectedMusic({
            url: URL.createObjectURL(file),
            title: file.name,
            artist: currentUser?.fullName || 'Tệp tải lên',
            source: 'upload',
            startTime: 0,
            duration: 15,
        });
        setShowMusicModal(false);
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const formData = new FormData();

            formData.append('bgType', bgType);
            formData.append('bgColor', bgColor);
            formData.append('visibility', visibility);

            if (bgType === 'media' && mediaFile) {
                formData.append('media', mediaFile);
            }

            if (textOverlays.length > 0) {
                formData.append('textOverlays', JSON.stringify(textOverlays));
            }

            if (selectedMusic) {
                const musicObj = {
                    ...selectedMusic,
                    startTime: musicStartTime,
                };
                formData.append('music', JSON.stringify(musicObj));
            }

            if (audioFile) {
                formData.append('audio', audioFile);
            }

            const res = await createStory(formData);

            if (res.code === 201) {
                toast.success('Đăng story thành công!');
                onSuccess?.(res.data);
                onClose();
            } else {
                toast.error(res.message || 'Không thể đăng story');
            }
        } catch (error) {
            console.error('Submit story error:', error);
            toast.error(error?.response?.data?.message || 'Lỗi hệ thống khi đăng story');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/65 p-3 sm:p-5 backdrop-blur-md animate-fadeIn select-none"
        >
            <audio ref={previewAudioRef} onEnded={() => setIsPlayingPreview(false)} hidden />
            <audio ref={editorAudioRef} loop hidden />

            <div
                onClick={(e) => e.stopPropagation()}
                className="relative flex h-full max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl"
            >
                <div className="flex w-full flex-col md:flex-row h-full">
                    {/* LEFT: FULL CANVAS PREVIEW */}
                    <div
                        ref={previewContainerRef}
                        className="relative flex-1 min-h-[420px] md:min-h-[550px] overflow-hidden bg-slate-900 flex items-center justify-center"
                        style={{
                            background: bgType === 'color' ? bgColor : '#000000',
                        }}
                    >
                        {/* Media Content */}
                        {bgType === 'media' && mediaPreview && (
                            mediaType === 'video' ? (
                                <video src={mediaPreview} autoPlay loop muted className="h-full w-full object-cover" />
                            ) : (
                                <img src={mediaPreview} alt="preview" className="h-full w-full object-cover" />
                            )
                        )}

                        {/* Text Overlays */}
                        {textOverlays.map((item) => (
                            <div
                                key={item.id}
                                onMouseDown={(e) => handleTextDragStart(e, item.id)}
                                onTouchStart={(e) => handleTextDragStart(e, item.id)}
                                onClick={() => handleEditText(item)}
                                style={{
                                    left: `${item.position.x}%`,
                                    top: `${item.position.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    fontFamily: item.fontFamily,
                                    fontSize: `${item.fontSize}px`,
                                    color: item.color,
                                    fontWeight: item.isBold ? 'bold' : 'normal',
                                    fontStyle: item.isItalic ? 'italic' : 'normal',
                                    textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                                }}
                                className="absolute cursor-grab active:cursor-grabbing text-center select-none border border-transparent hover:border-dashed hover:border-white/70 rounded-xl px-3 py-1 backdrop-blur-[1px] transition-all z-10"
                            >
                                {item.text}
                            </div>
                        ))}

                        {/* Music Badge Overlay */}
                        {selectedMusic && (
                            <div className="absolute top-5 left-5 z-20 flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-1.5 backdrop-blur-xl border border-white/20 text-xs shadow-lg animate-bounce">
                                <div className="flex items-end gap-0.5 h-3">
                                    <span className="w-0.5 h-full bg-pink-400 animate-pulse" />
                                    <span className="w-0.5 h-2/3 bg-purple-400 animate-pulse" />
                                    <span className="w-0.5 h-4/5 bg-indigo-400 animate-pulse" />
                                </div>
                                <div className="max-w-[160px] truncate font-semibold text-white">
                                    {selectedMusic.title} <span className="text-white/60 font-normal">• {selectedMusic.artist}</span>
                                </div>
                            </div>
                        )}

                        {textOverlays.length === 0 && bgType === 'color' && !showTextInputModal && (
                            <div
                                onClick={() => {
                                    setSelectedTextId(null);
                                    setEditingText('');
                                    setShowTextInputModal(true);
                                }}
                                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none z-10 group"
                            >
                                <button
                                    type="button"
                                    className="flex items-center gap-2 rounded-full bg-black/50 px-5 py-3 backdrop-blur-md border border-white/25 text-sm font-bold text-white shadow-2xl group-hover:scale-110 active:scale-95 transition-all duration-200"
                                >
                                    <Type size={18} className="text-indigo-400" /> Bấm vào đây để nhập chữ
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: EDITOR CONTROLS PANEL */}
                    <div className="flex w-full md:w-[380px] flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 dark:border-white/10 bg-white dark:bg-[#09090b] p-6 overflow-y-auto">
                        <div>
                            {/* Header & Step progress */}
                            <div className="mb-6 border-b border-slate-200 dark:border-white/10 pb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        Tạo Story Mới
                                    </h3>
                                    <div className="flex items-center gap-2.5">
                                        <span className="rounded-full bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 px-3 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-300">
                                            Bước {step}/3
                                        </span>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="rounded-full bg-slate-100 dark:bg-white/10 p-1.5 text-slate-500 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/20 transition hover:scale-105"
                                            title="Đóng"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                                        style={{ width: `${(step / 3) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* STEP 1: CHỌN NỀN */}
                            {step === 1 && (
                                <div className="space-y-5 animate-fadeIn">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">Tải Tệp Truyền Thông</label>
                                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-white/15 rounded-2xl p-6 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all duration-300 group">
                                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform mb-2">
                                                <Upload size={24} />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-800 dark:text-white">Chọn ảnh hoặc video từ máy</span>
                                            <span className="text-xs text-slate-500 dark:text-gray-400 mt-1">Ảnh (JPG, PNG) hoặc Video (MP4 &le; 60s)</span>
                                            <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    </div>

                                    <div className="relative flex items-center py-1">
                                        <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                                        <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest">Hoặc chọn màu sắc</span>
                                        <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                                    </div>

                                    <div>
                                        <div className="grid grid-cols-5 gap-2.5 mb-3">
                                            {COLOR_PRESETS.map((c, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => {
                                                        setBgColor(c.value);
                                                        setBgType('color');
                                                        setMediaFile(null);
                                                        setMediaPreview('');
                                                    }}
                                                    style={{ background: c.value }}
                                                    className={`h-11 rounded-xl transition-all duration-200 hover:scale-110 flex items-center justify-center shadow-md ${
                                                        bgType === 'color' && bgColor === c.value ? 'ring-2 ring-indigo-600 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-[#09090b] scale-105' : ''
                                                    }`}
                                                    title={c.label}
                                                >
                                                    {bgType === 'color' && bgColor === c.value && <Check size={16} className="text-white drop-shadow" />}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTextId(null);
                                                setEditingText('');
                                                setShowTextInputModal(true);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition"
                                        >
                                            <Type size={16} /> Soạn thảo nội dung chữ ngay
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="w-full mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-bold text-white hover:from-indigo-500 hover:to-purple-500 transition shadow-lg shadow-indigo-600/30"
                                    >
                                        Tiếp Tục Chỉnh Sửa <ArrowRight size={16} />
                                    </button>
                                </div>
                            )}

                            {/* STEP 2: CHỈNH SỬA TEXT & MUSIC */}
                            {step === 2 && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTextId(null);
                                                setEditingText('');
                                                setShowTextInputModal(true);
                                            }}
                                            className="flex items-center justify-center gap-2.5 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 py-3.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all duration-200"
                                        >
                                            <Type size={18} /> Thêm Chữ (T)
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setShowMusicModal(true)}
                                            className="flex items-center justify-center gap-2.5 rounded-2xl border border-pink-200 dark:border-pink-500/30 bg-pink-50 dark:bg-pink-500/10 py-3.5 text-sm font-semibold text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-500/20 transition-all duration-200"
                                        >
                                            <Music size={18} /> Nhạc Nền (🎵)
                                        </button>
                                    </div>

                                    {/* Text overlays list */}
                                    {textOverlays.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">Các nhãn chữ đã tạo</label>
                                            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                                {textOverlays.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-white/5 p-2.5 border border-slate-200 dark:border-white/10 text-xs">
                                                        <span className="truncate max-w-[190px] font-medium text-slate-800 dark:text-white">{item.text}</span>
                                                        <div className="flex items-center gap-2">
                                                            <button type="button" onClick={() => handleEditText(item)} className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                                                Sửa
                                                            </button>
                                                            <button type="button" onClick={() => handleDeleteText(item.id)} className="text-red-500 dark:text-red-400 hover:scale-110">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Selected Music info */}
                                    {selectedMusic && (
                                        <div className="rounded-2xl bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 p-4 text-xs space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="font-bold text-pink-700 dark:text-pink-300 truncate text-sm">{selectedMusic.title}</div>
                                                <button type="button" onClick={() => setSelectedMusic(null)} className="text-slate-400 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className="text-slate-500 dark:text-gray-400">{selectedMusic.artist}</div>
                                            <div>
                                                <div className="flex justify-between text-[11px] text-slate-500 dark:text-gray-400 mb-1 font-medium">
                                                    <span>Đoạn phát</span>
                                                    <span className="text-pink-600 dark:text-pink-400 font-bold">{musicStartTime}s - {musicStartTime + 15}s</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="60"
                                                    value={musicStartTime}
                                                    onChange={(e) => setMusicStartTime(Number(e.target.value))}
                                                    className="w-full accent-pink-500 h-1.5 bg-slate-200 dark:bg-white/20 rounded-lg cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-white/20 py-3.5 text-sm font-bold text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/10 transition"
                                        >
                                            <ArrowLeft size={16} /> Quay lại
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep(3)}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-bold text-white hover:from-indigo-500 hover:to-purple-500 transition shadow-lg shadow-indigo-600/30"
                                        >
                                            Tiếp theo <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: VISIBILITY & SHARE */}
                            {step === 3 && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-3">Ai có thể xem story này?</label>
                                        <div className="space-y-2.5">
                                            {[
                                                { id: 'public', label: 'Công khai', icon: Globe, desc: 'Tất cả mọi người trên StudyConnect' },
                                                { id: 'friends', label: 'Bạn bè & Theo dõi', icon: Users, desc: 'Chỉ những ai bạn kết bạn hoặc theo dõi' },
                                                { id: 'private', label: 'Chỉ mình tôi', icon: Lock, desc: 'Riêng tư, chỉ một mình bạn có thể xem' },
                                            ].map((opt) => (
                                                <label
                                                    key={opt.id}
                                                    className={`flex items-center gap-3.5 rounded-2xl border p-3.5 cursor-pointer transition-all duration-200 ${
                                                        visibility === opt.id
                                                            ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-500/15 shadow-sm'
                                                            : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="visibility"
                                                        value={opt.id}
                                                        checked={visibility === opt.id}
                                                        onChange={() => setVisibility(opt.id)}
                                                        className="hidden"
                                                    />
                                                    <div className={`p-2 rounded-xl ${visibility === opt.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-400'}`}>
                                                        <opt.icon size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{opt.label}</div>
                                                        <div className="text-xs text-slate-500 dark:text-gray-400">{opt.desc}</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            disabled={isSubmitting}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-white/20 py-3.5 text-sm font-bold text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/10 transition"
                                        >
                                            <ArrowLeft size={16} /> Quay lại
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-3.5 text-sm font-bold text-white hover:opacity-95 transition shadow-xl shadow-purple-500/30 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? 'Đang chia sẻ...' : 'Chia Sẻ Story'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* TEXT INPUT OVERLAY MODAL */}
            {showTextInputModal && (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowTextInputModal(false);
                    }}
                    className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#18181b] text-slate-900 dark:text-white p-6 border border-slate-200 dark:border-white/15 shadow-2xl space-y-4 animate-scaleUp"
                    >
                        <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Type className="text-indigo-600 dark:text-indigo-400" size={18} /> Nhập Nội Dung Text
                        </h4>
                        
                        <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            placeholder="Gõ điều gì đó mượt mà..."
                            rows={3}
                            style={{
                                fontFamily: editingFont,
                                fontSize: `${Math.min(editingSize, 22)}px`,
                                color: editingColor,
                                fontWeight: editingBold ? 'bold' : 'normal',
                                fontStyle: editingItalic ? 'italic' : 'normal',
                            }}
                            className="w-full rounded-2xl bg-slate-100 dark:bg-[#09090b] p-4 placeholder-slate-400 dark:placeholder-gray-500 border border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:outline-none"
                        />

                        <div className="grid grid-cols-2 gap-3">
                            {/* Font Family - Custom Dropdown */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Kiểu Font</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="flex items-center justify-between gap-2 w-full h-9 px-3.5 rounded-xl border text-xs font-bold transition shadow-sm outline-none border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#09090b] text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10"
                                        >
                                            <span className="truncate" style={{ fontFamily: editingFont }}>
                                                {FONTS.find(f => f.value === editingFont)?.label || 'Chuẩn'}
                                            </span>
                                            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60 text-slate-400 dark:text-gray-400" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="start"
                                        className="min-w-[200px] p-1.5 rounded-2xl border shadow-xl backdrop-blur-xl animate-fade-in z-[99999] border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#18181b]/95 text-slate-900 dark:text-white shadow-slate-200/50 dark:shadow-black/50"
                                    >
                                        {FONTS.map((f) => {
                                            const isSelected = editingFont === f.value;
                                            return (
                                                <DropdownMenuItem
                                                    key={f.value}
                                                    onClick={() => setEditingFont(f.value)}
                                                    className={`flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer transition ${
                                                        isSelected
                                                            ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-extrabold'
                                                            : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    <span style={{ fontFamily: f.value }}>{f.label}</span>
                                                    {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                                                </DropdownMenuItem>
                                            );
                                        })}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Font Size Slider */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Cỡ chữ ({editingSize}px)</label>
                                <input
                                    type="range"
                                    min="16"
                                    max="48"
                                    value={editingSize}
                                    onChange={(e) => setEditingSize(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:border-0"
                                />
                            </div>
                        </div>

                        {/* Bold & Italic Toggles */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setEditingBold(!editingBold)}
                                className={`flex items-center justify-center h-9 w-9 rounded-xl border transition-all duration-200 ${
                                    editingBold
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                                        : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/20'
                                }`}
                                title="In đậm"
                            >
                                <Bold size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingItalic(!editingItalic)}
                                className={`flex items-center justify-center h-9 w-9 rounded-xl border transition-all duration-200 ${
                                    editingItalic
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                                        : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/20'
                                }`}
                                title="Nghiêng"
                            >
                                <Italic size={16} />
                            </button>
                            <span className="text-[11px] text-slate-400 dark:text-gray-500 ml-1">Định dạng chữ</span>
                        </div>

                        {/* Color Swatches */}
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400">Màu chữ nhanh</label>
                            <div className="flex items-center gap-2">
                                {TEXT_COLOR_SWATCHES.map((sw) => (
                                    <button
                                        key={sw}
                                        type="button"
                                        onClick={() => setEditingColor(sw)}
                                        style={{ backgroundColor: sw }}
                                        className={`h-7 w-7 rounded-full border border-slate-300 dark:border-white/20 transition-transform ${editingColor === sw ? 'scale-125 ring-2 ring-indigo-500' : ''}`}
                                    />
                                ))}
                                <label
                                    className={`relative h-7 w-7 rounded-full overflow-hidden border border-slate-300 dark:border-white/20 cursor-pointer flex items-center justify-center shrink-0 transition-transform ${
                                        !TEXT_COLOR_SWATCHES.includes(editingColor) ? 'scale-125 ring-2 ring-indigo-500' : ''
                                    }`}
                                    title="Tùy chọn màu chữ khác"
                                >
                                    <input
                                        type="color"
                                        value={editingColor}
                                        onChange={(e) => setEditingColor(e.target.value)}
                                        className="absolute -inset-4 h-16 w-16 cursor-pointer opacity-0"
                                    />
                                    <span
                                        className="h-full w-full rounded-full flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-white"
                                        style={{ backgroundColor: editingColor }}
                                    >
                                        +
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowTextInputModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white">
                                Hủy
                            </button>
                            <button type="button" onClick={handleAddOrUpdateText} className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 shadow-md">
                                Hoàn Tất
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MUSIC SELECTION MODAL */}
            {showMusicModal && (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMusicModal(false);
                    }}
                    className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#18181b] text-slate-900 dark:text-white p-6 border border-slate-200 dark:border-white/15 shadow-2xl space-y-4 animate-scaleUp"
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Music className="text-pink-500" size={18} /> Kho Nhạc Nền Story
                            </h4>
                            <button onClick={() => setShowMusicModal(false)} className="text-slate-400 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex border-b border-slate-200 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setMusicTab('library')}
                                className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-colors ${musicTab === 'library' ? 'border-pink-500 text-pink-600 dark:text-pink-400' : 'border-transparent text-slate-400 dark:text-gray-400'}`}
                            >
                                Jamendo Library
                            </button>
                            <button
                                type="button"
                                onClick={() => setMusicTab('upload')}
                                className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-colors ${musicTab === 'upload' ? 'border-pink-500 text-pink-605 dark:text-pink-400' : 'border-transparent text-slate-400 dark:text-gray-400'}`}
                            >
                                Tải Nhạc Lên
                            </button>
                        </div>

                        {musicTab === 'library' && (
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        value={jamendoSearch}
                                        onChange={(e) => setJamendoSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && loadJamendoMusic(jamendoSearch)}
                                        placeholder="Tìm bài hát, giai điệu..."
                                        className="w-full rounded-2xl bg-slate-100 dark:bg-[#09090b] pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-pink-500"
                                    />
                                </div>

                                {loadingJamendo && <div className="text-center py-6 text-xs text-slate-400 dark:text-gray-400 animate-pulse">Đang tải giai điệu...</div>}

                                {!loadingJamendo && (
                                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                                        {jamendoTracks.map((track) => (
                                            <div key={track.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/5 text-xs">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleTogglePreviewAudio(track.audio);
                                                        }}
                                                        className="h-9 w-9 rounded-full bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 hover:scale-105 transition"
                                                    >
                                                        {previewAudioUrl === track.audio && isPlayingPreview ? <Pause size={16} /> : <Play size={16} />}
                                                    </button>
                                                    <div className="truncate">
                                                        <div className="font-bold text-slate-900 dark:text-white truncate text-xs">{track.name}</div>
                                                        <div className="text-slate-500 dark:text-gray-400 text-[11px] truncate">{track.artist_name}</div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectJamendoTrack(track);
                                                    }}
                                                    className="px-3.5 py-1.5 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-500 transition shrink-0"
                                                >
                                                    Chọn
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {musicTab === 'upload' && (
                            <div className="py-6 text-center">
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-8 cursor-pointer hover:border-pink-500 hover:bg-pink-50/50 dark:hover:bg-pink-500/10 transition">
                                    <Upload size={32} className="text-pink-500 mb-2" />
                                    <span className="text-sm font-bold text-slate-800 dark:text-white">Chọn tệp MP3 hoặc M4A từ máy</span>
                                    <input type="file" accept="audio/*" onChange={handleUploadMusicFile} className="hidden" />
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default StoryEditorModal;
