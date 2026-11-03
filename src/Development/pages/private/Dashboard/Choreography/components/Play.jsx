import React from 'react';

const Play = ({ video, onClose }) => {
  return (
    <div className="bg-[#ffffff42] p-2 rounded-lg overflow-hidden shadow-lg">
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex flex-col">
          <div className="w-full aspect-video">
            <video
              className="w-full h-full object-contain bg-black"
              controls
              autoPlay
              src={video.videoUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Play;