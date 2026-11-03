import { uploadFile } from "../../Context/ContextProvider";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

const fileUpload = async ({ bucket, region, folder, file }) => {
  return await uploadFile(file, { bucket, region, folder });
};

export default fileUpload;