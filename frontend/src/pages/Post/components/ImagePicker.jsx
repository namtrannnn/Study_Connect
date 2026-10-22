function ImagePicker({ images, onChange }) {
    const handleSelectImages = (e) => {
        const files = Array.from(e.target.files || []);

        if (files.length > 10) {
            alert('Chỉ được chọn tối đa 10 ảnh');
            return;
        }

        onChange(files);
    };

    const handleRemoveImage = (index) => {
        const nextImages = images.filter((_, i) => i !== index);
        onChange(nextImages);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ảnh bài viết</label>

            <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleSelectImages}
                className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 dark:file:bg-blue-500/10 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-500/20 transition cursor-pointer"
            />

            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-3">
                    {images.map((image, index) => (
                        <div
                            key={`${image.name}-${index}`}
                            className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10"
                        >
                            <img src={URL.createObjectURL(image)} alt="preview" className="w-full h-24 sm:h-28 object-cover" />

                            <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80 transition active:scale-90"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ImagePicker;

