import React, { useEffect, useState, useContext, useRef } from "react";
import { get } from "aws-amplify/api";
import InstitutionContext from "../../Context/InstitutionContext";
import Context from "../../Context/Context";
import apiPaths from "../../utils/api-paths";

/* Inject keyframe animations once */
if (typeof document !== "undefined" && !document.getElementById("macy-videos-styles")) {
  const styleTag = document.createElement("style");
  styleTag.id = "macy-videos-styles";
  styleTag.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes barBounce {
      0%   { transform: scaleY(0.25); }
      100% { transform: scaleY(1); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .macy-card:hover {
      box-shadow: 0 10px 32px rgba(0,0,0,0.12) !important;
      transform: translateY(-3px) !important;
    }
    .macy-card:hover img {
      transform: scale(1.06);
    }
    .macy-nav-btn:hover:not(:disabled) {
      background: #f0fdfb !important;
      border-color: #14b8a6 !important;
      color: #0d9488 !important;
    }
    @keyframes shimmerDark {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(styleTag);
}

/* ── VideoThumbnail ──────────────────────────────────────────────────────────
   Shows thumbnailUrl when available.
   Falls back to capturing a canvas frame at SEEK_TIME seconds from the actual
   video (loaded via a presigned URL stored on the video object as `url`).
   While the frame is being generated it shows a subtle shimmer placeholder.
   ─────────────────────────────────────────────────────────────────────────── */
const SEEK_FRAME = 40; // 40th frame
const FPS_GUESS = 25; // assumed fps to compute frame time (40 / 25 = 1.6s)

const VideoThumbnail = ({ video, isActive }) => {
  const [src, setSrc] = useState(video.thumbnailUrl || null);
  const [capturing, setCapturing] = useState(false);
  const videoElRef = useRef(null);
  const canvasRef = useRef(null);

  // Attempt canvas capture only when: no thumbnailUrl, video has a presigned url, not yet capturing
  useEffect(() => {
    if (src || capturing) return;         // already have an image
    if (!video.url) return;               // no presigned url yet — nothing to seek into

    setCapturing(true);

    const vid = document.createElement("video");
    vid.crossOrigin = "anonymous";
    vid.muted = true;
    vid.preload = "metadata";
    vid.src = video.url;

    const cleanup = () => {
      vid.src = "";
      vid.load();
    };

    const onSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = vid.videoWidth || 320;
        canvas.height = vid.videoHeight || 180;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        setSrc(canvas.toDataURL("image/jpeg", 0.8));
      } catch (err) {
        console.warn("Thumbnail capture failed", err);
      } finally {
        setCapturing(false);
        cleanup();
      }
    };

    const onLoadedMetadata = () => {
      // compute approximate time for the 40th frame
      const frameTime = SEEK_FRAME / FPS_GUESS;
      // Clamp seek time so we don't seek past the end
      const seek = Math.min(frameTime, Math.max(0, vid.duration - 1));
      vid.currentTime = seek;
    };

    const onError = () => {
      setCapturing(false);
      cleanup();
    };

    vid.addEventListener("loadedmetadata", onLoadedMetadata);
    vid.addEventListener("seeked", onSeeked);
    vid.addEventListener("error", onError);
    vid.load();

    return () => {
      vid.removeEventListener("loadedmetadata", onLoadedMetadata);
      vid.removeEventListener("seeked", onSeeked);
      vid.removeEventListener("error", onError);
      cleanup();
    };
  }, [video.url, src, capturing]);

  /* Shimmer while we're generating the frame */
  if (!src) {
    return (
      <div style={{
        width: "100%", height: "100%",
        background: capturing
          ? "linear-gradient(90deg, #1a1a2e 0%, #2a2a4e 50%, #1a1a2e 100%)"
          : "#1a1a2e",
        backgroundSize: "200% 100%",
        animation: capturing ? "shimmerDark 1.4s ease infinite" : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {!capturing && (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(255,255,255,0.15)">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="thumbnail"
      style={{
        width: "100%", height: "100%", objectFit: "cover",
        display: "block", transition: "transform 0.3s ease",
      }}
    />
  );
};

const MacyVideosSidebar = ({ prefix = "happyprancer/videos/macy-videos/", bucket }) => {
  const { util } = useContext(Context);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const presignCache = React.useRef(new Map());
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Helper: request presigned URL for a key (cached)
  const getPresignedUrlForKey = async (key) => {
    const cache = presignCache.current;
    if (cache.has(key)) return cache.get(key);
    const queryParams = { key };
    if (bucket) queryParams.bucket = bucket;
    const op = get({ apiName: "main", path: apiPaths.macyClassVideoUrl, options: { queryParams } });
    const resp = await op.response;
    let body;
    try {
      if (resp?.body && typeof resp.body.json === "function") body = await resp.body.json();
      else if (typeof resp.json === "function") body = await resp.json();
      else body = JSON.parse(typeof resp.text === "function" ? await resp.text() : JSON.stringify(resp));
    } catch (err) {
      const txt = (resp && typeof resp.text === "function") ? await resp.text().catch(() => "<no body>") : JSON.stringify(resp);
      throw new Error(`Presign non-JSON response: ${txt.substring(0, 300)}`);
    }
    cache.set(key, body.url);
    return body.url;
  };

  // Helper: capture frame from video URL (approx 40th frame) and return data URL
  const createThumbnailFromVideoUrl = (videoUrl) => {
    return new Promise((resolve, reject) => {
      const v = document.createElement("video");
      v.crossOrigin = "anonymous";
      v.muted = true;
      v.preload = "metadata";
      v.playsInline = true;
      let settled = false;
      const cleanup = () => {
        try {
          v.pause();
          v.removeAttribute("src");
          v.load();
        } catch (e) {}
      };
      const onError = (e) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(e || new Error("Video error"));
      };
      const timer = setTimeout(() => onError(new Error("Thumbnail timeout")), 15000);

      const onLoadedMetadata = () => {
        try {
          const duration = isFinite(v.duration) && v.duration > 0 ? v.duration : 0;
          const frameTime = SEEK_FRAME / FPS_GUESS;
          const seekTime = Math.min(frameTime, Math.max(0, duration - 0.5));
          const onSeeked = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = v.videoWidth || 480;
              canvas.height = v.videoHeight || Math.round((canvas.width * 9) / 16);
              const ctx = canvas.getContext("2d");
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              clearTimeout(timer);
              if (!settled) {
                settled = true;
                cleanup();
                resolve(canvas.toDataURL("image/jpeg", 0.8));
              }
            } catch (err) {
              onError(err);
            }
          };
          v.currentTime = seekTime;
          v.addEventListener("seeked", onSeeked, { once: true });
        } catch (err) {
          onError(err);
        }
      };

      v.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
      v.addEventListener("error", onError);
      v.src = videoUrl;
      v.load();
    });
  };

  const generateThumbnailForVideo = async (video) => {
    const url = video.url || await getPresignedUrlForKey(video.key);
    return await createThumbnailFromVideoUrl(url);
  };

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        const queryParams = { prefix };
        if (bucket) queryParams.bucket = bucket;
        const op = get({ apiName: "main", path: apiPaths.macyClassVideos, options: { queryParams } });
        const resp = await op.response;
        let body;
        if (resp?.body && typeof resp.body.json === "function") body = await resp.body.json();
        else if (typeof resp.json === "function") body = await resp.json();
        else {
          const txt = typeof resp.text === "function" ? await resp.text() : JSON.stringify(resp);
          body = JSON.parse(txt);
        }
        const list = body.videos || [];
        setVideos(list);

        // Generate thumbnails for videos missing one (in background)
        const abort = { canceled: false };
        const generateAll = async () => {
          const concurrency = 3;
          const queue = list.filter((v) => !v.thumbnailUrl).slice();
          const workers = new Array(concurrency).fill(null).map(async () => {
            while (queue.length && !abort.canceled) {
              const v = queue.shift();
              try {
                const thumb = await generateThumbnailForVideo(v);
                if (thumb && !abort.canceled) {
                  // update state immutably
                  setVideos((prev) => prev.map((p) => (p.key === v.key ? { ...p, thumbnailUrl: thumb } : p)));
                }
              } catch (e) {
                // ignore per-video errors; keep loop running
                console.debug("Thumbnail error for", v.key, e);
              }
            }
          });
          await Promise.all(workers);
        };

        generateAll();
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [prefix, bucket]);

  const openVideo = async (video, index) => {
    try {
      setSelected(video);
      setSelectedIndex(index);
      setVideoUrl(null);
      const queryParams = { key: video.key };
      if (bucket) queryParams.bucket = bucket;
      const op = get({ apiName: "main", path: apiPaths.macyClassVideoUrl, options: { queryParams } });
      const resp = await op.response;
      let body;
      if (resp?.body && typeof resp.body.json === "function") body = await resp.body.json();
      else if (typeof resp.json === "function") body = await resp.json();
      else {
        const txt = typeof resp.text === "function" ? await resp.text() : JSON.stringify(resp);
        body = JSON.parse(txt);
      }
      const url = body.url;
      setVideoUrl(url);
      // Cache the presigned URL on the video entry so VideoThumbnail can capture a frame
      setVideos((prev) =>
        prev.map((v) => (v.key === video.key ? { ...v, url } : v))
      );
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  const playNext = () => {
    if (selectedIndex !== null && selectedIndex < videos.length - 1)
      openVideo(videos[selectedIndex + 1], selectedIndex + 1);
  };
  const playPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0)
      openVideo(videos[selectedIndex - 1], selectedIndex - 1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const cleanTitle = (filename) =>
    filename.replace(/\.mp4$/i, "").replace(/-/g, " ");

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* ──────────── PLAYER ──────────── */}
      <div style={{ width: "100%", animation: "fadeIn 0.4s ease" }}>
        {/* Cinema Screen */}
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            background: "#07090f",
            borderRadius: 18,
            overflow: "hidden",
            position: "relative",
            boxShadow:
              "0 30px 90px rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.25)",
          }}>
          {selected ? (
            videoUrl ? (
              <video
                key={videoUrl}
                controls
                controlsList="nodownload"
                autoPlay
                onEnded={playNext}
                src={videoUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ) : (
              /* Loading state */
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 18,
                  background:
                    "radial-gradient(ellipse at center, #131b2e 0%, #07090f 70%)",
                }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    border: "3px solid rgba(255,255,255,0.08)",
                    borderTop: "3px solid #14b8a6",
                    animation: "spin 0.85s linear infinite",
                  }}
                />
                <span
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 14,
                    letterSpacing: "0.06em",
                  }}>
                  Preparing your class…
                </span>
              </div>
            )
          ) : (
            /* Empty state */
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 22,
                background:
                  "radial-gradient(ellipse at center, #131b2e 0%, #07090f 70%)",
              }}>
              <button
                onClick={() => videos.length > 0 && openVideo(videos[0], 0)}
                disabled={videos.length === 0}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  background: "rgba(20,184,166,0.12)",
                  border: "2px solid rgba(20,184,166,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: videos.length === 0 ? "default" : "pointer",
                  padding: 0,
                }}>
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  fill="rgba(20,184,166,0.9)">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 15,
                  margin: 0,
                  letterSpacing: "0.05em",
                }}>
                Select a class to begin
              </p>
            </div>
          )}
        </div>

        {/* Meta Row */}
        {selected && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              padding: "18px 2px 12px",
              borderBottom: "1px solid #e5e7eb",
              animation: "fadeIn 0.3s ease",
            }}>
            <div>
              <h2
                style={{
                  margin: "0 0 5px",
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.25,
                  textTransform: "capitalize",
                }}>
                {cleanTitle(selected.filename)}
              </h2>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>
                {formatDate(selected.lastModified)}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexShrink: 0,
                alignItems: "center",
              }}>
              {[
                {
                  onClick: playPrev,
                  disabled: selectedIndex === 0,
                  title: "Previous",
                  icon: <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />,
                },
                {
                  onClick: playNext,
                  disabled: selectedIndex >= videos.length - 1,
                  title: "Next",
                  icon: (
                    <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
                  ),
                },
              ].map((btn, i) => (
                <button
                  key={i}
                  className="macy-nav-btn"
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  title={btn.title}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    border: "1.5px solid #e5e7eb",
                    background: "white",
                    color: "#374151",
                    cursor: btn.disabled ? "default" : "pointer",
                    opacity: btn.disabled ? 0.3 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor">
                    {btn.icon}
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              marginTop: 10,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              color: "#dc2626",
              fontSize: 13,
            }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ flexShrink: 0 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* ──────────── PLAYLIST ──────────── */}
      <div style={{ marginTop: 32 }}>
        {/* Playlist Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #14b8a6, #0891b2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z" />
              </svg>
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: 17,
                color: "#111827",
                letterSpacing: "-0.01em",
              }}>
              Class Playlist
            </span>
          </div>
          {!loading && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#6b7280",
                background: "#f3f4f6",
                padding: "4px 12px",
                borderRadius: 20,
              }}>
              {videos.length} {videos.length === 1 ? "video" : "videos"}
            </span>
          )}
        </div>

        {/* Skeleton */}
        {loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 14,
            }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "1.5px solid #f3f4f6",
                }}>
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    background:
                      "linear-gradient(90deg, #f3f4f6 25%, #ebe9e9 50%, #f3f4f6 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                  }}
                />
                <div style={{ padding: "12px 14px" }}>
                  <div
                    style={{
                      height: 13,
                      borderRadius: 6,
                      background: "#f3f4f6",
                      marginBottom: 8,
                      width: "75%",
                    }}
                  />
                  <div
                    style={{
                      height: 10,
                      borderRadius: 6,
                      background: "#f9fafb",
                      width: "45%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cards */}
        {!loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 14,
            }}>
            {videos.map((v, i) => {
              const isActive = selected?.key === v.key;
              return (
                <button
                  key={v.key}
                  className="macy-card"
                  onClick={() => openVideo(v, i)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "white",
                    border: isActive
                      ? "1.5px solid #14b8a6"
                      : "1.5px solid #f3f4f6",
                    borderRadius: 14,
                    overflow: "hidden",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 0,
                    position: "relative",
                    boxShadow: isActive
                      ? "0 6px 24px rgba(20,184,166,0.18)"
                      : "0 2px 8px rgba(0,0,0,0.04)",
                    transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
                  }}>
                  {/* Active left stripe */}
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: 3,
                        height: "100%",
                        background: "linear-gradient(180deg, #14b8a6, #0891b2)",
                        zIndex: 2,
                      }}
                    />
                  )}

                  {/* Thumbnail */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "16/9",
                      background: "#1a1a2e",
                      overflow: "hidden",
                    }}>
                    <img
                      src={v.thumbnailUrl || "/images/video-placeholder.png"}
                      alt={v.filename}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        transition: "transform 0.3s ease",
                      }}
                    />

                    {/* Now-playing animation */}
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(20,184,166,0.22)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 3,
                            height: 22,
                          }}>
                          {[0, 0.15, 0.3].map((delay, j) => (
                            <span
                              key={j}
                              style={{
                                display: "inline-block",
                                width: 4,
                                background: "white",
                                borderRadius: 2,
                                height: "100%",
                                animation: `barBounce 0.7s ease-in-out ${delay}s infinite alternate`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Index badge */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 7,
                        right: 8,
                        background: "rgba(0,0,0,0.6)",
                        color: "white",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 6,
                        backdropFilter: "blur(4px)",
                      }}>
                      {i + 1}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: "12px 14px 14px" }}>
                    <p
                      style={{
                        margin: "0 0 5px",
                        fontSize: 13,
                        fontWeight: 600,
                        lineHeight: 1.4,
                        color: isActive ? "#0d9488" : "#1f2937",
                        textTransform: "capitalize",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                      {cleanTitle(v.filename)}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
                      {formatDate(v.lastModified)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MacyVideosSidebar;