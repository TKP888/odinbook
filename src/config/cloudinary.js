const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Utility function to upload image to Cloudinary
const uploadToCloudinary = async (file, options = {}) => {
  try {
    // Convert buffer to base64 if file is a buffer
    let uploadData;

    if (file.buffer) {
      // If file is a buffer (from memory storage)
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      uploadData = dataURI;
    } else {
      // If file is a path (from disk storage)
      uploadData = file.path;
    }

    const result = await cloudinary.uploader.upload(uploadData, {
      folder: "odinbook/profile-pictures",
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
      ...options,
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Utility function to delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return { success: true };

    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === "ok",
      result: result.result,
    };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Specific function for uploading post photos
const uploadPostPhoto = async (file, options = {}) => {
  try {
    console.log("uploadPostPhoto called with file:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      hasBuffer: !!file.buffer,
      hasPath: !!file.path,
    });

    let uploadData;

    if (file.buffer) {
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      uploadData = dataURI;
      console.log("Converted buffer to data URI, length:", dataURI.length);
    } else {
      uploadData = file.path;
      console.log("Using file path:", uploadData);
    }

    console.log("Uploading to Cloudinary with options:", {
      folder: "odinbook/post-photos",
      resource_type: "image",
      transformation: [
        { width: 800, height: 600, crop: "limit" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    const result = await cloudinary.uploader.upload(uploadData, {
      folder: "odinbook/post-photos", // Separate folder for post photos
      resource_type: "image",
      transformation: [
        { width: 800, height: 600, crop: "limit" }, // Better dimensions for posts
        { quality: "auto", fetch_format: "auto" },
      ],
      ...options,
    });

    console.log("Cloudinary upload successful:", {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadPostPhoto, // Add this export
};
