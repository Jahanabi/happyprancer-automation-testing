import React from "react";

const InstructorSkeleton = () => {
  return (
    <div className="bg-white font-['Poppins'] animate-pulse border border-black/5">
      {/* Image Skeleton */}
      <div className="h-[260px] bg-gray-200 w-full" />

      {/* Content Skeleton */}
      <div className="p-3 border-x border-b border-black/10 flex flex-col items-start bg-white">
        {/* Name Skeleton */}
        <div className="h-5 bg-gray-200 w-3/4 rounded mb-2" />

        {/* Position Skeleton */}
        <div className="h-3 bg-gray-200 w-1/2 rounded mb-4" />

        {/* Button Skeleton */}
        <div className="w-full h-8 bg-gray-200 rounded" />
      </div>
    </div>
  );
};

export default InstructorSkeleton;
