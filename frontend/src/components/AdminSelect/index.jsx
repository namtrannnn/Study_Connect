import { ChevronDown, Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '../ui/dropdown-menu';
import { useAdminTheme } from '../../layout/Admin/index.jsx';

function AdminSelect({ value, onChange, options = [], icon: Icon, className = '', placeholder = 'Chọn...' }) {
    const themeCtx = useAdminTheme();
    const isDark = themeCtx ? themeCtx.isDark : true;

    const selectedOption = options.find((opt) => String(opt.value) === String(value)) || options[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={`flex items-center gap-2 h-9 px-3.5 rounded-2xl border text-xs font-bold transition shadow-sm outline-none ${
                        isDark
                            ? 'border-white/10 bg-[#0f172a] text-gray-200 hover:bg-white/10'
                            : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                    } ${className}`}
                >
                    {Icon && <Icon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                    <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-60 ml-auto ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                className={`min-w-[170px] p-1.5 rounded-2xl border shadow-xl backdrop-blur-xl animate-fade-in z-[9990] ${
                    isDark
                        ? 'border-white/10 bg-[#0f172a]/95 text-white shadow-black/50'
                        : 'border-slate-200 bg-white/95 text-slate-900 shadow-slate-200/50'
                }`}
            >
                {options.map((opt) => {
                    const isSelected = String(opt.value) === String(value);
                    const OptIcon = opt.icon;
                    return (
                        <DropdownMenuItem
                            key={opt.value}
                            onClick={() => onChange(opt.value)}
                            className={`flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer transition ${
                                isSelected
                                    ? 'bg-indigo-600/15 text-indigo-400 font-extrabold'
                                    : isDark
                                    ? 'hover:bg-white/10 text-gray-300 hover:text-white'
                                    : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                            }`}
                        >
                            <span className="flex items-center gap-2 truncate">
                                {OptIcon && <OptIcon className="h-3.5 w-3.5 shrink-0 text-indigo-400" />}
                                {opt.label}
                            </span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0 ml-1" />}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default AdminSelect;
