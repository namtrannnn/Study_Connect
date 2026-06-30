function ProjectFields({ value, onChange }) {
    const handleChange = (field, fieldValue) => {
        onChange({
            ...value,
            [field]: fieldValue,
        });
    };

    return (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="font-semibold text-base mb-3">Thông tin dự án</h3>

            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium mb-1">Tên dự án</label>
                    <input
                        value={value.projectName}
                        onChange={(e) => handleChange('projectName', e.target.value)}
                        placeholder="Ví dụ: StudyConnect"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
                    <textarea
                        value={value.summary}
                        onChange={(e) => handleChange('summary', e.target.value)}
                        placeholder="Mô tả ngắn về dự án..."
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Công nghệ sử dụng</label>
                    <input
                        value={value.toolsText}
                        onChange={(e) => handleChange('toolsText', e.target.value)}
                        placeholder="React, Node.js, MongoDB"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Nhập cách nhau bằng dấu phẩy.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Tiến độ</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={value.progress}
                        onChange={(e) => handleChange('progress', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Trạng thái</label>
                    <select
                        value={value.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                    >
                        <option value="idea">Ý tưởng</option>
                        <option value="in_progress">Đang làm</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="paused">Tạm dừng</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Link GitHub</label>
                    <input
                        value={value.githubUrl}
                        onChange={(e) => handleChange('githubUrl', e.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Link Demo</label>
                    <input
                        value={value.demoUrl}
                        onChange={(e) => handleChange('demoUrl', e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                    />
                </div>
            </div>
        </div>
    );
}

export default ProjectFields;
