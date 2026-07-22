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

module.exports = uploadStreamToCloudinary;
