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
            <label className="block text-sm font-medium mb-2">Ảnh bài viết</label>

            <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleSelectImages}
                className="block w-full text-sm"
            />

            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                    {images.map((image, index) => (
                        <div
                            key={`${image.name}-${index}`}
                            className="relative rounded-lg overflow-hidden border border-gray-200"
                        >
                            <img src={URL.createObjectURL(image)} alt="preview" className="w-full h-28 object-cover" />

                            <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs"
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
