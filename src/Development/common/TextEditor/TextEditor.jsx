import Quill from "quill";
import ImageResize from "quill-image-resize-module-react";
import React, { useCallback, useContext, useRef, useState } from "react";
import { FaPencilAlt } from "react-icons/fa";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import InstitutionContext from "../../Context/InstitutionContext";
import EditorToolbar from "./EditorToolbar";
import { useImageTracker } from "./ImageTracker";
import { deleteImage, uploadImage } from "./ImageUploader";

Quill.register("modules/imageResize", ImageResize);

const TextEditor = ({
  value,
  onChange,
  onSave,
  onCancel,
  setEditing,
  showSaveButton = true,
  saveButtonText = "Save",
  saveButtonClassName = "",
  saveButtonStyle = {},
  editorClassName = "",
  placeholder = "",
  folder = "",
  ...rest
}) => {
  const { class: extraClass } = rest;
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    uploadedImages,
    setUploadedImages,
    currentImages,
    parseImagesFromContent,
  } = useImageTracker(folder, value);

  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      if (!input.files?.length) return;

      const file = input.files[0];
      setIsUploading(true);

      try {
        const { fileName, fileUrl, key } = await uploadImage(file, folder);

        setUploadedImages((prev) => {
          const next = new Map(prev);
          next.set(fileName, { fileName, fileUrl, key });
          return next;
        });

        const editor = document.querySelector(".ql-editor");
        const range = document.getSelection()?.getRangeAt(0);

        if (editor && range) {
          const img = document.createElement("img");
          img.src = fileUrl;
          img.setAttribute("name", fileName);
          img.setAttribute("key", fileName);
          img.setAttribute("alt", fileName);
          range.insertNode(img);
        }
      } catch (error) {
        console.error("Error handling image upload:", error);
      } finally {
        setIsUploading(false);
      }
    };
  }, [folder, setUploadedImages]);

  const handleContentChange = useCallback(
    async (content) => {
      onChange(content);

      // If the content deleting is not an image then return
      if (!content.includes("<img")) return;

      if (isUploading) return;

      const newImages = parseImagesFromContent(content);
      const currentKeys = new Set(newImages.map((img) => img.key));

      // Find images that were in uploadedImages but not in new content
      const deletedImages = Array.from(uploadedImages.values()).filter(
        (img) => !currentKeys.has(img.key)
      );

      // Delete removed images from S3
      for (const image of deletedImages) {
        const success = await deleteImage(image.key);
        if (success) {
          setUploadedImages((prev) => {
            const next = new Map(prev);
            next.delete(image.fileName);
            return next;
          });
        }
      }
    },
    [
      uploadedImages,
      onChange,
      isUploading,
      parseImagesFromContent,
      setUploadedImages,
    ]
  );

  const modules = {
    toolbar: {
      container: EditorToolbar(folder).container,
      handlers: { image: imageHandler },
    },
    clipboard: { matchVisual: false },
    history: {
      delay: 2000,
      maxStack: 500,
      userOnly: false,
    },
    imageResize: {
      parchment: Quill.import("parchment"),
      modules: ["Resize", "DisplaySize", "Toolbar"],
      displaySize: true,
      handleStyles: {
        backgroundColor: "black",
        border: "none",
        color: "white",
      },
    },
  };

  return (
    <div className="text-editor-container">
      <ReactQuill
        value={value}
        ref={inputRef}
        onChange={handleContentChange}
        modules={modules}
        className={`mt-5 ${editorClassName}`}
        theme="snow"
        placeholder={placeholder}
      />
      {showSaveButton && onSave && (
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={() => setEditing((prev) => !prev)}
            className={`${extraClass} md:w-[15rem] text-white rounded-[8px] mb-4 h-[3rem] text-[1.2rem] tracking-[0.8px] ${saveButtonClassName} mt-28 md:mt-14 text-center`}
            style={saveButtonStyle}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className={`${extraClass}  md:w-[15rem] text-white rounded-[8px] mb-4 h-[3rem] text-[1.2rem] tracking-[0.8px] ${saveButtonClassName} mt-28 md:mt-14 text-center`}
            style={saveButtonStyle}
          >
            {saveButtonText}
          </button>
        </div>
      )}
    </div>
  );
};

export default TextEditor;
