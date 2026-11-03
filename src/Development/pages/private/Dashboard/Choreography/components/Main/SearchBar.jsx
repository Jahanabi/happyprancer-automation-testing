import React, { useEffect, useRef, useContext, useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
// import { API } from "../../../../../../Context/ContextProvider";
import Context from '../../../../../../Context/Context';

export const SearchBar = ({
  searchTerm,
  setSearchTerm,
  toggleMobilePlaylist,
  onSearchResults
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const suggestionRef = useRef(null);
  const inputRef = useRef(null);
  const { userData, searchVideos, fetchVideoBySongName } = useContext(Context);

  // Debounce effect for suggestions with a 2-second delay
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        fetchSuggestions(searchTerm);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 1000); // 2-second delay

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Handle clicks outside of suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch suggestions
  const fetchSuggestions = async (term) => {
    setIsLoading(true);
    try {
      const response = await searchVideos(userData.institution, term);
      setSuggestions(response.suggestions || []); // Updated to handle array of strings
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionSelect = async (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);

    try {
      const response = await fetchVideoBySongName(userData.institution, suggestion);

      console.log('API Response:', response);

      // Pass the video details to the parent component
      if (response && response.videoDetails) {
        onSearchResults(response.videoDetails);
      } else {
        console.warn('No video details found');
        onSearchResults([]);
      }
    } catch (error) {
      console.error('Full error fetching video details:', error);
      onSearchResults([]);
    }
  };

  // Handle clearing search
  const handleClearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
    onSearchResults(null); // Signal to reset
  };


  return (
    <div className="relative w-full" ref={suggestionRef}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search videos, songs, choreographers..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!showSuggestions) setShowSuggestions(true); // Ensure suggestions dropdown opens
            }}
            onFocus={() => {
              if (searchTerm.trim().length > 0) setShowSuggestions(true);
            }}
            className="w-full pl-12 py-2 rounded-[10px] border bg-[#ffffff] border-gray-300"
          />
          {isLoading ? (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          )}
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          onClick={toggleMobilePlaylist}
          className="hidden max600:flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-[1000] w-full mt-1 bg-white border border-gray-300 rounded-[10px] shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionSelect(suggestion)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b last:border-b-0"
            >
              <span className="text-gray-800">{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};