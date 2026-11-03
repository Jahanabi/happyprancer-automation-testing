import React, {useContext } from 'react';
import { Loader } from 'lucide-react';
import Context from '../../../../../Context/Context';
import defaultThumbnail from '../../../../../utils/images/dancebg.jpg';

const Playlist = ({ onSelectPlaylist, selectedPlaylist }) => {
  const {
    playlists,
    errorPlaylist,
    loadingPlaylist,
  } = useContext(Context)
  return (
    <div className="w-full max-h-screen p-3 max600:h-screen max600:p-2">
      <div className="max-w-8xl">
        {loadingPlaylist ? (
          <div className="flex justify-center items-center h-[80vh]">
            <Loader className="animate-spin" />
          </div>
        ) : errorPlaylist ? (
          <p className="text-red-500">{errorPlaylist}</p>
        ) : (
          <div className="w-full flex flex-col gap-2">
            {playlists.map((playlist, index) => (
              <div
                key={index}
                className={`flex w-full items-start p-2 rounded-xl border space-x-2 cursor-pointer transition-colors ${
                  selectedPlaylist?.playlistName === playlist.playlistName
                    ? 'bg-[#eef2f7] border-[#d0d7e2]'
                    : 'bg-[#f9fafb] border-[#e5e7eb] hover:bg-[#f3f4f6]'
                } max600:bg-[#1b1b1b] max600:border-[#2f2f2f] max600:rounded-md`}
                onClick={() => onSelectPlaylist(playlist)}
              >
                <img
                  src={playlist.videos[0]?.thumbnailUrl || defaultThumbnail}
                  alt={playlist.playlistName}
                  className="w-20 h-[4.5rem] my-auto object-cover rounded-lg max600:w-24 max600:h-[4rem]"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultThumbnail;
                  }}
                />
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-700 text-[13px] line-clamp max600:text-[#a8a8a8]">
                    {playlist.playlistName}
                  </h3>
                  <p className="text-gray-500 -mt-1 text-[13px] multi-line-truncate max600:text-[#a8a8a8]">
                    Total videos {playlist.videos.length}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Playlist;