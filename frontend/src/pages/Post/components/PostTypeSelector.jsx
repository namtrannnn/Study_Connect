const postTypes = [
    {
        value: 'normal',
        label: 'Bài viết thường',
    },
    {
        value: 'project',
        label: 'Dự án',
    },
    {
        value: 'question',
        label: 'Câu hỏi',
    },
    {
        value: 'knowledge',
        label: 'Kiến thức',
    },
    {
        value: 'learning',
        label: 'Học tập',
    },
    {
        value: 'collaboration',
        label: 'Tìm cộng sự',
    },
    {
        value: 'achievement',
        label: 'Thành tựu',
    },
];

function PostTypeSelector({ value, onChange }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-2">Loại bài viết</label>

            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
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
