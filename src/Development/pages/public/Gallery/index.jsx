import React, { useState, useEffect, useContext, useRef } from "react";
// import { API } from "../../../Context/ContextProvider";
import { remove } from "aws-amplify/storage";
import Context from "../../../Context/Context";
import InstitutionContext from "../../../Context/InstitutionContext";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { Image, Trash2Icon, Upload, X } from "lucide-react";
import { toast } from "react-toastify";

import Spinner from "../../../utils/spinner";
import { FadeLoader } from "react-spinners";
import NavBar from "../../../components/Header";
import Footer from "../../../components/Footer";

import "react-lazy-load-image-component/src/effects/blur.css";
import "./Gallery.css";
import "react-loading-skeleton/dist/skeleton.css";
import { MdEdit } from "react-icons/md";
import { Modal } from "flowbite-react";
import { BaseTextInput, PrimaryButton } from "../../../common/Inputs";
import fileUpload from "../../../common/utils/upload-file";
import { getGalleryImageAlt, getFilenameFromUrl } from "./galleryAltText";

const Gallery = () => {
  const [uploading, setUploading] = useState(false);
  const {
    getImagesFromAPI,
    tempImgSrc,
    setTempImgSrc,
    imageUrls,
    setImageUrls,
    galleryData,
    title,
    setTitle,
    description,
    setDescription,
    manageGalleryImage
  } = useContext(Context);

  const [img, setImg] = useState();
  const [model, setModel] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const userData = useContext(Context);
  const user = userData.userData;
  const { setLoader } = userData.util;
  const [selectedFile, setSelectedFile] = useState("");
  const bucketName = "team-dev-testing";
  const region = "us-east-2";
  const institution = user.institution;
  const { institutionData: InstitutionData } = useContext(InstitutionContext);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteing, setIsDeleteing] = useState(false);
  const [isDataUploading, setIsDataUploading] = useState(false);
  const [selectValve, setSelectValve] = useState("All");
  const [openEditModal, setOpenEditModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await getImagesFromAPI();
      setLoading(false);
    };

    fetchData();
    // eslint-disable-next-line
  }, []);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    console.log("File selected:", file);

    if (file.size > 25 * 1024 * 1024) {
      toast.error("Please upload an image/video of less than 25MB size.", {
        className: "custom-toast",
      });
      return;
    }

    const folderPath = `${user.institution}`;
    const existingImageNames = imageUrls.map((url) => url.split("/").pop());

    if (existingImageNames.includes(file.name)) {
      toast.error("Selected image/video already exists.", {
        className: "custom-toast",
      });
      return (fileInputRef.current.value = "");
    }

    setShowInput(true);
    if (imageUrls.length >= 25) {
      toast.error(
        "Maximum limit reached. You can upload up to 25 images/videos.",
        {
          className: "custom-toast",
        }
      );
      return;
    }

    setUploading(true);
    try {
      console.log("Uploading media:", file.name, file.type);

      const imageUrl = await fileUpload({
        bucket: bucketName,
        region: region,
        folder: folderPath,
        file: file,
      });

      console.log("Image uploaded successfully.", imageUrl);

      setSelectedFile(imageUrl);
      console.log(title);
      console.log(description);
      console.log("API call successful.");
      await getImagesFromAPI();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading image: ", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false); // Ensure this is called to stop the spinner
    }
  };

  const uploadImageDataToAPI = async () => {
    setIsDataUploading(true);
    const filename = selectedFile.split("/").pop();
    try {
      const data = {
        institution: institution,
        title: title,
        description: description,
        imageUrl: filename,
        imgLink: selectedFile,
      };

      if(!selectedFile) {
        toast.error("Please select a file to upload.");
        setIsDataUploading(false);
        return;
      }

      await manageGalleryImage("upload", institution, data);
      setTitle("");
      setDescription("");
      setSelectedFile(""); // Reset the selected file
      setIsDataUploading(false);
      setShowInput(false);
    } catch (error) {
      console.error("Error uploading image data to API: ", error);
    } finally {
      getImagesFromAPI();
      setTempImgSrc("");
    }
  };

  const getImg = (imageUrl) => {
    setTempImgSrc(imageUrl);
    setModel(true);
    setImg(imageUrl);
    getImagesFromAPI(imageUrl);
  };

  const handleDelete = async (tempImgSrc) => {
    console.log("Deleting image:", tempImgSrc);
    try {
      const key = img.split(
        `https://${bucketName}.s3.${region}.amazonaws.com/public/`
      )[1];

      await remove({ path: key });
      setImageUrls((prevUrls) => prevUrls.filter((url) => url !== tempImgSrc));
      setSelectedFile("");
      // Fetch updated image list after deletion
      getImagesFromAPI();
    } catch (error) {
      console.error("Error deleting image: ", error);
    }
    setModel(false);
  };

  const dataDelete = async (tempImgSrc) => {
    console.log(tempImgSrc);
    setIsDeleteing(true);
    try {
      await manageGalleryImage("delete", institution, { imageUrl: tempImgSrc });
    } catch (error) {
      console.log(error);
    }
    handleDelete(tempImgSrc);
    setIsDeleteing(false);
    setModel(false);
  };

  const dataEdit = async (event) => {
    event.preventDefault();
    const imageUrl = event.target.imageUrl.value;
    const title = event.target.title.value;
    const description = event.target.description.value;

    setLoader(true);
    try {
      await manageGalleryImage("edit", institution, {
        imageUrl,
        title,
        description,
      });
      setOpenEditModal(false);
      toast.success("Message edited successfully.");
    } catch (e) {
      console.log(e);
      toast.error(e.message);
    } finally {
      setLoader(false);
    }
  };

  const handleCancelUpload = () => {
    setShowInput(false);
    setSelectedFile("");
    setTitle("");
    setDescription("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper function to get file extension
  const getFileExtension = (url) => {
    if (!url || typeof url !== "string") return "";
    const filename = url.split("/").pop();
    const ext = filename.split(".").pop().toLowerCase();
    return ext;
  };

  // Helper function to check if file is a video
  const isVideoFile = (url) => {
    if (!url) return false;
    const ext = getFileExtension(url);
    return ["mp4", "avi", "mov", "mkv", "webm", "flv", "wmv", "m4v"].includes(ext);
  };

  // Helper function to check if file is an audio
  const isAudioFile = (url) => {
    if (!url) return false;
    const ext = getFileExtension(url);
    return ["mp3", "wav", "aac", "m4a", "ogg", "flac", "wma", "aiff"].includes(ext);
  };

  const hasImages = (imageUrls || []).some((url) => !isVideoFile(url) && !isAudioFile(url));
  const hasVideos = (imageUrls || []).some((url) => isVideoFile(url));
  const hasAudios = (imageUrls || []).some((url) => isAudioFile(url));

  const availableCategories = [
    { value: "All", label: "All Media" },
    ...(hasImages ? [{ value: "images", label: "Photos" }] : []),
    ...(hasVideos ? [{ value: "videos", label: "Videos" }] : []),
    ...(hasAudios ? [{ value: "audios", label: "Audios" }] : []),
  ];

  useEffect(() => {
    if (!availableCategories.some((cat) => cat.value === selectValve)) {
      setSelectValve("All");
    }
  }, [imageUrls, selectValve]);

  let mediaUrls = imageUrls;
  if (selectValve === "images") {
    mediaUrls = imageUrls.filter(
      (url) => !isVideoFile(url) && !isAudioFile(url)
    );
  } else if (selectValve === "videos") {
    mediaUrls = imageUrls.filter((url) => isVideoFile(url));
  } else if (selectValve === "audios") {
    mediaUrls = imageUrls.filter((url) => isAudioFile(url));
  } else {
    mediaUrls = imageUrls;
  }

  return (
    <>
      <div className="bg-[#E8FFFC] pb-4">
        {!model && <NavBar />}
        <div className={model ? "model open" : "model"}>
          {isDeleteing ? (
            <div className="w-[22.5vw] h-[30vh] z-10 flex flex-col justify-center items-center rounded-lg max800:w-[70vw] max800:h-[20vh]">
              <FadeLoader
                color="white"
                speedMultiplier={2}
                height={15}
                width={5}
              />
            </div>
          ) : (
            <>
              {isVideoFile(tempImgSrc) ? (
                <div className="max-h-[90vh] relative">
                  <video
                    className="w-auto max-w-full h-auto max-h-[90vh] block box-border my-0 mx-auto rounded"
                    src={tempImgSrc}
                    autoPlay
                    muted
                    controls
                    loop
                  />
                  {(title || description) && (
                    <div className="absolute bottom-6 left-8 right-8 p-4 bg-zinc-800 bg-opacity-50 text-white w-auto min-w-[20rem] min-h-[20vh] max-w-[30rem] rounded-lg max800:w-[90vw] max800:fixed max800:bottom-4 max800:text-[.7rem]">
                      <h2 className="text-xl font-semibold roboto-slab-regural">
                        {title}
                      </h2>
                      <p className="roboto-slab-normal">{description}</p>
                    </div>
                  )}
                </div>
              ) : isAudioFile(tempImgSrc) ? (
                <div className="max-h-[90vh] relative flex flex-col justify-center items-center">
                  <div className="bg-zinc-800 bg-opacity-80 p-8 rounded-lg flex flex-col items-center gap-4">
                    <div className="text-white text-2xl">🎵</div>
                    <audio
                      className="w-[400px] max-w-[80vw]"
                      src={tempImgSrc}
                      autoPlay
                      controls
                    />
                    {(title || description) && (
                      <div className="p-4 bg-zinc-800 text-white min-w-[20rem] min-h-auto max-w-[30rem] rounded-lg text-center">
                        <h2 className="text-xl font-semibold roboto-slab-regural">
                          {title}
                        </h2>
                        <p className="roboto-slab-normal">{description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="max-h-[90vh] relative">
                  <img
                    className="w-auto max-w-[80vw] h-auto max-h-[90vh] block box-border my-0 mx-auto rounded"
                    src={tempImgSrc}
                    alt={getGalleryImageAlt(tempImgSrc, { title, description })}
                  />
                  {(title || description) && (
                    <div className="absolute bottom-6 left-8 right-8 p-4 bg-zinc-800 bg-opacity-50 text-white w-auto max-w-[30rem] rounded-lg max800:w-[90vw] max800:fixed max800:bottom-4 max800:text-[.7rem]">
                      <h2 className="text-xl font-semibold roboto-slab-regural">
                        {title}
                      </h2>
                      <p className="roboto-slab-normal">{description}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="fixed top-[20px] right-[20px] flex flex-row justify-center items-center gap-3 text-white cursor-pointer">
                {user && user.userType === "admin" && (
                  <Trash2Icon
                    height={24}
                    width={24}
                    onClick={() => dataDelete(tempImgSrc)}
                  />
                )}
                {user && user.userType === "admin" && (
                  <MdEdit
                    size={24}
                    onClick={() => {
                      setModel(false);
                      setOpenEditModal(true);
                    }}
                  />
                )}
                {user && user.userType === "admin" && (
                  <Modal
                    className="z-50"
                    show={openEditModal}
                    onClose={() => setOpenEditModal(false)}
                  >
                    <Modal.Header />
                    <Modal.Body>
                      <form onSubmit={dataEdit} className="flex flex-col gap-2">
                        <input
                          name="imageUrl"
                          value={tempImgSrc}
                          hidden
                          required
                        />
                        <BaseTextInput
                          name="title"
                          placeholder="Title"
                          defaultValue={title}
                          required
                        />
                        <textarea
                          name="description"
                          placeholder="Description"
                          defaultValue={description}
                          required
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <PrimaryButton>Save Changes</PrimaryButton>
                          <button
                            type="button"
                            className="bg-red-500 text-white rounded-lg"
                            onClick={() => setOpenEditModal(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </Modal.Body>
                  </Modal>
                )}
                <X
                  height={24}
                  width={24}
                  onClick={() => {
                    setModel(false);
                    setTitle("");
                    setDescription("");
                    setTempImgSrc("");
                  }}
                />
              </div>
            </>
          )}
        </div>

        <div className={showInput ? "showInput open" : "showInput"}>
          {isDataUploading ? (
            <div className="w-[22.5vw] h-[30vh] z-10 flex flex-col justify-center items-center rounded-lg max800:w-[70vw] max800:h-[20vh]">
              <FadeLoader
                color="white"
                speedMultiplier={2}
                height={15}
                width={5}
              />
            </div>
          ) : (
            <>
              <div className="h-auto w-[40vw] bg-white px-5 py-4 rounded-md flex flex-col justify-center items-center gap-4 max800:w-[90vw]">
                <div className="h-[30vh] max800:h-[20vh]">
                  {selectedFile ? (
                    isVideoFile(selectedFile) ? (
                      <video
                        className="w-[22.5vw] h-[30vh] rounded"
                        src={selectedFile}
                        autoPlay
                        muted
                      />
                    ) : isAudioFile(selectedFile) ? (
                      <div className="w-[22.5vw] h-[30vh] rounded bg-gray-200 flex flex-col justify-center items-center gap-2">
                        <div className="text-4xl">🎵</div>
                        <audio
                          className="w-full px-2"
                          src={selectedFile}
                          autoPlay
                          controls
                        />
                      </div>
                    ) : (
                      <img
                        className="w-[22.5vw] h-[30vh] rounded object-cover"
                        style={{
                          border: `2px solid ${InstitutionData?.PrimaryColor || "#4F46E5"}`,
                        }}
                        src={selectedFile}
                        alt={title ? `${title} upload preview` : "Selected upload preview"}
                      />
                    )
                  ) : uploading ? (
                    <div
                      className="w-[22.5vw] h-[30vh] z-10 flex flex-col justify-center items-center bg-[#ffffff6e] rounded-lg max800:w-[70vw] max800:h-[20vh]"
                      style={{
                        boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
                        backdropFilter: "blur(5px)",
                      }}
                    >
                      <Spinner />
                    </div>
                  ) : (
                    <label
                      className="upload border-2 border-dotted border-stone-500 rounded-lg cursor-pointer flex text-black text-[1.2rem] font-semibold flex-col justify-center items-center w-[22.5vw] h-[30vh] mb-1 mt-1  max800:w-[70vw] max800:h-[20vh]"
                      style={{
                        boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
                        backdropFilter: "blur(5px)",
                      }}
                    >
                      <Upload height={20} width={20} />
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,video/*,audio/*"
                      />
                    </label>
                  )}
                </div>
                <div className="w-full">
                  <div className="mb-4">
                    <label
                      for="title"
                      className="block text-gray-700 text-sm font-semibold mb-2"
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={title}
                      placeholder="Enter the title"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="">
                    <label
                      for="description"
                      className="block text-gray-700 text-sm font-semibold mb-2"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      placeholder="Enter the description"
                      value={description}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="min800:w-full flex justify-between max800:justify-between max950:gap-2 ">
                  <button
                    className="px-12 py-2 text-white bg-red-400 rounded flex flex-row gap-2 items-center justify-center"
                    onClick={() => {
                      handleCancelUpload();
                      setUploading(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-12 py-2 text-white rounded flex flex-row gap-2 items-center justify-center"
                    style={{
                      backgroundColor: `${InstitutionData?.PrimaryColor || "#4F46E5"}`,
                    }}
                    onClick={() => {
                      setShowInput(false);
                      uploadImageDataToAPI(selectedFile);
                    }}
                  >
                    Upload
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-auto pb-8">
          <div className="py-8 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#03413A] mb-3">
              Gallery
            </h1>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl">
              Moments of energy, rhythm, and mindful movement from our HappyPrancer community.
            </p>
          </div>
          <div>
            <div className="flex justify-end items-center gap-3 mr-8 mb-4">
              <select
                aria-label="Filter gallery media by category"
                className="px-[1.3rem] py-2 border-2 rounded cursor-pointer text-[#03413A] border-[#03413A]/30 bg-white"
                value={selectValve}
                onChange={(e) => setSelectValve(e.target.value)}
              >
                {availableCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {user && user.userType === "admin" && (
                <button
                  className="px-12 py-2 text-white rounded flex flex-row gap-2 items-center justify-center"
                  style={{ backgroundColor: `${InstitutionData?.PrimaryColor || "#4F46E5"}` }}
                  onClick={() => {
                    setShowInput(true);
                  }}
                >
                  <Upload height={20} width={20} />
                  Upload
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="gallery columns-4 max850:columns-2 min-h-[400px]">
              {[...Array(8)].map((_, index) => (
                <SkeletonTheme key={index} baseColor="#bcbcbc" highlightColor="#a6a6a6">
                  <div className="relative flex justify-center items-center">
                    <Skeleton
                      height="40vh"
                      width="24vw"
                      className="mb-[12px] max900:!w-[45vw] max900:!h-[20vh]"
                    />
                    <Image
                      className="absolute w-10 top-[45%] opacity-50"
                      height={48}
                      width={48}
                    />
                  </div>
                </SkeletonTheme>
              ))}
            </div>
          ) : mediaUrls.length === 0 ? (
            <h2 className="text-center text-[1.5rem] mt-16 mb-16 text-slate-400 min-h-[200px]">
              No Media Found
            </h2>
          ) : (
            <div className="gallery columns-4 max850:columns-2 min-h-[400px]">
              {mediaUrls.map((imageUrl, index) => (
                <div
                  key={index}
                  className="media cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#03413A] rounded"
                  role="button"
                  tabIndex={0}
                  aria-label="View media details"
                  onClick={() => getImg(imageUrl)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      getImg(imageUrl);
                    }
                  }}
                >
                  {isVideoFile(imageUrl) ? (
                    <video
                      src={imageUrl}
                      aria-label="Video preview"
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                      }}
                      autoPlay
                      muted
                      loop
                    />
                  ) : isAudioFile(imageUrl) ? (
                    <div
                      className="w-full h-40 bg-gradient-to-br from-purple-400 to-blue-500 flex flex-col justify-center items-center cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="text-5xl mb-2">🎵</div>
                      <p className="text-white text-sm text-center px-2 truncate">
                        {imageUrl.split("/").pop()}
                      </p>
                    </div>
                  ) : (
                    <img
                      src={imageUrl}
                      alt={getGalleryImageAlt(
                        imageUrl,
                        galleryData?.[getFilenameFromUrl(imageUrl)],
                        index
                      )}
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                      }}
                      loading="lazy"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Gallery;