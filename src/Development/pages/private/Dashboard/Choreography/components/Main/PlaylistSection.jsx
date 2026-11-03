import React from 'react';
import Playlist from '../Playlist';
import { X } from 'lucide-react';

export const PlaylistSection = ({
  selectedPlaylist,
  handlePlaylistSelect,
  isMobilePlaylistOpen,
  setIsMobilePlaylistOpen
}) => {
  const slideClasses = `
    fixed right-0 top-20 h-[80vh] bg-white z-50 transition-transform duration-300 ease-in-out
    w-[300px] transform ${isMobilePlaylistOpen ? 'translate-x-0' : 'translate-x-full'}
    shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]
  `;

  const overlayClasses = `
    fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300
    ${isMobilePlaylistOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
  `;

  return (
    <>
      {/* Desktop Playlist */}
      <div className="w-[330px] bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col max600:hidden">
        <div className="p-3">
          <h3 className="text-[1.2rem] text-gray-700 inter tracking-wide font-semibold border-b border-gray-200 pb-2">
            Playlist
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-custom">
          <Playlist
            onSelectPlaylist={handlePlaylistSelect}
            selectedPlaylist={selectedPlaylist}
          />
        </div>
      </div>

      {/* Mobile Playlist Overlay */}
      <div
        className={overlayClasses}
        onClick={() => setIsMobilePlaylistOpen(false)}
      />

      {/* Mobile Playlist Slide Panel */}
      <div className={slideClasses}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[1.2rem] text-gray-700 inter tracking-wide font-semibold">
              Playlist
            </h3>
            <button
              onClick={() => setIsMobilePlaylistOpen(false)}
              className="text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
            <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(80vh-120px)]">
            <Playlist
              onSelectPlaylist={handlePlaylistSelect}
              selectedPlaylist={selectedPlaylist}
            />
          </div>
        </div>
      </div>
    </>
  );
};