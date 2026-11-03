import React, { useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import _ from 'lodash';
import { MainHeader } from './MainHeader';
import { VideoContent } from './VideoContent';
import { PlaylistSection } from './PlaylistSection';
import UploadModal from '../UploadModal';
import Context from '../../../../../../Context/Context';
import InstitutionContext from '../../../../../../Context/InstitutionContext';
import { useVideoFetch } from '../../hooks/useVideoFetch';

export default function Main() {
  const { institutionData } = useContext(InstitutionContext);
  const { userData, fetchPlaylists } = useContext(Context);
  const {
    setVideos,
    videos,
    error,
    loading,
    fetchVideos
  } = useVideoFetch();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState('grid');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isMobilePlaylistOpen, setIsMobilePlaylistOpen] = useState(false);
  const [initialVideos, setInitialVideos] = useState([]);
  const [inProgressStatus, setInProgress] = useState(false);


  const scrollableDivRef = useRef(null);

  useEffect(() => {
    if (userData?.institution) {
      fetchPlaylists(userData.institution);
    }
    // fetchPlaylists from context can be re-created on provider renders.
    // We only want to bootstrap once per institution change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.institution]);

  // eslint-disable-next-line
  const handleScroll = useCallback(
    _.throttle(() => {
      if (scrollableDivRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableDivRef.current;
        if (scrollHeight - scrollTop <= clientHeight + 300) {
          fetchVideos();
        }
      }
    }, 500),
    [fetchVideos]
  );
  useEffect(() => {
    // When videos are first fetched, store them as initial videos
    if (videos.length > 0 && initialVideos.length === 0) {
      setInitialVideos(videos);
    }
    // eslint-disable-next-line
  }, [videos]);

  const resetToInitialVideos = () => {
    setVideos(initialVideos);
  };

  useEffect(() => {
    const scrollableDiv = scrollableDivRef.current;
    if (scrollableDiv) {
      scrollableDiv.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (scrollableDiv) {
        scrollableDiv.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  const filteredVideos = useMemo(() => {
    let filtered = videos;

    if (searchTerm) {
      filtered = filtered.filter(
        (video) =>
          video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          video.choreographer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          video.songName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [videos, searchTerm]);

  // Event Handlers
  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setView('player');
    setIsMobilePlaylistOpen(false);
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
    setView('grid');
  };

  const handlePlaylistSelect = (playlist) => {
    setSelectedPlaylist(playlist);
    setIsMobilePlaylistOpen(false);
  };

  const toggleMobilePlaylist = () => {
    setIsMobilePlaylistOpen(!isMobilePlaylistOpen);
  };

  const clearPlaylist = () => {
    setSelectedPlaylist(null);
  };

  const refreshPlaylistData = useCallback(() => {
    if (userData?.institution) {
      fetchPlaylists(userData.institution);
    }
  }, [fetchPlaylists, userData?.institution]);

  const handleVideoDeleted = useCallback(
    (deletedVideoUrl) => {
      if (!deletedVideoUrl) return;

      setVideos((prevVideos) => prevVideos.filter((video) => video.videoUrl !== deletedVideoUrl));

      if (selectedVideo?.videoUrl === deletedVideoUrl) {
        setSelectedVideo(null);
        setView('grid');
      }

      refreshPlaylistData();
    },
    [refreshPlaylistData, selectedVideo?.videoUrl, setVideos],
  );

  const handleUploadComplete = useCallback(() => {
    refreshPlaylistData();
  }, [refreshPlaylistData]);

  return (
    <div className="w-full bg-[#f3f4f6] max-h-screen scrollbar-hide mb-[6rem] p-4 max600:h-screen max600:mb-6 max600:-mt-8">
      <div className="max-w-8xl">
        <MainHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          view={view}
          setView={setView}
          selectedPlaylist={selectedPlaylist}
          clearPlaylist={clearPlaylist}
          toggleMobilePlaylist={toggleMobilePlaylist}
          userData={userData}
          setIsModalOpen={setIsModalOpen}
          filteredVideos={filteredVideos}
          setVideos={setVideos}
          resetToInitialVideos={resetToInitialVideos}
          inProgressStatus={inProgressStatus}
        />

        {institutionData?.YTLink && (
          <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="w-full overflow-hidden rounded-xl aspect-video bg-black">
              <iframe
                src={institutionData.YTLink}
                title="YouTube choreography player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        )}

        <div className="flex gap-8 h-[80vh] relative">
          <VideoContent
            error={error}
            loading={loading}
            view={view}
            filteredVideos={filteredVideos}
            selectedVideo={selectedVideo}
            handleVideoClick={handleVideoClick}
            handleClosePlayer={handleClosePlayer}
            scrollableDivRef={scrollableDivRef}
            selectedPlaylist={selectedPlaylist}
            onVideoDeleted={handleVideoDeleted}
          />

          <PlaylistSection
            selectedPlaylist={selectedPlaylist}
            handlePlaylistSelect={handlePlaylistSelect}
            isMobilePlaylistOpen={isMobilePlaylistOpen}
            setIsMobilePlaylistOpen={setIsMobilePlaylistOpen}
          />
        </div>
      </div>
      <UploadModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        setVideos={setVideos}
        setInProgress={setInProgress}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}