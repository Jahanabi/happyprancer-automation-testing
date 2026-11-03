// components/TextEditor/ImageUploader.jsx
import { uploadData, getUrl, remove } from "aws-amplify/storage";
import { toast } from "react-toastify";

export const uploadImage = async (file, folder) => {
  try {
    const fileName = `${Date.now()}-${file.name}`;
    const key = `${folder}/${fileName}`;
    toast.info("Uploading image...");
    await uploadData({
      key,
      data: file,
      options: {
        contentType: file.type,
        accessLevel: "public", // v6 uses accessLevel
      }
    }).result;

    const urlResult = await getUrl({ key, options: { accessLevel: "public" } });
    let fileUrl = urlResult.url.toString();
    fileUrl = fileUrl.split("?")[0];
    toast.success("Image uploaded successfully!");
    return { fileName, fileUrl, key };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const deleteImage = async (key) => {
  try {
    toast.info("Deleting image...");
    await remove({ key, options: { accessLevel: "public" } });
    console.log("Deleted from S3:", key);
    toast.success("Image deleted successfully!");
    return true;
  } catch (error) {
    console.error(`Error deleting image from S3:`, error);
    return false;
  }
};
