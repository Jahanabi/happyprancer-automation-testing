import React, { useEffect } from "react";

function VideoAdjustCard({ pageData, onVideoAdjustChange }) {
  const adj = pageData?.hero?.videoAdjust ?? { x: 0, y: 0, zoom: 1 };
  const primary = pageData?.globalPrimaryColor || "#225c59";

  useEffect(() => {
    if (!pageData?.hero?.videoAdjust) {
      onVideoAdjustChange({ x: 0, y: 0, zoom: 1 });
    }
  }, []);

  const getProgressStyle = (val, min, max) => {
    const pct = ((val - min) / (max - min)) * 100;
    return {
      background: `linear-gradient(to right, ${primary} 0%, ${primary} ${pct}%, #e5e5e5 ${pct}%, #e5e5e5 100%)`,
    };
  };

  return (
    <div className="p-3 rounded-lg bg-white/95 border border-gray-200 text-xs space-y-2.5 min-w-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-gray-700 text-sm">Adjust Video</span>
      </div>

      {/* X */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-gray-700">X Position</span>
          <span className="text-gray-500 text-[10px]">{adj.x}</span>
        </div>
        <input
          type="range"
          min="-200"
          max="200"
          value={adj.x}
          onChange={(e) => onVideoAdjustChange({ x: Number(e.target.value) })}
          className="range-slider w-full"
          style={{ "--primaryColor": primary, ...getProgressStyle(adj.x, -200, 200) }}
        />
      </div>

      {/* Y */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-gray-700">Y Position</span>
          <span className="text-gray-500 text-[10px]">{adj.y}</span>
        </div>
        <input
          type="range"
          min="-200"
          max="200"
          value={adj.y}
          onChange={(e) => onVideoAdjustChange({ y: Number(e.target.value) })}
          className="range-slider w-full"
          style={{ "--primaryColor": primary, ...getProgressStyle(adj.y, -200, 200) }}
        />
      </div>

      {/* ZOOM */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-gray-700">Zoom</span>
          <span className="text-gray-500 text-[10px]">{adj.zoom.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.01"
          value={adj.zoom}
          onChange={(e) => onVideoAdjustChange({ zoom: Number(e.target.value) })}
          className="range-slider w-full"
          style={{ "--primaryColor": primary, ...getProgressStyle(adj.zoom, 0.5, 3) }}
        />
      </div>

      {/* Reset */}
      <button
        onClick={() => onVideoAdjustChange({ x: 0, y: 0, zoom: 1 })}
        className="w-full mt-2 py-1.5 bg-gray-100 border rounded text-gray-700 hover:bg-gray-200 transition-colors text-xs font-medium"
      >
        Reset
      </button>
    </div>
  );
}

export default VideoAdjustCard;
