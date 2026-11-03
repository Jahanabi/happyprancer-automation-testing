import React from 'react';

const VideoSkeleton = () => {
  return (
    <div className="w-[18rem] h-[18rem] bg-white rounded-lg overflow-hidden shadow-md animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="h-[190px] bg-gray-200 w-full" />
      
      {/* Content skeleton */}
      <div className="p-4">
        {/* Title skeleton */}
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        
        {/* Details skeleton */}
        <div className="mt-4 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
};

const SkeletonGrid = () => {
  return (
    <div className="w-full flex flex-wrap gap-4 h-[83vh] overflow-y-auto scrollbar-hide max600:justify-center max600:px-4">
      {[...Array(8)].map((_, index) => (
        <VideoSkeleton key={index} />
      ))}
    </div>
  );
};

export default SkeletonGrid;