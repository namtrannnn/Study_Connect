const postTypes = [
    {
        value: 'normal',
        label: 'Bài viết thường',
    },
    {
        value: 'question',
        label: 'Câu hỏi / Thảo luận',
    },
    {
        value: 'quiz',
        label: 'Trắc nghiệm (Quiz)',
    },
];

function PostTypeSelector({ value, onChange }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loại bài viết</label>

            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 transition"
            >
                {postTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                        {type.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default PostTypeSelector;

