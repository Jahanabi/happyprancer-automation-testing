import React, { useState, useRef, useEffect, useContext } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';
// import { API } from "../../../../../Context/ContextProvider";
import Modal from './DeleteModal';
import Context from '../../../../../Context/Context';
import defaultThumbnail from '../../../../../utils/images/dancebg.jpg';

const VideoCard = ({ video, onClick, isListView = false, onDeleteSuccess }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState(video.thumbnailUrl || defaultThumbnail);
  const videoRef = useRef(null);
  const { userData, deleteClassVideo } = useContext(Context);

  useEffect(() => {
    setThumbnailSrc(video.thumbnailUrl || defaultThumbnail);
  }, [video.thumbnailUrl]);

  // Preload video when component mounts
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [video.videoUrl]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current) {
      // Only attempt to play if video is loaded
      if (videoLoaded) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Video playback failed:', error);
          });
        }
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      const response = await deleteClassVideo(userData.institution, {
        videoType_partNo: video.videoType_partNo,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
      });

      if (response) {
        onDeleteSuccess?.(video.videoUrl);
      }
    } catch (error) {
      console.error('Failed to delete video:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const uploadDate = new Date(video.uploadDate);
  const uploadTimeAgo = !isNaN(uploadDate.getTime())
    ? formatDistanceToNow(uploadDate, { addSuffix: true })
    : "Unknown";

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div
        className={`bg-[#ffffffd4] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ${
          isListView
            ? 'w-full h-auto flex items-stretch max600:flex-col'
            : 'w-[18rem] h-[18rem] pb-3 max600:w-[85vw]'
        }`}
        onClick={() => onClick(video)}
      >
        <div
          className={`relative ${
            isListView ? 'w-[240px] min-w-[240px] h-[140px] max600:w-full max600:h-[180px]' : 'w-full h-[60%]'
          }`}
        >
          <img
            src={thumbnailSrc}
            alt={video.title || 'Video thumbnail'}
            className={`w-full h-full object-cover absolute top-0 left-0 transition-opacity duration-300 ${
              isHovering ? 'opacity-0' : 'opacity-100'
            }`}
            onError={() => setThumbnailSrc(defaultThumbnail)}
          />

          <video
            ref={videoRef}
            className={`w-full h-full object-cover absolute top-0 left-0 transition-opacity duration-300 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            src={video.videoUrl}
            muted
            playsInline
            preload="metadata"
            onLoadedData={handleVideoLoaded}
            onError={() => setVideoLoaded(false)}
          />
        </div>

        <div className={`relative p-3 w-full ${isListView ? 'h-auto' : 'h-[40%]'} flex flex-col justify-between`}>
          <div>
            <h3 className="font-bold text-base title-two-line">{video.title}</h3>
            <p className="text-gray-600 text-sm line-clamp-1">
              Song Name: {video.songName}
            </p>
            <p className="text-gray-500 text-sm">Choreographer: {video.choreographer || 'N/A'}</p>
          </div>
          <span className={`text-gray-500 text-xs ${isListView ? 'mt-2' : 'absolute bottom-0 right-2'}`}>
            {uploadTimeAgo}
          </span>
        </div>
      </div>

      {String(userData?.userType || '').toLowerCase() === 'admin' && (
        <div
          className={`absolute top-2 right-2 transition-all duration-200 ${
            isHovering ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting}
            className={`
              flex items-center justify-center
              bg-white/90 hover:bg-red-50
              rounded-full p-2
              transform transition-all duration-200
              ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 hover:text-red-500'}
              shadow-lg
            `}
          >
            <Trash2
              size={16}
              strokeWidth={1.5}
              className={`${isDeleting ? 'animate-pulse' : ''}`}
            />
          </button>
        </div>
      )}

      {showDeleteModal && (
        <Modal
          title="Confirm Delete"
          message="Are you sure you want to delete this video?"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default VideoCard;