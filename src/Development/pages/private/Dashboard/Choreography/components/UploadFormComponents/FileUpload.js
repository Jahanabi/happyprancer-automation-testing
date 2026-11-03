import React from 'react';
import UploadPlaceholder from './UploadPlaceholder'

const FileUpload = ({ type, onChange, file, accept, required }) => {
  const isImage = type === 'thumbnail';
  const inputId = `${type}-upload`;
  
  return (
    <div className="col-span-full">
      <label className="block text-sm font-medium leading-6 text-gray-900">
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </label>
      
      <label
        htmlFor={inputId}
        className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 p-4 cursor-pointer"
      >
        {file ? (
          isImage ? (
            <img
              src={URL.createObjectURL(file)}
              alt="Thumbnail Preview"
              className="w-full max-h-64 object-cover rounded-md"
            />
          ) : (
            <video
              controls
              src={URL.createObjectURL(file)}
              className="w-full max-h-64 object-cover rounded-md"
            />
          )
        ) : (
          <UploadPlaceholder type={type} />
        )}
        <input
          id={inputId}
          name={type}
          accept={accept}
          type="file"
          onChange={onChange}
          required={required}
          className="sr-only"
        />
      </label>
    </div>
  );
};

export default FileUpload;