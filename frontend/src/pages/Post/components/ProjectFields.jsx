function ProjectFields({ value, onChange }) {
    const handleChange = (field, fieldValue) => {
        onChange({
            ...value,
            [field]: fieldValue,
        });
    };

    const inputClass = "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 transition placeholder:text-gray-400 dark:placeholder:text-gray-500";

    return (
        <div className="mt-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] p-3 sm:p-4">
            <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-3">Thông tin dự án</h3>

            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên dự án</label>
                    <input
                        value={value.projectName}
                        onChange={(e) => handleChange('projectName', e.target.value)}
                        placeholder="Ví dụ: StudyConnect"
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả ngắn</label>
                    <textarea
                        value={value.summary}
                        onChange={(e) => handleChange('summary', e.target.value)}
                        placeholder="Mô tả ngắn về dự án..."
                        rows={3}
                        className={`${inputClass} resize-none`}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Công nghệ sử dụng</label>
                    <input
                        value={value.toolsText}
                        onChange={(e) => handleChange('toolsText', e.target.value)}
                        placeholder="React, Node.js, MongoDB"
                        className={inputClass}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Nhập cách nhau bằng dấu phẩy.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiến độ</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={value.progress}
                        onChange={(e) => handleChange('progress', e.target.value)}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
                    <select
                        value={value.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className={inputClass}
                    >
                        <option value="idea">Ý tưởng</option>
                        <option value="in_progress">Đang làm</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="paused">Tạm dừng</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link GitHub</label>
                    <input
                        value={value.githubUrl}
                        onChange={(e) => handleChange('githubUrl', e.target.value)}
                        placeholder="https://github.com/..."
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link Demo</label>
                    <input
                        value={value.demoUrl}
                        onChange={(e) => handleChange('demoUrl', e.target.value)}
                        placeholder="https://..."
                        className={inputClass}
                    />
                </div>
            </div>
        </div>
    );
}

export default ProjectFields;

