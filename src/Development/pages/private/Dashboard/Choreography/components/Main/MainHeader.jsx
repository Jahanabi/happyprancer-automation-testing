import React, { useContext } from 'react';
import { SearchBar } from './SearchBar';
import InstitutionContext from '../../../../../../Context/InstitutionContext';
import { Grid2X2, List, Youtube } from 'lucide-react';

export const MainHeader = ({
  searchTerm,
  setSearchTerm,
  view,
  setView,
  inProgressStatus,
  selectedPlaylist,
  clearPlaylist,
  toggleMobilePlaylist,
  userData,
  setIsModalOpen,
  setVideos,
  resetToInitialVideos
}) => {
  const { PrimaryColor, YTLink } = useContext(InstitutionContext).institutionData;

  const handleUpload = () => {
    if (!inProgressStatus) {
      setIsModalOpen(true);
    } else {
      alert('Please wait for the upload to finish.');
    }
  };

  const isAdmin = String(userData?.userType || '').toLowerCase() === 'admin';

  return (
    <div className="mb-6 w-full rounded-2xl bg-white border border-gray-200 shadow-sm px-4 py-4 max600:px-3">
      <div className="flex items-center justify-between gap-4 max600:flex-col max600:items-start">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 max600:text-3xl">Choreography</h1>

        <div className="w-full max-w-[560px] max600:max-w-full">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            toggleMobilePlaylist={toggleMobilePlaylist}
            onSearchResults={(videoDetails) => {
              if (videoDetails === null) {
                resetToInitialVideos();
              } else if (videoDetails && videoDetails.length > 0) {
                setVideos(videoDetails);
              }
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-2 py-1">
          <button
            type="button"
            onClick={() => setView('grid')}
            className={`h-9 w-9 rounded-lg flex items-center justify-center transition ${
              view === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Grid view"
          >
            <Grid2X2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={`h-9 w-9 rounded-lg flex items-center justify-center transition ${
              view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="List view"
          >
            <List size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto max600:ml-0">
          {YTLink && (
            <a
              href={YTLink}
              target="_blank"
              rel="noreferrer"
              className="h-10 px-4 rounded-lg border border-red-100 bg-red-50 text-red-600 font-semibold text-sm inline-flex items-center gap-2 hover:bg-red-100 transition"
            >
              <Youtube size={16} />
              YouTube
            </a>
          )}

          {isAdmin && (
            <button
              onClick={handleUpload}
              className="h-10 px-4 rounded-lg text-white font-semibold text-sm"
              style={{ backgroundColor: PrimaryColor }}
            >
              Upload
            </button>
          )}
        </div>
      </div>

      {selectedPlaylist && (
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <button
            onClick={clearPlaylist}
            className="text-sm text-gray-700 px-3 py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
          >
            Clear Playlist
          </button>
          <span className="text-sm text-gray-600">
            Showing: {selectedPlaylist.playlistName} ({selectedPlaylist.videoCount} videos)
          </span>
        </div>
      )}
    </div>
  );
};