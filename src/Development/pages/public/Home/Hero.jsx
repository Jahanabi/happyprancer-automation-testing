import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Context from "../../../Context/Context";
import InstitutionContext from "../../../Context/InstitutionContext";
// import { API } from "../../../Context/ContextProvider";
import { Button, Modal, FileInput, Label, TextInput } from "flowbite-react";
import { MdEdit } from "react-icons/md";
import { FaPlay, FaPause } from "react-icons/fa";
import { toast } from "react-toastify";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

const HERO_VIDEO_SOURCE = "/Videos/hero.mp4";

const Hero = () => {
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const navigate = useNavigate();
  const [contentSrc, setContentSrc] = useState(HERO_VIDEO_SOURCE);
  const [isVideo, setIsVideo] = useState(false);
  const Loader = useContext(Context).util;

  const UserCtx = useContext(Context);
  const { uploadHeroVideos, updateHeroSection } = useContext(Context);
  const isAdmin = UserCtx.userData.userType === "admin";
  const [modalShow, setModalShow] = useState(false);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef(null);

  const [tagline, setTagline] = useState(InstitutionData.TagLine.trim());
  const [tagline1, setTagline1] = useState(InstitutionData.TagLine1.trim());
  const [videoURL, setVideoURL] = useState(HERO_VIDEO_SOURCE);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [count, setCount] = useState(0);
  const [count1, setCount1] = useState(0);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Static Data from New Design
  const tracks = [
    {
      type: "ONLINE TRACK",
      title: "3-Class Routine",
      title1: "3-Class Routine",
      description:
        "A fresh set of 3 online sessions each weekday, designed to fit your schedule and help you stay consistent.",
      mobiledesc:
        "    Get three fresh sessions each weekday, built to match your schedule and help you stay consistent.",
      tags: ["Online only", "All Levels"],
    },
    {
      type: "HYBRID TRACK",
      title: "Online + In-Person Blend",
      title1: "Online + Offline",
      description:
        "A combined routine that mixes online flexibility with in-person guidance for a more connected experience.",
      mobiledesc:
        "    The combined plan adds both online flow and in-person help to build a true, close feel each day..",
      tags: ["Studio + Online", "Instructor-guided"],
    },
  ];
  const taglineConstants = {
    tagline: "Yoga to breathe.",
    tagline2: "Dance to move.",
    tagline1:
      "Live 30-minute yoga, Zumba, and Bollywood-inspired dance-fitness classes from the comfort of home. Build a routine with supportive instructors and a welcoming community.",
  };

  const buttons = [
    {
      label: "View Online Plans",
      variant: "primary",
      path: "/subscription",
    },
    {
      label: "Meet Our Instructors",
      variant: "secondary",
      path: "/instructor",
    },
  ];

  const features = [
    "Live sessions across multiple time zones",
    ".",
    "On-demand yoga, Zumba & strength library",
  ]; // Spacer dots logic from newdesign

  const highlightLastWord = (text) => {
    if (!text) return null;
    const words = text.trim().split(" ");
    const lastWord = words.pop();
    // Check if the last word ends with a period
    const hasPeriod = lastWord.endsWith(".");
    const wordWithoutPeriod = hasPeriod ? lastWord.slice(0, -1) : lastWord;

    return (
      <>
        {words.join(" ")}{" "}
        <span className="text-[#03413A]">{wordWithoutPeriod}</span>
        {hasPeriod ? "." : ""}
      </>
    );
  };

  const scrollToSubscription = () => {
    const subscriptionSection = document.getElementById("subscription-section");
    if (subscriptionSection) {
      subscriptionSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const isVideoFile = contentSrc.match(/\.(mp4|webm|ogg)$/i);
    setIsVideo(!!isVideoFile);

    if (isVideoFile && contentSrc) {
      const preloadVideo = document.createElement("video");
      preloadVideo.src = contentSrc;
      preloadVideo.preload = "auto";
      preloadVideo.muted = true;
      preloadVideo.playsInline = true;

      preloadVideo.addEventListener("loadeddata", () => {
        setContentSrc(contentSrc);
        preloadVideo.remove();
      });

      preloadVideo.addEventListener("error", (e) => {
        console.error("Video preload error:", e);
        preloadVideo.remove();
      });

      document.body.appendChild(preloadVideo);
    }
  }, [contentSrc]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (!file) return;

    console.log("File selected:", file);
    Loader.setLoader(true);
    setUploadProgress(0);

    try {
      const result = await uploadHeroVideos(
        InstitutionData.InstitutionId,
        file,
        file,
      );
      setVideoURL(result.videoUrl);
      toast.success("Video uploaded successfully!", {
        className: "custom-toast",
      }); // Simplified toast logic
    } catch (error) {
      console.error("Error during file upload:", error);
      toast.error("Error uploading video. Please try again.", {
        className: "custom-toast",
      });
    } finally {
      Loader.setLoader(false);
      setUploadProgress(0);
    }
  };

  const handleUpdateHeroSection = async () => {
    Loader.setLoader(true);
    try {
      if (tagline.trim() === "" || tagline1.trim() === "") {
        toast.error("Taglines cannot be empty.");
        setTagline(InstitutionData.TagLine.trim());
        setTagline1(InstitutionData.TagLine1.trim());
        Loader.setLoader(false);
        return;
      }

      const data = {
        institutionid: InstitutionData.InstitutionId,
        TagLine: tagline.trim(),
        TagLine1: tagline1.trim(),
        videoUrl: videoURL || HERO_VIDEO_SOURCE,
      };
      const response = await updateHeroSection(data);
      console.log("API Call Successful", response);
      toast.success("Hero section updated successfully.", {
        className: "custom-toast",
      });
      window.location.reload();
    } catch (error) {
      console.error("Error updating hero section:", error);
      toast.error("Error updating hero section. Please try again.", {
        className: "custom-toast",
      });
    } finally {
      Loader.setLoader(false);
    }
  };

  function onCloseModal() {
    setModalShow(false);
  }

  return (
    <>
      <Modal show={modalShow} size="lg" onClose={onCloseModal} popup>
        <Modal.Header className="py-4 px-4">Update Hero Section</Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div id="fileUpload" className="max-w-md">
              <div className="mb-2 block">
                <Label htmlFor="file" value="Upload video" />
              </div>

              <div className="relative flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Video File
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={
                      selectedFile
                        ? selectedFile.name
                        : videoURL
                          ? videoURL.split("/").pop()
                          : "No file chosen"
                            ? videoURL.split("/").pop()
                            : "No file chosen"
                    }
                    readOnly
                    className="flex-1 rounded-lg border-gray-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg">
                    Choose File
                  </button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/*"
                  className="hidden"
                />
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Uploading: {uploadProgress.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>

            <div className="max-w-md">
              <div className="mb-2 block">
                <Label htmlFor="text" value="Primary Tagline" />
              </div>
              <TextInput
                color={"primary"}
                id="text"
                type="text"
                value={tagline}
                placeholder="Enter Primary Tagline"
                maxLength={50}
                onChange={(e) => setTagline(e.target.value)}
                required
                rightIcon={MdEdit}
              />
              <p
                className={`text-sm text-gray-500 mt-1 ${
                  tagline.length === 50 ? "text-red-500 font-bold" : ""
                }`}>
                {tagline.length}/50
              </p>
            </div>
            <div className="max-w-md">
              <div className="mb-2 block">
                <Label htmlFor="text" value="Secondary Tagline" />
              </div>
              <TextInput
                color={"primary"}
                id="text"
                type="text"
                value={tagline1}
                placeholder="Enter Secondary Tagline"
                maxLength={100}
                onChange={(e) => {
                  setCount1(e.target.value.length);
                  setTagline1(e.target.value);
                }}
                required
                rightIcon={MdEdit}
              />
              <p
                className={`text-sm text-gray-500 mt-1 ${
                  tagline1.length === 100 ? "text-red-500 font-bold" : ""
                }`}>
                {tagline1.length}/100
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color={"primary"}
            onClick={() => {
              setModalShow(false);
              handleUpdateHeroSection();
            }}>
            Update
          </Button>
          <Button color={"secondary"} onClick={onCloseModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <section className="bg-[#E8FFFC] xl:px-14 xl:pt-28 xl:pb-16 overflow-hidden relative">
        {/* ADMIN EDIT BUTTON */}
        {
          // isAdmin && (
          //    <Button
          //      color="light"
          //      pill={true}
          //      className="absolute top-8 right-4 z-40 shadow-md bg-white/80 backdrop-blur-sm"
          //      onClick={() => setModalShow(true)}
          //    >
          //      <div className="flex gap-2 justify-center items-center">
          //        <MdEdit size={18} /> Edit
          //      </div>
          //    </Button>
          // )
        }

        <div className="max-w-[1920px] mx-auto">
          <div
            className="
    w-full
    px-4 pb-[0.5rem] sm:px-6 md:px-10 lg:px-14 xl:px-16 3xl:px-24
    pt-3 sm:pt-24 md:pt-28 lg:pt-0
   lg:pb-30
   sm:pb-5
    grid grid-cols-1
    xl:grid-cols-[55%_45%]
    gap-10 md:gap-14 lg:gap-12 xl:gap-7 3xl:gap-24
  ">
            {/* ================= MOBILE + TABLET (<1100px) ================= */}
            <div className="xl:hidden">
              {/* VIDEO */}
              <div className="flex justify-center mb-8 mt-[1rem] md:!mt-[2rem] md:mb-10 lg:mt-14">
                <div className="w-[100%] max-w-full">
                  <div className="aspect-[16/9] sm:aspect-[16/8.5] rounded-3xl overflow-hidden shadow-lg bg-black w-full">
                    {isVideo ? (
                      <video
                        ref={videoRef}
                        src={contentSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={contentSrc}
                        alt="hero-bg"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* CONTENT GRID */}
              <div className="grid grid-cols-[1.2fr_auto] gap-4 md:gap-6 md:px-6">
                {/* LEFT */}
                <div>
                  <h1 className="font-inter font-bold text-[1.5rem] sm:text-3xl lg:text-6xl md:text-5xl mb-2 md:mb-6">
                    <span className="block tracking-tight text-[#000000]">
                      {highlightLastWord(taglineConstants?.tagline)} <br />
                      {highlightLastWord(taglineConstants?.tagline2)}
                    </span>
                  </h1>

                  <p className="text-[#03413AB8] font-['Inter'] font-medium text-[0.9rem] sm:text-xl md:text-2xl leading-5.5 mb-4 md:mb-8">
                    {taglineConstants?.tagline1}
                  </p>

                  <div className="flex flex-col gap-3 ">
                    {buttons.map((btn, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (btn.path === "/subscription") {
                            scrollToSubscription();
                          } else {
                            navigate(btn.path);
                          }
                        }}
                        className={` py-2 rounded-full text-md sm:text-base md:text-xl font-[450] ${
                          btn.variant === "primary"
                            ? "bg-emerald-900 text-white"
                            : "border-2 border-emerald-900 bg-white text-emerald-900"
                        }`}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* RIGHT — TRACK CARDS */}
                <div className="relative -top-20 md:-top-14 flex flex-col gap-3 items-center font-inter">
                  {tracks.map((track, i) => (
                    <div
                      key={i}
                      className="
                    w-[6.0rem] sm:w-[8.4rem]
                    bg-white
                    rounded-3xl
                    pt-1 pb-2
                    text-center font-['Inter']
                    border-1 border-[#03413A]
                    md:scale-[1]
                  ">
                      <p className="text-[10px] font-bold text-[#03413A]/80 mb-1">
                        {track.type}
                      </p>

                      <div className="bg-[#03413A] text-white text-xs font-semibold px-1 py-1 mb-2">
                        {track.title1}
                      </div>

                      <p className="text-[#03413A] font-bold text-[0.6rem] mb-2 px-1 indent-3 leading-tight text-justify ">
                        {track.mobiledesc}
                      </p>

                      <div className="flex flex-col px-1 gap-1 items-center">
                        {track.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-[#DFF4EF] w-full text-[#03413A] text-[9px] px-1 py-1 rounded-full font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ================= DESKTOP / LAPTOP (>1100px) ================= */}
            <div className="hidden  xl:block">
              <h1 className="font-['Inter'] font-semibold text-[5rem] 3xl:text-[89px] leading-[1.15] tracking-tighter mb-6">
                <span className="block text-[#000000]">
                  {highlightLastWord(taglineConstants?.tagline)} <br />
                  {highlightLastWord(taglineConstants?.tagline2)}
                </span>
              </h1>

              <p className="text-[#03413AA6] font-inter font-[500] leading-tight 2xl:max-w-4xl mb-14 text-[1.8rem]">
                {taglineConstants?.tagline1}
              </p>

              <div className="flex flex-col items-start gap-6">
                <div className="flex flex-col gap-6 xl:flex-row xl:gap-8 2xl:gap-12">
                  {buttons.map((btn, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (btn.path === "/subscription") {
                          scrollToSubscription();
                        } else {
                          navigate(btn.path);
                        }
                      }}
                      className={`flex font-inter rounded-full xl:px-[2.1rem] xl:py-3 text-2xl font-[400] xl:font-[400] ${
                        btn.variant === "primary"
                          ? "bg-[#03413A] text-[#F6F6F1]"
                          : "border-2 border-[#03413A] bg-[#FFFFFFE0] text-[#03413A]"
                      }`}>
                      {btn.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-row gap-4 xl:text-[1rem] 3xl:text-lg font-[400] font-inter text-[#03413A]">
                  {features
                    .filter((f) => f !== ".")
                    .map((feature, i, arr) => (
                      <React.Fragment key={i}>
                        <span>{feature}</span>
                        {i < arr.length - 1 && (
                          <span className="mx-2">&bull;</span>
                        )}
                      </React.Fragment>
                    ))}
                </div>
              </div>
            </div>

            {/* ================= DESKTOP RIGHT VISUAL ================= */}
            <div className="hidden xl:grid grid-cols-[auto_280px] items-cent gap-10 3xl:pr-24">
              {/* VIDEO + CIRCLE */}
              <div className="flex flex-col items-center">
                {/* Dashed Circle */}
                <div
                  className="rounded-full border-2 border-dashed border-[#03413A]
      w-[360px] h-[360px]
      xl:w-[380px] xl:h-[380px]
      2xl:w-[400px] 2xl:h-[400px]
      3xl:w-[440px] 3xl:h-[440px]
      flex items-center justify-center">
                  <div
                    className="rounded-full overflow-hidden bg-black
        w-[320px] h-[320px]
        xl:w-[330px] xl:h-[330px]
        2xl:w-[355px] 2xl:h-[355px]
        3xl:w-[400px] 3xl:h-[400px]">
                    {isVideo ? (
                      <video
                        ref={videoRef}
                        src={contentSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={contentSrc}
                        alt="hero-bg"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* 🎯 IMPROVED PAUSE / PLAY BUTTON */}
                {isVideo && (
                  <button
                    onClick={() => {
                      if (!videoRef.current) return;
                      paused
                        ? videoRef.current.play()
                        : videoRef.current.pause();
                      setPaused(!paused);
                    }}
                    className="
          -mt-12
          flex items-center gap-3
          px-6 py-3
          rounded-full
          bg-white
          border border-[#03413A]
          text-[#03413A]
          font-medium
          shadow-md
          hover:bg-[#E8FFFC]
          transition
        ">
                    {paused ? <FaPlay /> : <FaPause />}
                    {paused ? "See 30-sec Zumba  energy clip" : "Pause preview"}
                  </button>
                )}
              </div>

              {/* TRACK CARDS (NO ABSOLUTE) */}
              <div className="flex flex-col gap-36 xl:-mt-12  xl:-ml-14 2xl:-ml-14 min1920:!-ml-24">
                {tracks.map((track, i) => (
                  <div
                    key={i}
                    className="bg-white font-inter px-3 py-3 rounded-3xl
          w-[220px] 2xl:w-[250px]
          ">
                    <p className="text-xs font-[750] tracking-widest text-[#03413A]/80 mb-1">
                      {track.type}
                    </p>

                    <h2 className="font-semibold text-lg text-[#03413A] mb-1">
                      {track.title}
                    </h2>

                    <p className="text-[#03413AB8] font-[500] text-[0.68rem] mb-3 ">
                      {track.description}
                    </p>

                    <div className="flex gap-2 font-inter flex-wrap text-[0.70rem] font-[450]">
                      {track.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-[#C3E0DD]/40 text-[#03413A] px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
