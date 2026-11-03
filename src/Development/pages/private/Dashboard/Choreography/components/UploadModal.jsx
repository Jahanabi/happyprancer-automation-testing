import React, { useContext, useState, useEffect } from 'react';
import ProgressNotification from './ProgressNotification';
import Context from '../../../../../Context/Context';
import FormField from './UploadFormComponents/FormField';
import FileUpload from './UploadFormComponents/FileUpload';
import { useUploadFunctions } from './UploadFormComponents/Functions';
import InstitutionContext from '../../../../../Context/InstitutionContext';


function UploadModal({ isOpen, setIsOpen, setVideos, setInProgress, onUploadComplete }) {
  const { PrimaryColor } = useContext(InstitutionContext).institutionData;
  const uploadFunctions = useUploadFunctions(); // Add this line near your other hooks
  const [showNotification, setShowNotification] = useState(false);
  const { playlists, fetchPlaylists } = useContext(Context);
  const [uploadStatus, setUploadStatus] = useState('uploading');
  const [showPlaylistSuggestions, setShowPlaylistSuggestions] = useState(false);
  const [filteredPlaylists, setFilteredPlaylists] = useState([]);
  const [partNoExists, setPartNoExists] = useState(false);
  const [shouldCreateNewPlaylist, setShouldCreateNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [manualThumbnailSelected, setManualThumbnailSelected] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    songName: '',
    thumbnail: null,
    video: null,
    choreographer: '',
    videoType: '',
    partNo: 1,
    playlist: '',
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (formData.playlist) {
      const filtered = playlists.filter(playlist =>
        playlist.playlistName.toLowerCase().includes(formData.playlist.toLowerCase())
      );
      setFilteredPlaylists(filtered);
    } else {
      setFilteredPlaylists([]);
    }
  }, [formData.playlist, playlists]);

  useEffect(() => {
    if (formData.playlist && formData.partNo) {
      const selectedPlaylist = playlists.find(
        playlist => playlist.playlistName === formData.playlist
      );

      if (selectedPlaylist && selectedPlaylist.partNoInclude) {
        const partExists = selectedPlaylist.partNoInclude.includes(
          formData.partNo.toString()
        );
        setPartNoExists(partExists);
      } else {
        setPartNoExists(false);
      }
    } else {
      setPartNoExists(false);
    }
  }, [formData.partNo, formData.playlist, playlists]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'partNo') {
      // Ensure part number is a positive integer
      const partNo = parseInt(value);
      if (partNo < 1) {
        setError('Part number must be greater than 0');
        return;
      }
      setFormData(prevData => ({
        ...prevData,
        partNo: partNo
      }));
      setError(null);
    } else if (name === 'thumbnail' && files?.[0]) {
      setManualThumbnailSelected(true);
      setFormData(prevData => ({
        ...prevData,
        thumbnail: files[0]
      }));
    } else if (name === 'video' && files?.[0]) {
      setFormData(prevData => ({
        ...prevData,
        video: files[0]
      }));

      if (!manualThumbnailSelected) {
        generateThumbnail(files[0]);
      }
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }

    if (name === 'playlist') {
      setShowPlaylistSuggestions(true);
      handleNewPlaylistNameChange(e);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      songName: '',
      thumbnail: null,
      video: null,
      choreographer: '',
      videoType: '',
      partNo: 1,
      playlist: '',
    });
    setUploadProgress(0);
    setError(null);
    setPartNoExists(false);
    setShouldCreateNewPlaylist(false);
    setManualThumbnailSelected(false);  // Reset the manual thumbnail flag
  };

  const generateThumbnail = (videoFile) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    video.src = URL.createObjectURL(videoFile);

    video.onloadedmetadata = () => {
      const captureTime = video.duration / 3;
      video.currentTime = captureTime;
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        const file = new File([blob], 'thumbnail.png', { type: 'image/png' });
        setFormData((prevData) => ({
          ...prevData,
          thumbnail: file,
        }));
      }, 'image/png');
      video.remove();
    };
  };

  const handlePlaylistSelect = (playlistName) => {
    setFormData(prev => ({
      ...prev,
      playlist: playlistName
    }));
    setShowPlaylistSuggestions(false);
    setShouldCreateNewPlaylist(false)
  };

  const handleNewPlaylistNameChange = (e) => {
    const { value } = e.target;
    setNewPlaylistName(value);

    // Check if the entered playlist name exists in the playlists
    const existingPlaylist = playlists.find(playlist => playlist.playlistName.toLowerCase() === value.toLowerCase());

    // Set shouldCreateNewPlaylist based on whether the playlist exists or not
    setShouldCreateNewPlaylist(!existingPlaylist);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (partNoExists) {
      setError('Cannot upload: Part number already exists in this playlist.');
      return;
    }

    if (!formData.video || !formData.thumbnail) {
      setError('Please upload both a video and a thumbnail.');
      return;
    }

    setInProgress(true);
    setUploadProgress(0);
    setShowNotification(true);
    setUploadStatus('uploading');
    setIsOpen(false);

    try {
      const result = await uploadFunctions.handleCompleteUpload(formData, setUploadProgress);
      console.log(result)
      if (result.success) {
        setUploadStatus('completed');
        setVideos((prevVideos) => [result.data, ...prevVideos]);
        await fetchPlaylists();
        onUploadComplete?.();
        
        setTimeout(() => {
          setShowNotification(false);
          resetForm();
        }, 2000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error during video upload:', error);
      setError(error.message || 'An error occurred during upload. Please try again.');
      setUploadProgress(0);
      setUploadStatus('error');
      setInProgress(false);
    }
  };

  if (!isOpen) {
    return showNotification ? (
      <ProgressNotification
        progress={uploadProgress}
        status={uploadStatus}
        setInProgress={setInProgress}
        onClose={() => {
          setShowNotification(false);
          resetForm();
        }}
      />
    ) : null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white h-[82%] overflow-y-auto py-4 px-8 rounded-lg shadow-lg w-[30%] max-w-[27rem] scrollbar-hide relative max600:w-[95vw]">
        <button
          className="absolute top-2 right-2 text-2xl text-gray-600 hover:text-gray-800"
          onClick={() => {
            setIsOpen(false);
            resetForm();
          }}
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-6">Upload Video</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <FormField
            label="Song Name"
            name="songName"
            value={formData.songName}
            onChange={handleChange}
            required
          />
          <FormField
            label="Choreographer"
            name="choreographer"
            value={formData.choreographer}
            onChange={handleChange}
            required
          />

          <div className="relative">
            <FormField
              label="Playlist"
              name="playlist"
              value={formData.playlist}
              onChange={handleChange}
              onFocus={() => setShowPlaylistSuggestions(true)}
            />
            {showPlaylistSuggestions && filteredPlaylists.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredPlaylists.map((playlist, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handlePlaylistSelect(playlist.playlistName)}
                  >
                    <div className="font-medium">{playlist.playlistName}</div>
                    <div className="text-sm text-gray-500">{playlist.videoCount} videos</div>
                  </div>
                ))}
              </div>
            )}
            {shouldCreateNewPlaylist && (
              <div>
                <p className="text-sm text-[#25926e] px-2">
                  The playlist '{newPlaylistName}' does not exist yet. A new playlist will be created.
                </p>
              </div>
            )}
          </div>

          <FormField
            label="Video Type"
            name="videoType"
            value={formData.videoType}
            onChange={handleChange}
          />

          <div className="space-y-1">
            <FormField
              label="Part No."
              name="partNo"
              type="number"
              value={formData.partNo}
              onChange={handleChange}
            />
            {partNoExists && (
              <p className="text-red-500 text-sm">
                Part {formData.partNo} already exists in this playlist
              </p>
            )}
          </div>

          <FileUpload
            type="thumbnail"
            file={formData.thumbnail}
            onChange={handleChange}
            accept="image/*"
          />

          <FileUpload
            type="video"
            file={formData.video}
            onChange={handleChange}
            accept="video/*"
          />

          <button
            type="submit"
            className="w-full font font-bold tracking-[0.3px] text-white py-2 rounded-lg transition duration-300"
            style={{backgroundColor:PrimaryColor}}
          >
            Upload Video
          </button>
        </form>
      </div>
    </div>
  );
}

export default UploadModal;
