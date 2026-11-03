import React, { useContext, useEffect, useMemo, useState } from "react";
// import { API } from "../../../Context/ContextProvider";
import { useLocation } from "react-router-dom";
import NavBar from "../../../components/Header";
import Footer from "../../../components/Footer";
import InstitutionContext from "../../../Context/InstitutionContext";
import Context from "../../../Context/Context";
import "./index.css";
import firstMedal from "../../../../assets/first.png";
import secondMedal from "../../../../assets/second.png";
import thirdMedal from "../../../../assets/third.png";
import wellnessImg from "../../../../assets/wellness.png";
import mindfullnessImg from "../../../../assets/mindfullness.png";
import balanceImg from "../../../../assets/Balance.png";
import { useNavigate } from "react-router-dom";
import {
  deduplicateLeaderboardEntries,
  deduplicateUserList,
} from "../../../utils/userDeduplication";

// Fallback inactive check when user account status is explicit
const checkIsInactive = (user) => {
  if (!user) return false;
  return (
    user.status?.toLowerCase() === "inactive" ||
    user.isArchived === true
  );
};

const Leaderboard = () => {
  const { institutionData } = useContext(InstitutionContext);
  const { getLeaderboard, isAuth } = useContext(Context);
  const Ctx = useContext(Context);

  // Local leaderboard state from backend API
  const [leaderboardResp, setLeaderboardResp] = useState({ leaderboard: [] });
  const [leaderboardAllResp, setLeaderboardAllResp] = useState({
    leaderboard: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("points");
  const [limit, setLimit] = useState(50);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [youEntry, setYouEntry] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);
const TEAM_OPTIONS = ["HappyPrancer", "Rhythm Rockets", "Pulse Panthers", "Nova Groovers"];
const isAdmin = Ctx?.userData?.userType === "admin";
  const location = useLocation();
  const navigate = useNavigate();

  const currentUserId = Ctx?.userData?.cognitoId;

  console.log("Current User ID:", currentUserId);

  // Read sort/limit from query params (optional): ?sortBy=points&limit=10
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || "");
      const s = params.get("sortBy");
      const l = params.get("limit");
      if (s && ["points", "classes", "time"].includes(s)) setSortBy(s);
      if (l && !Number.isNaN(Number(l))) setLimit(Number(l));
    } catch (_) {}
  }, [location.search]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!institutionData?.InstitutionId) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch limited list for display with cognitoId as query param
        const paramsCognito = currentUserId
          ? `?cognitoId=${encodeURIComponent(
              currentUserId
            )}&sortBy=${sortBy}&limit=${limit}`
          : `?sortBy=${sortBy}&limit=${limit}`;
        const pathLimited = `/any/leaderboard/${institutionData.InstitutionId}${paramsCognito}`;
        const respLimited = await getLeaderboard(pathLimited);
        setLeaderboardResp(respLimited || { leaderboard: [] });

        // Capture genuine update timestamp from server header or fetch completion
        const serverTimestamp =
          respLimited?.updatedAt ||
          respLimited?.lastUpdated ||
          respLimited?.timestamp ||
          respLimited?._serverDate;
        setLastUpdated(serverTimestamp ? new Date(serverTimestamp) : null);

        // Fetch full list with cognitoId as query param (no limit)
        const paramsAll = currentUserId
          ? `?cognitoId=${encodeURIComponent(currentUserId)}&sortBy=${sortBy}`
          : `?sortBy=${sortBy}`;
        const pathAll = `/any/leaderboard/${institutionData.InstitutionId}${paramsAll}`;
        const respAll = await getLeaderboard(pathAll);
        setLeaderboardAllResp(respAll || { leaderboard: [] });
      } catch (e) {
        console.error("Leaderboard fetch failed", e);
        setError("Failed to load leaderboard");
        setLeaderboardResp({ leaderboard: [] });
        setLeaderboardAllResp({ leaderboard: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [institutionData?.InstitutionId, sortBy, limit, currentUserId]);

  const formatPoints = (n) => new Intl.NumberFormat().format(Number(n || 0));

  const formatLastUpdated = (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  };

  // Avatar helpers to match existing app behavior
  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "";
    const clean = name.replace(/\s*\(.*?\)\s*/g, "").trim();
    return clean
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  const getColor = () => institutionData?.PrimaryColor || "#0f766e";

  // Map API responses to UI model and apply canonical deduplication
  const leaderboardRaw = useMemo(() => {
    const list = Array.isArray(leaderboardResp?.leaderboard)
      ? leaderboardResp.leaderboard
      : [];
    return list.map((u) => ({
      rank: u.rank,
      cognitoId: u.cognitoId,
      name: u.applicantName || u.userName || "Member",
      applicantName: u.applicantName || u.userName || "Member",
      isInactive: checkIsInactive(u),
      imgUrl: u.profilePicture,
      points:
        u.totalPoints ??
        Number(u.zPoints || 0) +
          Number(u.referral_points || 0) +
          Number(u.rating_points || 0),
      streak: u.streak,
      emailId: u.emailId || u.email,
    }));
  }, [leaderboardResp]);

  const leaderboard = useMemo(() => {
    return deduplicateLeaderboardEntries(leaderboardRaw, Ctx.userList || []);
  }, [leaderboardRaw, Ctx.userList]);

  const leaderboardAllRaw = useMemo(() => {
    const list = Array.isArray(leaderboardAllResp?.leaderboard)
      ? leaderboardAllResp.leaderboard
      : [];
    return list.map((u) => ({
      rank: u.rank,
      cognitoId: u.cognitoId,
      name: u.applicantName || u.userName || "Member",
      applicantName: u.applicantName || u.userName || "Member",
      isInactive: checkIsInactive(u),
      imgUrl: u.profilePicture,
      points:
        u.totalPoints ??
        Number(u.zPoints || 0) +
          Number(u.referral_points || 0) +
          Number(u.rating_points || 0),
      emailId: u.emailId || u.email,
    }));
  }, [leaderboardAllResp]);

  const leaderboardAll = useMemo(() => {
    return deduplicateLeaderboardEntries(leaderboardAllRaw, Ctx.userList || []);
  }, [leaderboardAllRaw, Ctx.userList]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, limit);

  const currentUserRank = leaderboard.find(
    (u) => u.cognitoId === currentUserId
  )?.rank;

  // Ensure the current user appears even if not in top list
  useEffect(() => {
    // Prefer Context cognitoId, else use id from API's currentUser
    const apiCurrent =
      leaderboardResp?.currentUser || leaderboardAllResp?.currentUser;
    const targetId = currentUserId || apiCurrent?.cognitoId;

    if (!targetId) {
      setYouEntry(null);
      return;
    }

    // If already in limited list, don't append
    const inLimited = leaderboard.find((u) => u.cognitoId === targetId);
    if (inLimited) {
      setYouEntry(null);
      return;
    }

    // If API provided currentUser, use it directly; else try to locate in all list
    const mapUser = (u) =>
      u
        ? {
            rank: u.rank,
            cognitoId: u.cognitoId,
            name: u.applicantName || u.userName || "Member",
            isInactive: checkIsInactive(u),
            imgUrl: u.profilePicture,
            points:
              u.totalPoints ??
              Number(u.zPoints || 0) +
                Number(u.referral_points || 0) +
                Number(u.rating_points || 0),
          }
        : null;

    const fromApi = mapUser(apiCurrent);
    if (fromApi) {
      setYouEntry(fromApi);
      return;
    }

    const inAll = leaderboardAll.find((u) => u.cognitoId === targetId);
    setYouEntry(inAll || null);
  }, [
    currentUserId,
    leaderboard,
    leaderboardAll,
    leaderboardResp,
    leaderboardAllResp,
  ]);

  // Deduplicated users list for team analytics
  const deduplicatedCtxUsers = useMemo(() => {
    return deduplicateUserList(Ctx.userList || []);
  }, [Ctx.userList]);

  const teamRankings = useMemo(() => {
    if (!selectedTeam || !deduplicatedCtxUsers) return [];
    return deduplicatedCtxUsers
      .filter((u) => (u.team || "").toLowerCase() === selectedTeam.toLowerCase())
      .map((m) => {
        const leaderEntry = leaderboardAll.find(
          (l) => l.cognitoId === (m.cognitoId || m.memberId)
        );
        return {
          name: m.userName || m.name || "Member",
          isInactive: leaderEntry ? leaderEntry.isInactive : checkIsInactive(m),
          imgUrl: m.imgUrl || m.profilePicture,
          points: leaderEntry ? leaderEntry.points : 0,
          rank: leaderEntry ? leaderEntry.rank : "N/A",
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [selectedTeam, deduplicatedCtxUsers, leaderboardAll]);

  const openTeamModal = (team) => {
    setSelectedTeam(team);
    setIsModalOpen(true);
  };

  // Colors from institutionData with sensible fallbacks
  const primary = institutionData?.PrimaryColor || "#0f766e";
  const accent = institutionData?.SecondaryColor || "#f8fafc";

  const teamStats = useMemo(() => {
    const stats = {};
    TEAM_OPTIONS.forEach((team) => {
      // Filter members belonging to this team from deduplicated users
      const members = (deduplicatedCtxUsers || []).filter(
        (u) => (u.team || "").toLowerCase() === team.toLowerCase()
      );
      // Sum their points from the leaderboard data
      const total = members.reduce((sum, m) => {
        const leaderEntry = leaderboardAll.find(
          (l) => l.cognitoId === (m.cognitoId || m.memberId)
        );
        return sum + (leaderEntry ? leaderEntry.points : 0);
      }, 0);
      stats[team] = total;
    });
    return stats;
  }, [deduplicatedCtxUsers, leaderboardAll]);


  return (
    <>
  
    {/* ADD THIS MODAL BLOCK: */}
    {isModalOpen && selectedTeam && (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn">
          <div className="p-6 border-b flex items-center justify-between" style={{ backgroundColor: `${primary}08` }}>
            <h3 className="font-bold text-2xl" style={{ color: primary }}>{selectedTeam}</h3>
            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {teamRankings.map((m, i) => (
              <div key={i} className="flex items-center gap-4 p-3 border-b border-gray-50">
                <div className="w-8 font-bold text-gray-400 text-xs">#{m.rank}</div>
                <div className="flex-1 font-bold text-sm flex items-center gap-1.5 flex-wrap">
                  <span>{m.name}</span>
                  {m.isInactive && (
                    <span className="text-xs font-normal text-gray-500">
                      (Inactive)
                    </span>
                  )}
                </div>
                <div className="font-bold text-lg" style={{ color: primary }}>{formatPoints(m.points)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
   
    {/* ... rest of existing code */}

      <NavBar />

      <div className="bg-[#E8FFFC]">
        <section className="leaderboard-hero  py-12 lg:py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-black/[0.08] text-xs sm:text-sm font-semibold mb-3"
            style={{ color: primary }}>
            <span>🏆</span>
            <span>All-Time Leaderboard</span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold text-center poppins"
            style={{ color: primary }}>
            Wellness Champions
          </h1>
          <p
            className="mt-2 text-center max-w-2xl font-semibold mx-auto poppins"
            style={{ color: primary }}>
            Honoring dedication, celebrating mindfulness, and recognizing the
            transformative power of consistent practice in our HappyPrancer
            community
          </p>
          <p className="mt-1 text-center text-xs sm:text-sm text-gray-500 poppins font-medium">
            Rankings based on total Z Points earned so far
          </p>
          {lastUpdated && (
            <p className="mt-1 text-center text-xs text-gray-500 poppins font-medium">
              Last updated: {lastUpdated.toLocaleDateString()}
            </p>
          )}
          
   {/* REPLACE the previous Team Badge block with this: */}
{isAdmin && (
  <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
    {TEAM_OPTIONS.map((team) => (
      <div
        key={team}
        onClick={() => openTeamModal(team)}
        className="cursor-pointer bg-white/80 backdrop-blur-md p-5 rounded-2xl border-2 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2 flex flex-col items-center group"
        style={{ borderColor: `${primary}15` }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl mb-3 shadow-lg group-hover:scale-110 transition-transform"
             style={{ backgroundColor: primary }}>
          {team.charAt(0)}
        </div>
        <h4 className="font-bold text-sm text-gray-800 poppins truncate w-full">{team}</h4>
        <div className="mt-2 text-center">
          <p className="text-xl font-black tracking-tighter" style={{ color: primary }}>
            {formatPoints(teamStats[team] || 0)}
          </p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Total Points</p>
        </div>
      </div>
    ))}
  </div>
)}

        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Top 3 Winners & CTA */}
          <div className="col-span-1 lg:col-span-2 flex flex-col">
            {/* First Place */}
            {loading ? (
              <div className="rounded-xl shadow-md mb-4 p-6 border border-black/[0.04] animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="badge flex flex-col items-center justify-start">
                    <div className="skeleton w-[30px] h-[30px] mb-[7px] rounded"></div>
                    <div className="skeleton w-12 h-3 rounded"></div>
                  </div>
                  <div className="w-16 h-16 rounded-xl overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.1)]">
                    <div className="skeleton w-full h-full rounded-xl"></div>
                  </div>
                  <div className="flex-1">
                    <div className="skeleton h-4 w-32 mb-2 rounded"></div>
                    <div className="skeleton h-3 w-20 rounded"></div>
                  </div>
                  <div className="skeleton h-8 w-16 rounded"></div>
                </div>
              </div>
            ) : (
              top3[0] && (
                <div className="pod-first rounded-xl shadow-md mb-4 p-6 border border-black/[0.04]">
                  <div className="flex items-center gap-4">
                    <div className="badge flex flex-col items-center justify-start">
                      <img
                        src={firstMedal}
                        alt="First Place"
                        className="w-[30px] h-[30px] mb-[7px] object-contain"
                      />
                      <span className="badge-label block mt-[2px] text-[0.65rem] font-bold tracking-[0.5px] text-[#333]">
                        FIRST
                      </span>
                    </div>

                    <div className="w-16 h-16 rounded-xl overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.1)]">
                      {top3[0].imgUrl ? (
                        <img
                          src={top3[0].imgUrl}
                          alt={top3[0].name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: getColor() }}>
                          {getInitials(top3[0].name)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-bold flex items-center gap-2 flex-wrap">
                        <span>{top3[0].name}</span>
                        {top3[0].isInactive && (
                          <span className="text-xs font-normal text-gray-500">
                            (Inactive)
                          </span>
                        )}
                        {top3[0].streak > 0 && (
                          <span className="inline-flex items-center bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                            🔥 {top3[0].streak}d
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">
                        CHAMPION
                      </div>
                    </div>
                    <div
                      className="text-3xl font-bold"
                      style={{ color: primary }}>
                      {formatPoints(top3[0].points)}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Second Place */}
            {loading ? (
              <div className="rounded-xl shadow-md mb-4 px-3 py-4 border border-black/[0.04] animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="badge flex flex-col items-center justify-start">
                    <div className="skeleton w-[30px] h-[30px] mb-[7px] rounded"></div>
                    <div className="skeleton w-10 h-3 rounded"></div>
                  </div>
                  <div className="w-14 h-14 rounded-[10px] overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.1)]">
                    <div className="skeleton w-full h-full rounded-[10px]"></div>
                  </div>
                  <div className="flex-1">
                    <div className="skeleton h-4 w-28 mb-2 rounded"></div>
                    <div className="skeleton h-3 w-16 rounded"></div>
                  </div>
                  <div className="skeleton h-7 w-14 rounded"></div>
                </div>
              </div>
            ) : (
              top3[1] && (
                <div className="pod-second rounded-xl shadow-md mb-4 px-3 py-4 border border-black/[0.04]">
                  <div className="flex items-center gap-4">
                    <div className="badge flex flex-col items-center justify-start">
                      <img
                        src={secondMedal}
                        alt="Second Place"
                        className="w-[30px] h-[30px] mb-[7px] object-contain"
                      />
                      <span className="badge-label-small block mt-[3px] text-[0.6rem] font-bold tracking-[0.5px] text-[#333]">
                        SECOND
                      </span>
                    </div>

                    <div className="w-14 h-14 rounded-[10px] overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.1)]">
                      {top3[1].imgUrl ? (
                        <img
                          src={top3[1].imgUrl}
                          alt={top3[1].name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: getColor() }}>
                          {getInitials(top3[1].name)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold flex items-center gap-2 flex-wrap">
                        <span>{top3[1].name}</span>
                        {top3[1].isInactive && (
                          <span className="text-xs font-normal text-gray-500">
                            (Inactive)
                          </span>
                        )}
                        {top3[1].streak > 0 && (<span className="inline-flex items-center bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">🔥 {top3[1].streak}d</span>)}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        Leader
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-700">
                      {formatPoints(top3[1].points)}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Third Place */}
            {loading ? (
              <div className="rounded-xl shadow-md mb-6 px-3 py-4 border border-black/[0.04] animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="badge flex flex-col items-center justify-start">
                    <div className="skeleton w-[30px] h-[30px] mb-[7px] rounded"></div>
                    <div className="skeleton w-10 h-3 rounded"></div>
                  </div>
                  <div className="w-14 h-14 rounded-[10px] overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.1)]">
                    <div className="skeleton w-full h-full rounded-[10px]"></div>
                  </div>
                  <div className="flex-1">
                    <div className="skeleton h-4 w-28 mb-2 rounded"></div>
                    <div className="skeleton h-3 w-16 rounded"></div>
                  </div>
                  <div className="skeleton h-7 w-14 rounded"></div>
                </div>
              </div>
            ) : (
              top3[2] && (
                <div className="pod-third rounded-xl shadow-md mb-6 px-3 py-4 border border-black/[0.04]">
                  <div className="flex items-center gap-4">
                    <div className="badge flex flex-col items-center justify-start">
                      <img
                        src={thirdMedal}
                        alt="Third Place"
                        className="w-[30px] h-[30px] mb-[7px] object-contain"
                      />
                      <span className="badge-label-small block mt-[3px] text-[0.6rem] font-bold tracking-[0.5px] text-[#333]">
                        THIRD
                      </span>
                    </div>

                    <div className="w-14 h-14 rounded-[10px] overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.1)]">
                      {top3[2].imgUrl ? (
                        <img
                          src={top3[2].imgUrl}
                          alt={top3[2].name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: getColor() }}>
                          {getInitials(top3[2].name)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold flex items-center gap-2 flex-wrap">
                        <span>{top3[2].name}</span>
                        {top3[2].isInactive && (
                          <span className="text-xs font-normal text-gray-500">
                            (Inactive)
                          </span>
                        )}
                        {top3[2].streak > 0 && (<span className="inline-flex items-center bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">🔥 {top3[2].streak}d</span>)}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        Achiever
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-700">
                      {formatPoints(top3[2].points)}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Get Your Name Here - CTA */}
            {loading ? (
              <div className="bg-white rounded-xl shadow p-6 h-44 lg:h-48 flex flex-col justify-center text-center animate-pulse">
                <div className="skeleton h-5 w-40 mx-auto mb-2 rounded"></div>
                <div className="skeleton h-4 w-64 mx-auto mb-4 rounded"></div>
                <div className="skeleton h-9 w-[70%] max-w-[180px] sm:w-[55%] lg:w-auto mx-auto rounded-full"></div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow p-6 h-auto min-h-[176px] flex flex-col justify-center text-center">
                <h4
                  className="font-bold text-xl mb-2"
                  style={{ color: primary }}>
                  Get Your Name Here
                </h4>
                <p className="text-sm mb-4" style={{ color: primary }}>
                  Attend classes, refer friends, and rate instructors to earn Z Points
                </p>
                <button
                  className="w-[70%] max-w-[180px] sm:w-[55%] lg:w-auto mx-auto text-white py-2 px-4 sm:py-2 sm:px-4 lg:py-2 lg:px-5 rounded-full font-semibold text-[0.85rem] sm:text-[0.85rem] lg:text-[0.9rem] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(15,118,110,0.3)] border-none cursor-pointer text-center"
                  style={{ backgroundColor: primary }}
                  onClick={() => navigate(isAuth ? "/dashboard" : "/login")}>
                  Start Now
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Community Rankings */}
          <div className="col-span-1 lg:col-span-3">
            {/* Community Rankings Header */}
            <div className="border border-black/[0.06] rounded-lg py-3 px-4 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xl text-gray-700 poppins">
                    All-Time Leaderboard
                  </h3>
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                    All-Time
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 poppins">
                  Rankings based on total Z Points earned so far
                </p>
              </div>
              {lastUpdated && (
                <div className="text-xs text-gray-400 font-medium sm:text-right">
                  Last updated: <span className="text-gray-600">{formatLastUpdated(lastUpdated)}</span>
                </div>
              )}
            </div>

            {/* Community Rankings List */}
            <div
              className="max-h-[600px] bg-[#def9f5] overflow-y-auto pr-2"
              style={{ scrollbarWidth: "thin" }}>
              {loading && (
                <ul className="space-y-3 poppins font-bold text-lg">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <li
                      key={`s-${i}`}
                      className="flex items-center justify-between py-3 px-3 rounded-[10px] animate-pulse">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="skeleton h-4 w-6 mr-2 rounded"></div>
                        <div className="w-12 h-12 rounded-[10px] overflow-hidden flex-shrink-0">
                          <div className="skeleton w-full h-full rounded-[10px]"></div>
                        </div>
                        <div className="flex-1 ml-2">
                          <div className="skeleton h-4 w-32 mb-2 rounded"></div>
                          <div className="skeleton h-3 w-16 rounded"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="skeleton h-4 w-20 mb-2 rounded"></div>
                        <div className="skeleton h-3 w-14 rounded"></div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!loading && rest.length === 0 && (
                <div className="text-gray-500 text-sm">
                  No community data yet.
                </div>
              )}
              {!loading && rest.length > 0 && (
                <ul
                  className="space-y-3 poppins font-bold text-lg"
                  style={{ color: primary }}>
                  {rest.map((p) => {
                    const isYou = p.cognitoId && p.cognitoId === currentUserId;
                    return (
                      <li
                        key={p.rank}
                        className={`flex items-center justify-between py-3 px-3 rounded-[10px] transition-all duration-200 hover:bg-gray-50 ${
                          isYou ? "ranking-highlight" : ""
                        }`}>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="min-w-[24px] mr-2 font-bold">
                            {p.rank}
                          </div>
                          <div
                            className="w-12 h-12 rounded-[10px] bg-[#e6eef0] overflow-hidden flex-shrink-0"
                            style={{
                              backgroundColor: p.imgUrl
                                ? undefined
                                : getColor(),
                            }}>
                            {p.imgUrl ? (
                              <img
                                src={p.imgUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                                {getInitials(p.name)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 ml-2">
                            <div className="font-bold text-sm poppins text-black flex items-center gap-1.5 flex-wrap">
                              <span>{p.name}</span>
                              {p.isInactive && (
                                <span className="text-xs font-normal text-gray-500">
                                  (Inactive)
                                </span>
                              )}
                              {p.streak > 0 && (
                                <span className="inline-flex items-center bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                                  🔥 {p.streak}d
                                </span>
                              )}
                            </div>
                            {isYou && (
                              <div className="inline-block bg-[#146156] text-white text-[0.5rem] font-semibold py-[0.01rem] px-[0.8rem] rounded-full mt-[3px] tracking-[0.1px]">
                                YOUR RANK
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-base">
                            {formatPoints(p.points)}
                          </div>
                          <div className="text-xs text-gray-500">Z POINTS</div>
                        </div>
                      </li>
                    );
                  })}

                  {youEntry && (
                    <li
                      key={`you-${youEntry.rank}`}
                      className={`flex items-center justify-between py-3 px-3 rounded-[10px] transition-all duration-200 hover:bg-gray-50 ranking-highlight`}>
                      <div className="flex items-center gap-3 flex-1">
                        <div className="min-w-[24px] mr-2 font-bold">
                          {youEntry.rank}
                        </div>
                        <div
                          className="w-12 h-12 rounded-[10px] bg-[#e6eef0] overflow-hidden flex-shrink-0"
                          style={{
                            backgroundColor: youEntry.imgUrl
                              ? undefined
                              : getColor(),
                          }}>
                          {youEntry.imgUrl ? (
                            <img
                              src={youEntry.imgUrl}
                              alt={youEntry.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                              {getInitials(youEntry.name)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 ml-2">
                          <div className="font-bold text-sm poppins text-black flex items-center gap-1.5 flex-wrap">
                            <span>{youEntry.name}</span>
                            {youEntry.isInactive && (
                              <span className="text-xs font-normal text-gray-500">
                                (Inactive)
                              </span>
                            )}
                            {youEntry.streak > 0 && (
                              <span className="inline-flex items-center bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                                🔥 {youEntry.streak}d
                              </span>
                            )}
                          </div>
                          <div className="inline-block bg-[#146156] text-white text-[0.5rem] font-semibold py-[0.01rem] px-[0.8rem] rounded-full mt-[3px] tracking-[0.1px]">
                            YOUR RANK
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-base">
                          {formatPoints(youEntry.points)}
                        </div>
                        <div className="text-xs text-gray-500">Z POINTS</div>
                      </div>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* HP-028 & C-13: How to Earn Z Points & Rewards Section */}
        <section className="mt-8 bg-white rounded-2xl shadow-sm border border-black/[0.06] p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="font-bold text-xl sm:text-2xl text-gray-800 poppins flex items-center gap-2">
              <span className="text-yellow-500">⭐</span> How to Earn Z Points & Rewards
            </h3>
            <p className="text-sm text-gray-600 mt-1 poppins">
              Earn 1 Z Point for attending a class, 1 Z Point for rating an instructor, and 100 Z Points for each member referral who subscribes. View All-Time rankings and explore available rewards in your member dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Attend a Class */}
            <div className="p-4 sm:p-5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between hover:bg-gray-100/80 transition-colors">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-gray-800 text-base">Attend a Class</h4>
                  <span className="text-emerald-700 bg-emerald-100 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                    +1 Z Point
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  Earn 1 Z Point for each live class session you attend.
                </p>
              </div>
            </div>

            {/* Rate an Instructor */}
            <div className="p-4 sm:p-5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between hover:bg-gray-100/80 transition-colors">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-gray-800 text-base">Rate an Instructor</h4>
                  <span className="text-emerald-700 bg-emerald-100 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                    +1 Z Point
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  Earn 1 Z Point for each instructor rating you submit.
                </p>
              </div>
            </div>

            {/* Refer a Member */}
            <div className="p-4 sm:p-5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between hover:bg-gray-100/80 transition-colors">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-gray-800 text-base">Refer a Member</h4>
                  <span className="text-emerald-700 bg-emerald-100 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                    +100 Z Points
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  Earn 100 Z Points when your referred friend subscribes to a plan.
                </p>
              </div>
            </div>
          </div>

          {/* Available Rewards Preview */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wider mb-3 poppins">
              Available Participation Rewards
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100/80 flex items-start gap-3">
                <span className="text-2xl">👕</span>
                <div>
                  <h5 className="font-semibold text-gray-800 text-sm">Yoga T-Shirt (Unisex)</h5>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Requires 500 Z Points and at least 5 member referrals. Claimable in your Member Dashboard under Rewards.
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100/80 flex items-start gap-3">
                <span className="text-2xl">🎟️</span>
                <div>
                  <h5 className="font-semibold text-gray-800 text-sm">Free BWORKZ Membership (1 Year)</h5>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Requires 10,000 Z Points and at least 5 member referrals. Claimable in your Member Dashboard under Rewards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Keep Growing Banner - Full Width */}
        <div
          className="rounded-xl p-8 flex flex-col items-center justify-center text-center mt-6"
          style={{ backgroundColor: primary }}>
          <div>
            <h4 className="text-2xl font-bold text-white mb-3 poppins">
              Keep Growing Your Wellness Journey!
            </h4>
            <p className="text-white opacity-90 text-xl poppins">
              Earn Z Points for attending classes, rating instructors, and referring members. View All-Time rankings and explore available rewards.
            </p>
          </div>

          <div className="mt-6 flex gap-4 flex-wrap justify-center">
            <span className="pill inline-flex items-center gap-2 bg-white/15 text-white py-2 px-[0.9rem] rounded-full text-[0.9rem] font-medium border border-white/10">
              <img
                src={mindfullnessImg}
                alt="Mindfulness"
                className="w-6 h-6 object-contain inline-block align-middle"
              />
              <span>Mindfulness</span>
            </span>

            <span className="pill inline-flex items-center gap-2 bg-white/15 text-white py-2 px-[0.9rem] rounded-full text-[0.9rem] font-medium border border-white/10">
              <img
                src={balanceImg}
                alt="Balance"
                className="w-6 h-6 object-contain inline-block align-middle"
              />
              <span>Balance</span>
            </span>

            <span className="pill inline-flex items-center gap-2 bg-white/15 text-white py-2 px-[0.9rem] rounded-full text-[0.9rem] font-medium border border-white/10">
              <img
                src={wellnessImg}
                alt="Wellness"
                className="w-5 h-5 object-contain inline-block align-middle mt-[1px]"
              />
              <span>Wellness</span>
            </span>
          </div>
        </div>
      </main>

      </div>
      <Footer />
    </>
  );
};

export default Leaderboard;
