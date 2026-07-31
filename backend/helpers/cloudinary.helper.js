const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const folder = "social-fb";

const uploadStreamToCloudinary = (buffer, path) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder + path,
        transformation: [
          { width: 1600, crop: "limit", quality: "auto:best" },
        ],
      },
      (error, result) => {
        if (result)
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        else reject(error);
      },
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return null;
  }
};

const deleteMultipleFromCloudinary = async (publicIds = [], resourceType = "image") => {
  const validIds = publicIds.filter(Boolean);
  if (validIds.length === 0) return null;
  try {
    const result = await cloudinary.api.delete_resources(validIds, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Cloudinary batch delete error:", error);
    return null;
  }
};

uploadStreamToCloudinary.uploadStreamToCloudinary = uploadStreamToCloudinary;
uploadStreamToCloudinary.deleteFromCloudinary = deleteFromCloudinary;
uploadStreamToCloudinary.deleteMultipleFromCloudinary = deleteMultipleFromCloudinary;

module.exports = uploadStreamToCloudinary;
