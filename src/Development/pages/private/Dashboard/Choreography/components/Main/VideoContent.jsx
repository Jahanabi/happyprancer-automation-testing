import React from 'react';
import { Loader2 } from 'lucide-react';
import VideoCard from '../VideoCard';
import Play from '../Play';
import SkeletonGrid from '../SkeletonGrid';

export const VideoContent = ({
  error,
  loading,
  view,
  filteredVideos,
  selectedVideo,
  handleVideoClick,
  handleClosePlayer,
  scrollableDivRef,
  selectedPlaylist,
  onVideoDeleted,
}) => {
  // Determine which videos to display
  const displayVideos = selectedPlaylist 
    ? selectedPlaylist.videos 
    : filteredVideos;

  if (error) {
    return <div className="w-full text-center text-red-500 mt-8">{error}</div>;
  }

  if (view === 'grid' || view === 'list') {
    return (
      <div
        ref={scrollableDivRef}
        className={`w-full h-[83vh] overflow-y-auto scrollbar-hide max600:px-4 ${
          view === 'grid' ? 'flex flex-wrap gap-4 max600:justify-center' : 'flex flex-col gap-3'
        }`}
      >
        {loading && displayVideos.length === 0 ? (
          <SkeletonGrid />
        ) : displayVideos.length > 0 ? (
          displayVideos.map((video, index) => (
            <VideoCard
              key={`${video.id}-${index}`}
              video={video}
              onClick={handleVideoClick}
              isListView={view === 'list'}
              onDeleteSuccess={onVideoDeleted}
            />
          ))
        ) : (
          <div className="w-full text-center text-gray-500 mt-8">
            {selectedPlaylist 
              ? `No videos in ${selectedPlaylist.playlistName}` 
              : 'No videos found'}
          </div>
        )}

        {loading && displayVideos.length > 0 && (
          <div className="w-full flex justify-center items-center py-4">
            <Loader2 className="animate-spin text-gray-500" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      <Play video={selectedVideo} onClose={handleClosePlayer} />
    </div>
  );
};