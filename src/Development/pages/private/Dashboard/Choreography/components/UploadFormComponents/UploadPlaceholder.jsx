const UploadPlaceholder = ({ type }) => {
    const isImage = type === 'thumbnail';
    
    return (
      <div className="text-center">
        {isImage ? (
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="lightgray" 
            className="w-8 mx-auto"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" 
            />
          </svg>
        )}
        
        <div className="mt-2 flex text-sm leading-6 text-gray-600">
          <span className="relative font-semibold text-indigo-600 hover:text-indigo-500">
            Upload a {isImage ? 'file' : 'video'}
          </span>
          <p className="pl-[5px]">or drag and drop</p>
        </div>
        <p className="text-xs -mt-2 leading-5 text-gray-600">
          {isImage ? 'PNG, JPG, GIF up to 5MB' : 'MP4, MOV, AVI up to 500MB'}
        </p>
      </div>
    );
};
export default  UploadPlaceholder