import React, { useContext, useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import InstitutionContext from "../../../Context/InstitutionContext";
import { GrEdit } from "react-icons/gr";
import {
  Button,
  Label,
  Modal,
  TextInput,
  FileInput,
  Textarea,
} from "flowbite-react";
import { FaPlus } from "react-icons/fa6";
import Context from "../../../Context/Context";
import { uploadData, getUrl } from "aws-amplify/storage";
// import { API } from "../../../Context/ContextProvider";
import { toast } from "react-toastify";
import { MdDeleteOutline } from "react-icons/md";

// Static Data from New Design (data.json)
const NEW_DESIGN_SERVICES = [
  {
    serialNumber: "static-1",
    title: "Online Yoga Flow",
    description:
      "A calming sequence designed to improve flexibility, reduce stress, and reset your breathing pattern.",
    meta: "30 min · Beginner friendly · Online",
    badge: "Focus",
    badgeText: "Mindful movement · Mobility · Posture correction",
  },
  {
    serialNumber: "static-2",
    title: "Zumba Energy Session",
    description:
      "A high-energy dance workout to boost your heart rate, mood, and confidence. Easy follow-along moves with upbeat music.",
    meta: "30 min · Beginner friendly · Online & studio",
    badge: "Great For",
    badgeText: "Cardio boost · Weight management · Mood uplift",
  },
  {
    serialNumber: "static-3",
    title: "BWORKZ Dance",
    description:
      "A vibrant, Bollywood-style dance session packed with expressive moves, energetic beats, and joyful rhythms.",
    meta: "30 min · Beginner friendly · Online & studio",
    badge: "Ideal For",
    badgeText: "Fun cardio · Expressive movement · Stress relief",
  },
];

const Perks = () => {
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const { InstitutionId } = InstitutionData;
  const { PrimaryColor, LightestPrimaryColor } = InstitutionData;
  // Use New Design Data by default as requested, fallback to empty if needed.
  // If Admin adds/edits, it modifies this local state (and ideally backend, but here we prioritize the new design data presence).
  const [services, setServices] = useState(NEW_DESIGN_SERVICES);

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    serviceImg: null,
  });
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 250;
  const [validationErrors, setValidationErrors] = useState({
    title: "",
    description: "",
    serviceImg: "",
  });

  const UserCtx = useContext(Context);
  const { updateServiceData } = useContext(Context);
  const isAdmin = UserCtx.userData.userType === "admin";

  // Set initial character count when opening the modal
  useEffect(() => {
    if (formData.description) {
      setCharCount(formData.description.length);
    } else {
      setCharCount(0);
    }
  }, [formData.description, openModal]);

  // Required field indicator component
  const RequiredIndicator = () => <span className="text-red-500 ml-1">*</span>;

  const handleModalOpen = (mode, service = null) => {
    setModalMode(mode);
    if (mode === "edit" && service) {
      setFormData({
        title: service.title || "",
        description: service.description || "",
        serviceImg: null,
      });
      setCurrentService(service);
      setCharCount(service.description ? service.description.length : 0);
    } else {
      setFormData({
        title: "",
        description: "",
        serviceImg: null,
      });
      setCurrentService(null);
      setCharCount(0);
    }
    // Reset validation errors when opening modal
    setValidationErrors({
      title: "",
      description: "",
      serviceImg: "",
    });
    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
    setFormData({
      title: "",
      description: "",
      serviceImg: null,
    });
    setCurrentService(null);
    setCharCount(0);
    // Reset validation errors
    setValidationErrors({
      title: "",
      description: "",
      serviceImg: "",
    });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;

    if (id === "description") {
      // Only update if we're under the character limit or if we're deleting characters
      if (value.length <= MAX_CHARS) {
        setFormData((prev) => ({
          ...prev,
          [id]: value,
        }));
        setCharCount(value.length);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [id]: value,
      }));
    }

    // Clear validation error for this field when user starts typing
    if (validationErrors[id]) {
      setValidationErrors((prev) => ({
        ...prev,
        [id]: "",
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      setFormData((prev) => ({
        ...prev,
        serviceImg: file,
      }));
      // Clear validation error for serviceImg when file is selected
      setValidationErrors((prev) => ({
        ...prev,
        serviceImg: "",
      }));
    } else if (file) {
      setValidationErrors((prev) => ({
        ...prev,
        serviceImg: "File size must be less than 5MB.",
      }));
    }
  };

  const uploadToS3 = async (file) => {
    try {
      const response = await uploadData({
        path: `services/${file.name}`,
        data: file,
        options: {
          contentType: file.type,
          accessLevel: "guest",
        },
      }).result;
      const url = await getUrl({ path: response.path });
      return url.url.toString().split("?")[0]; // Remove query parameters from the URL
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw error;
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      title: "",
      description: "",
      serviceImg: "",
    };

    if (!formData.title.trim()) {
      newErrors.title = "Please enter a title for the service.";
      isValid = false;
    }

    if (!formData.description.trim()) {
      newErrors.description = "Please enter a description for the service.";
      isValid = false;
    } else if (formData.description.length > MAX_CHARS) {
      newErrors.description = `Description cannot exceed ${MAX_CHARS} characters.`;
      isValid = false;
    }

    /*
    if (
      !formData.serviceImg &&
      modalMode === "create" &&
      !currentService?.serviceImg
    ) {
      newErrors.serviceImg = "Please upload an image for the service.";
      isValid = false;
    }
    */
    // Image validation removed/relaxed if we are using static styling mostly

    setValidationErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    try {
      // Validate the form
      if (!validateForm()) {
        return;
      }

      let serviceImgUrl = currentService?.serviceImg;

      if (formData.serviceImg) {
        serviceImgUrl = await uploadToS3(formData.serviceImg);
      }

      let serviceData = {
        title: formData.title,
        description: formData.description,
        serviceImg: serviceImgUrl,
      };

      if (modalMode === "edit") {
        serviceData.serialNumber = currentService.serialNumber;
      }

      const response = await updateServiceData(
        modalMode === "create" ? "create" : "update",
        { service: serviceData, institutionid: InstitutionId }
      );

      console.log("Full API Response:", response);

      if (response && response.service) {
        setServices((prev) => {
          if (modalMode === "create") {
            return [...prev, response.service];
          } else {
            return prev.map((service) =>
              service.serialNumber === currentService.serialNumber
                ? response.service
                : service
            );
          }
        });

        toast.success(
          modalMode === "create"
            ? "Service created successfully!"
            : "Service updated successfully!",
          { className: "custom-toast" }
        );

        handleModalClose();
      } else {
        console.error("API error response:", response);
        throw new Error(response.error || "Failed to save service");
      }
    } catch (error) {
      console.error("Detailed error:", error);
      toast.error(
        error.message || "An unknown error occurred. Please try again.",
        {
          className: "custom-toast",
        }
      );
    }
  };

  const handleDeleteModalOpen = (service) => {
    setCurrentService(service);
    setOpenDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setOpenDeleteModal(false);
    setCurrentService(null);
  };

  const handleDelete = async () => {
    try {
      const response = await updateServiceData("delete", {
        institutionid: InstitutionId,
        serialNumber: currentService.serialNumber,
      });

      if (response) {
        setServices((prev) =>
          prev.filter(
            (service) => service.serialNumber !== currentService.serialNumber
          )
        );

        toast.success("Service deleted successfully!", {
          className: "custom-toast",
        });

        handleDeleteModalClose();
      } else {
        throw new Error(response.error || "Failed to delete service");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error(
        error.message || "An error occurred while deleting the service",
        {
          className: "custom-toast",
        }
      );
    }
  };

  const [leftHeight, setLeftHeight] = useState(0);
  const leftRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (leftRef.current) {
      setLeftHeight(leftRef.current.offsetHeight);
    }
  }, [services]); // Recalculate if services change or on mount

  const { scrollYProgress } = useScroll({
    container: scrollRef,
    offset: ["start start", "end end"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const handleScrollToSubscription = () => {
    const element = document.getElementById("subscription-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>

      {/* Existing Modals (Preserved) */}
      <Modal show={openModal} onClose={handleModalClose} size="md" popup>
        <Modal.Header />
        <Modal.Body>
          <div className="space-y-6">
            <div>
              <div className="mb-2 block">
                <Label
                  htmlFor="file-upload-helper-text"
                  value={
                    <>
                      Upload Image{" "}
                      {/* Image optional for new design static data usage */}
                    </>
                  }
                />
              </div>
              <FileInput
                id="file-upload-helper-text"
                helperText="SVG, PNG, JPG or GIF (Max: 5MB)."
                onChange={handleFileChange}
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label
                  htmlFor="title"
                  value={
                    <>
                      Title
                      <RequiredIndicator />
                    </>
                  }
                />
              </div>
              <TextInput
                id="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter title"
                maxLength={50}
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label
                  htmlFor="description"
                  value={
                    <>
                      Description
                      <RequiredIndicator />
                    </>
                  }
                />
              </div>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter description"
                required
              />
            </div>
            <Button
              onClick={handleSubmit}
              style={{ backgroundColor: PrimaryColor }}
              className="w-full"
            >
              {modalMode === "create" ? "Create Service" : "Update Service"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal
        show={openDeleteModal}
        onClose={handleDeleteModalClose}
        size="sm"
        popup
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center p-6">
            <h3 className="mb-5 text-lg font-normal text-gray-500">
              Delete this service?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={handleDelete}>
                Delete
              </Button>
              <Button color="gray" onClick={handleDeleteModalClose}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* REFINED DESIGN IMPLEMENTATION */}
      <section className="bg-[#03413A] lg:py-20 lg:px-[1rem] xl:px-[5rem] 2xl:px-[8rem] font-['Inter']">
        <div className="relative bg-white max-w-[1600px] mx-auto lg:rounded-3xl px-6 md:px-6 lg:px-10 xl:px-20 py-10 lg:py-16 overflow-hidden">
          {/* SECTION LABEL */}
          <div className="hidden lg:block lg:absolute lg:top-2 lg:left-2">
            <span className="inline-block bg-[#C3E0DD61] text-[#03413A] text-xs font-bold px-6 py-2 rounded-full uppercase tracking-widest">
              OUR SERVICES
            </span>
          </div>

          <div className="grid lg:grid-cols-[380px_1fr] xl:grid-cols-[400px_1fr] gap-10 lg:gap-16 xl:gap-24 items-stretch">
            {/* LEFT SIDE */}
            <div className="flex items-center">
              <div
                ref={leftRef}
                className="w-full lg:max-w-[400px] space-y-8 lg:space-y-12"
              >
                {/* TOP CARD */}
                <div className="bg-[#03413A] rounded-2xl border border-[#C3E0DD]/30 px-3 lg:px-6 py-4">
                  <h2 className="font-[650] text-2xl text-[#FFFFFF] leading-tight mb-2">
                    Build a day that feels balanced
                  </h2>
                  <p className="text-[#FFFFFF] text-base mb-6">
                    Guide visitors from a calm morning flow to an evening Zumba
                    session, showing exactly how your classes fit into real
                    life.
                  </p>
                  <div className="flex gap-3">
                    <span className="rounded-full px-3 lg:px-4 py-2 bg-[#FFFFFF] text-xs font-medium text-[#03413A] uppercase">
                      3 anchor classes
                    </span>
                    <span className="rounded-full px-3 lg:px-4 py-2 bg-[#FFFFFF] text-xs font-medium text-[#03413A] uppercase">
                      1 mindful close
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleScrollToSubscription}
                    className="border-2 border-[#03413A] text-[#03413A] px-8 py-2 rounded-full text-sm font-semibold hover:bg-[#03413A] hover:text-white transition"
                  >
                    Start Now
                  </button>
                  <p className="text-sm text-[#555555] max-w-[200px]">
                    See how this rhythm can be personalized for you.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE — REMOVED SCROLL AS REQUESTED */}
            <div ref={scrollRef} className="relative h-auto">
              <div className="grid grid-cols-[100px_1fr] lg:grid-cols-[1fr_80px_1fr] relative">
                {/* CENTER LINE (Desktop) */}
                <div className="hidden lg:flex absolute left-1/2 -ml-[40px] h-full w-[80px] justify-center pointer-events-none">
                  <div className="w-[1px] bg-[#CFE6E2] h-full" />
                  <motion.div
                    className="absolute top-0 w-[2px] bg-[#C3E0DDC9] origin-top"
                    style={{ height: lineHeight }}
                  />
                </div>

                {services.map((service, index) => (
                  <React.Fragment key={service.serialNumber || index}>
                    <div className="lg:hidden relative flex justify-center row-span-2 pt-2 min-h-[120px]">
                      {/* VERTICAL LINE */}
                      <div className="absolute top-0 bottom-0 w-[2px] bg-[#03413A]" />

                      {/* TOP DOT – ONLY FIRST ITEM */}
                      {index === 0 && (
                        <div className="absolute top-0 w-2.5 h-2.5 rounded-full bg-[#03413A] z-10" />
                      )}

                      {/* CENTER ICON */}
                      <div className="relative z-10 mt-10 mb-10">

                          <div className="w-16 h-16 rounded-full border-2 border-[#03413A] bg-white flex items-center justify-center">
                            <img
                              src="/images/yoga.svg"
                              alt="yoga"
                              className="w-14 h-14 object-contain"
                            />
                          </div>

                      </div>

                      {/* BOTTOM DOT – ONLY LAST ITEM */}
                      {index === services.length - 1 && (
                        <div className="absolute bottom-0 w-2.5 h-2.5 rounded-full bg-[#03413A] z-10" />
                      )}
                    </div>

                    {/* LEFT TEXT */}
                    <div className="col-start-2 pt-3  lg:col-start-auto lg:pr-  group">
                      <div className="flex justify-between">
                        <h3 className="font-[650] lg:font-[700] font-poppins text-xl lg:text-[1.1rem] text-[#424242] lg:text-[#03413A] mb-2">
                          {service.title}
                        </h3>
                        {/* {isAdmin && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleModalOpen("edit", service)}
                              className="p-2 rounded-full hover:bg-[#E8FFFC]"
                            >
                              <GrEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteModalOpen(service)}
                              className="p-2 rounded-full hover:bg-red-50 text-red-500"
                            >
                              <MdDeleteOutline />
                            </button>
                          </div>
                        )} */}
                      </div>
                      <p className="text-[#666666] font-[400] text-md lg:text-[0.9rem] leading-tight mb-1 lg:pb-2 lg:pr-4">
                        {service.description}
                      </p>

                      {/* DYNAMIC META DATA */}
                      <p className={`text-xs text-[#555555] font-[400]  pb-2${(index === services.length - 1)?"":" lg:border-b-2 border-[#C3E0DD61]"}`}>
                        {service.meta || "30 min · Beginner friendly · Online"}
                      </p>
                    </div>

                    {/* DOT */}
                    <div className="hidden  lg:flex justify-center pt-2 w-[80px] z-10 lg:col-start-2">
                      <motion.div
                        className="w-3 h-3 bg-[#03413A] rounded-full ring-4 ring-white"
                        initial={{ scale: 0.8 }}
                        whileInView={{ scale: 1.2 }}
                      />
                    </div>

                    {/* RIGHT TEXT */}
                    <div className={`col-start-2 ${(index === services.length - 1)?"":"border-b-2 border-[#C3E0DD61]"}  lg:border-none lg:col-start-auto lg:pl pb-4 lg:pb-16`}>
                      <span className="hidden lg:inline-block border border-[#03413A] text-[#03413A] text-xs font-bold px-4 py-1.5 rounded-full mb-3 bg-[#C3E0DD]/20 uppercase">
                        {service.badge || "Focus"}
                      </span>
                      <span className="lg:hidden font-inter uppercase text-md font-semibold text-[#03413A] mb-1 block">
                     Great for
                      </span>
                      <p className="text-gray-500 text-sm">
                        {service.badgeText ||
                          "Mindful movement · Mobility · Posture correction"}
                      </p>
                    </div>
                  </React.Fragment>
                ))}

                {/* ADD SERVICE */}
                {/* {isAdmin && (
                  <div className="col-span-2 lg:col-span-3 flex justify-center py-8">
                    <button
                      onClick={() => handleModalOpen("create")}
                      className="flex flex-col items-center gap-3 text-[#03413A] font-bold"
                    >
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#03413A] flex items-center justify-center hover:bg-[#03413A] hover:text-white transition">
                        <FaPlus size={20} />
                      </div>
                      <span className="text-xs uppercase tracking-widest">
                        Add Service
                      </span>
                    </button>
                  </div>
                )} */}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Perks;
