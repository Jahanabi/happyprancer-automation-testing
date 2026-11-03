import React, { useState, useEffect } from 'react';
import { X, Upload, Check } from 'lucide-react';

const ProgressNotification = ({ progress, onClose, status,setInProgress }) => {
  const [dots, setDots] = useState('');
  
  // Animated dots for initial loading state
  useEffect(() => {
    if (progress === 0) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [progress]);

  const getStatusColor = () => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'error') return 'bg-red-500';
    return 'bg-blue-500';
  };

  if (status === 'completed') {
    setInProgress(false)
  }
  const getMessage = () => {
    if (progress === 0) return `Preparing upload${dots}`;
    if (status === 'completed') return 'Successfully uploaded';
    return `${Math.round(progress)}% complete`;
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out z-10 max600:w-full max600:h-[5rem] max600:absolute max600:top-1 max600:left-0">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {status === 'completed' ? (
            <Check className="text-green-500" size={20} />
          ) : progress === 0 ? (
            <Upload className={`text-gray-500 animate-pulse`} size={20} />
          ) : (
            <Upload className="text-gray-500" size={20} />
          )}
          <span className="font-medium text-gray-900">
            {status === 'completed' ? 'Upload Complete' : 'Uploading Video'}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="relative w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
        <div 
          className={`h-2 rounded-full ${getStatusColor()} transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
        {progress === 0 && (
          <div className="absolute top-0 left-0 h-full w-full">
            <div className="h-full w-20 bg-blue-500/30 animate-[shimmer_1s_infinite]" />
          </div>
        )}
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">
          {getMessage()}
        </span>
        {progress > 0 && status !== 'completed' && (
          <span className="text-gray-700 font-medium">{Math.round(progress)}%</span>
        )}
      </div>

      {progress === 0 && (
        <p className="text-xs text-gray-500 mt-2">
          This might take a few moments depending on file size...
        </p>
      )}
    </div>
  );
};

// Add shimmer animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { transform: translateX(-100%) }
    100% { transform: translateX(200%) }
  }
`;
document.head.appendChild(style);

export default ProgressNotification;