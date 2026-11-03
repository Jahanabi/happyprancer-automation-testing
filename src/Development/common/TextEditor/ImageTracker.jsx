// components/TextEditor/ImageTracker.jsx
import { useEffect, useState } from "react";
import { list, getUrl } from "aws-amplify/storage";

export const useImageTracker = (folder, value) => {
  const [uploadedImages, setUploadedImages] = useState(new Map());
  const [currentImages, setCurrentImages] = useState([]);

  const parseImagesFromContent = (content) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    return Array.from(tempDiv.querySelectorAll("img")).map((img) => ({
      fileName:
        img.getAttribute("name") || img.src.split("/").pop().split("?")[0],
      key:
        img.getAttribute("key") ||
        folder + "/" + img.src.split("/").pop().split("?")[0],
      url: img.src,
    }));
  };

  useEffect(() => {
    const fetchExistingImages = async () => {
      try {
        const result = await list({
           prefix: folder,
           options: { listAll: true, accessLevel: 'public' }
        });
        const imageMap = new Map();

        // result.items is the array
        for (const item of result.items) {
          const urlResult = await getUrl({ key: item.key, options: { accessLevel: 'public' } }); // v6 getUrl
          const fileUrl = urlResult.url.toString();
          const fileName = item.key.split("/").pop();
          imageMap.set(fileName, {
            fileName,
            fileUrl,
            key: item.key,
          });
        }

        setUploadedImages(imageMap);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchExistingImages();
  }, [folder]);

  useEffect(() => {
    if (value) {
      const newImages = parseImagesFromContent(value);
      console.log("New Images:", newImages);
      setCurrentImages(newImages);
    }
  }, [value]);

  return {
    uploadedImages,
    setUploadedImages,
    currentImages,
    parseImagesFromContent,
  };
};
