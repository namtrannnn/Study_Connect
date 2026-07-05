import { useDropzone } from "react-dropzone";
import { MdAddPhotoAlternate, MdCancel } from "react-icons/md";
function MyDropzone({ media = [], setAttachment, setMedia, setFormData }) {
  const { getRootProps, getInputProps, open } = useDropzone({
    accept: {
      "image/*": [],
      "video/*": [],
    },
    multiple: true,
    onDrop: (acceptedFiles) => {
      const previews = acceptedFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith("image/") ? "image" : "video",
      }));

      const combinedMedia = [...(media || []), ...previews].slice(0, 20);
      setMedia(combinedMedia);

      const newForm = new FormData();
      combinedMedia.forEach((item) => newForm.append("images", item.file));
      console.log(">> FormData hiện tại:");
      for (let pair of newForm.entries()) {
        console.log(pair[0], pair[1]);
      }

      // console.log("newForm", newForm);
      setFormData(newForm);
    },
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        key={media?.length}
        className={`relative border rounded-md w-full ${
          media?.length > 0 ? "h-[200px]" : "max-h-[200px]"
        } overflow-hidden`}
      >
        <input {...getInputProps()} />

        {/* Nút xoá toàn bộ */}
        {media?.length === 0 && (
          <MdCancel
            className="absolute top-2 right-2 text-[24px] text-white bg-black/60 hover:bg-black/80 p-1 rounded-full cursor-pointer z-10 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              setAttachment("");
            }}
          />
        )}

        {media?.length > 0 ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              type="button"
              className="absolute top-2 left-2 text-sm px-3 py-1 bg-white/80 hover:bg-white text-black font-semibold rounded-md z-10"
            >
              Thêm ảnh/video
            </button>

            <div className="h-full overflow-y-auto">
              <div
                className={`grid ${
                  media.length === 1 ? "grid-cols-1" : "grid-cols-2"
                } gap-1 w-full p-1`}
              >
                {media?.map((item, i) => {
                  const isLastOdd =
                    i === media.length - 1 && media.length % 2 === 1;
                  return (
                    <div
                      key={i}
                      className={`relative w-full ${
                        isLastOdd ? "col-span-2" : ""
                      } aspect-video`}
                    >
                      <button
                        className="absolute top-1 right-1 text-[16px] text-white bg-black/60 hover:bg-black/80 p-1 rounded-full cursor-pointer z-10 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updatedMedia = media.filter(
                            (_, index) => index !== i
                          );
                          setMedia(updatedMedia);
                          const newForm = new FormData();
                          updatedMedia.forEach((item) =>
                            newForm.append("images", item.file)
                          );
                          setFormData(newForm);
                        }}
                      >
                        <MdCancel />
                      </button>

                      {item.type === "image" ? (
                        <img
                          src={item.url}
                          alt={`preview-${i}`}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <video
                          src={item.url}
                          controls
                          className="w-full h-full object-cover rounded-md"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full rounded-md flex flex-col items-center justify-center relative bg-[#EAEBED]/60 dark:bg-[#1E1F20]">
            <MdAddPhotoAlternate className="w-10 h-10 rounded-full dark:bg-[#5A5C5C] p-1.5 text-black/60 bg-[#D8DADF]" />
            <div className="font-semibold text-[18px] leading-5 text-black/60 dark:text-white/60">
              Thêm ảnh
            </div>
            <span className="text-[12px] text-[#949698] dark:text-[#b0b3b8]">
              hoặc kéo và thả
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyDropzone;
