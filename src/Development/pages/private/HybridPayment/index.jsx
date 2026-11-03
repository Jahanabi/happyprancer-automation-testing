import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
// import { API } from "../../../Context/ContextProvider";
import Footer from "../../../components/Footer";
import NavBar from "../../../components/Header";
import Context from "../../../Context/Context";
import InstitutionContext from "../../../Context/InstitutionContext";
import HappyprancerPaypalHybrid from "../../public/Subscription/HappyprancerPaypalHybrid";
import Testemonial from "./Testemonial";
import SubscriptionCard from "./SubscriptionCard";

import "./Carousel.css";
import InstructorTestimonial from "./InstructorTestimonial";
import InstructorBasedHybrid from "./Carousel";
import HybridReferral from "../../../common/ReferralCode/HybridReferral";
import InPersonClassManager from "./InPersonClassManager";
import { toast } from "react-toastify";
import fileUpload from "../../../common/utils/upload-file";
import { FaCamera, FaSpinner, FaTrash } from "react-icons/fa";
import EditableFeatures from "./EditableFeatures";
import EditableOverview from "./EditableOverview";
import Transform from "./Transform";
import EditableHero from "./EditableHero";

const HybridPayment = () => {
    const { institutionData: InstitutionData } = useContext(InstitutionContext);
    const {
        isAuth,
        productList,
        userData: UserCtx,
        util: Util,
        createPresetSubscriptions,
        assignPaypalPlans,
        getInstructorProfileByReferral,
        deleteObject,
        updateInstructorAttribute,
    } = useContext(Context);
    const [hybridPageInstructorDetails, setHybridPageInstructorDetails] =
        useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // State for page scroll animation
    const [scrollY, setScrollY] = useState(0);
    // State for instructor mode
    const [isInstructorMode, setIsInstructorMode] = useState(false);
    // State for background image
    const [backgroundImage, setBackgroundImage] = useState(null);
    // State for image loading
    const [imageLoading, setImageLoading] = useState(false);
    // Reference for hidden file input
    const fileInputRef = useRef(null);

    // Get query params
    const queryParams = new URLSearchParams(location.search);
    const institution = queryParams.get("institution");
    const referral = queryParams.get("referral");

    useEffect(() => {
        const autoSetupInstructorProducts = async () => {
            if (
                UserCtx?.userType === "instructor" &&
                hybridPageInstructorDetails &&
                UserCtx?.cognitoId === hybridPageInstructorDetails?.cognitoId &&
                !hybridPageInstructorDetails.hybridProducts?.length
            ) {
                try {
                    Util.setLoader(true);
                    const countryCode = UserCtx.phoneNumber?.startsWith("+91")
                        ? "+91"
                        : "US";

                    if (countryCode.includes("+91")) {
                        await createPresetSubscriptions(InstitutionData.InstitutionId, {
                                    cognitoId: UserCtx.cognitoId,
                                    country: "india",
                                });
                    } else {
                        await assignPaypalPlans(InstitutionData.InstitutionId, {
                                    cognitoId: UserCtx.cognitoId,
                                    country: "USA",
                                });
                    }

                    // Refresh instructor details
                    const updatedDetails = await getInstructorProfileByReferral(InstitutionData.InstitutionId, referral);
                    setHybridPageInstructorDetails(updatedDetails);

                    toast.success("Hybrid payment products have been set up for you!");
                } catch (error) {
                    console.error("Auto-setup error:", error);
                    toast.warning(
                        "Please contact admin to set up your hybrid payment products"
                    );
                } finally {
                    Util.setLoader(false);
                }
            }
        };

        autoSetupInstructorProducts();
    }, [UserCtx, hybridPageInstructorDetails]);

    // Fetch instructor details if institution is present
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await getInstructorProfileByReferral(InstitutionData.InstitutionId, referral);
                setHybridPageInstructorDetails(response);
                console.log("Instructor Details:", response);
                // Set background image if it exists
                if (response?.instructorProfile?.hybridHeroImage) {
                    setBackgroundImage(
                        response?.instructorProfile?.hybridHeroImage || null
                    );
                }
            } catch (error) {
                console.error("Error fetching instructor details:", error);
            }
        };
        fetchDetails();
    }, [InstitutionData.InstitutionId, referral]);

    // Handle scroll effects
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Check if the current user is an instructor
    useEffect(() => {
        if (
            UserCtx?.userType === "instructor" &&
            UserCtx?.cognitoId === hybridPageInstructorDetails?.cognitoId
        ) {
            setIsInstructorMode(true);
        }
    }, [UserCtx, hybridPageInstructorDetails]);

    // Function to trigger file input click
    const handleUploadButtonClick = () => {
        fileInputRef.current.click();
    };

    // Enhanced file change handler with previous image deletion
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
            toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
            return;
        }

        setImageLoading(true);
        try {
            // Delete previous image if exists
            if (backgroundImage) {
                // Extract key from current image URL
                let key = "";
                try {
                    if (backgroundImage.includes("amazonaws.com/")) {
                        key = backgroundImage.split("amazonaws.com/")[1];
                    } else {
                        key = `${InstitutionData.InstitutionId}/hybrid/${UserCtx.cognitoId}/hybrid-hero-image`;
                    }

                    // Delete the previous image
                    await deleteObject(key);

                    console.log("Previous background image deleted successfully");
                } catch (error) {
                    console.warn("Error deleting previous background image:", error);
                    // Continue with upload even if deletion fails
                }
            }

            // Upload new image
            const bucketName = "institution-utils";
            const region = "us-east-1";
            const folder = `${InstitutionData.InstitutionId}/hybrid/${UserCtx.cognitoId}/hybrid-hero-image`;

            const fileUrl = await fileUpload({
                bucket: bucketName,
                region,
                folder,
                file,
            });

            // Update state with new URL
            setBackgroundImage(fileUrl);

            // Update in database
            const attributeName = "hybridHeroImage";
            await updateInstructorAttribute(InstitutionData.InstitutionId, attributeName, {
                        cognitoId: UserCtx.cognitoId,
                        [attributeName]: fileUrl,
                    });

            toast.success("Background image updated successfully!");
        } catch (error) {
            console.error("Error uploading background image:", error);
            toast.error("Failed to upload image. Please try again.");
        } finally {
            setImageLoading(false);
        }
    };

    // Function to delete the background image
    const handleDeleteBackground = async () => {
        if (
            !window.confirm("Are you sure you want to remove this background image?")
        ) {
            return;
        }

        setImageLoading(true);
        try {
            if (backgroundImage) {
                // Extract key from current image URL
                let key = "";
                try {
                    if (backgroundImage.includes("amazonaws.com/")) {
                        key = backgroundImage.split("amazonaws.com/")[1];
                    } else {
                        key = `${InstitutionData.InstitutionId}/hybrid/${UserCtx.cognitoId}/hybrid-hero-image`;
                    }

                    // Delete the image
                    await deleteObject(key);
                } catch (error) {
                    console.warn("Error deleting background image:", error);
                }
            }

            // Update in database (set to null)
            const attributeName = "hybridHeroImage";
            await updateInstructorAttribute(InstitutionData.InstitutionId, attributeName, {
                        cognitoId: UserCtx.cognitoId,
                        [attributeName]: null,
                    });

            // Update state
            setBackgroundImage(null);
            toast.success("Background image removed successfully!");
        } catch (error) {
            console.error("Error removing background image:", error);
            toast.error("Failed to remove background image. Please try again.");
        } finally {
            setImageLoading(false);
        }
    };

    const handleFreeTrial = () => {
        if (isAuth) {
            toast.info(
                "Sorry you are already logged in. This is for new users only."
            );
            const userConfirmed = window.confirm(
                "You already have an account.\nDo you want to go to dashboard?"
            );
            if (userConfirmed) {
                navigate("/dashboard");
            }
        } else {
            navigate("/signup?trial=true&trialPeriod=Monthly");
        }
    };

    const handleManageSubscriptions = () => {
        navigate("/instructor-subscription-manager", {
            state: {
                instructorDetails: hybridPageInstructorDetails,
            },
        });
    };

    return (
        <>
            <NavBar />


            {/* Hero Section with Parallax Effect and Customizable Background */}
            <motion.div className="relative min-h-[100vh] sm:min-h-[80vh] md:min-h-[90vh] overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${InstitutionData.PrimaryColor}22 0%, ${InstitutionData.SecondaryColor}44 100%)`,
                }}>
                {/* Background Image with Instructor's Custom Image */}
                <motion.div
                    className="absolute inset-0 z-0"
                    style={{
                        y: scrollY * 0.5,
                        backgroundImage: backgroundImage
                            ? `url('${backgroundImage}')`
                            : "url('https://images.unsplash.com/photo-1747567003821-422438e6fdcc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTI2fHx5b2dhJTIwYXNhbmElMjAzZHxlbnwwfHwwfHx8MA%3D%3D')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        opacity: 0.15,
                    }}
                />
                {isInstructorMode && (
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                        <button
                            onClick={handleUploadButtonClick}
                            disabled={imageLoading}
                            className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white backdrop-blur-sm rounded-lg shadow-md transition-all duration-200 text-sm"
                            style={{ color: InstitutionData.PrimaryColor }}
                        >
                            {imageLoading ? (
                                <FaSpinner className="animate-spin" />
                            ) : (
                                <FaCamera />
                            )}
                            <span>
                                {backgroundImage ? "Change Background" : "Add Background"}
                            </span>
                        </button>

                        {backgroundImage && (
                            <button
                                onClick={handleDeleteBackground}
                                disabled={imageLoading}
                                className="flex items-center gap-2 px-3 py-2 bg-red-500/80 hover:bg-red-600 text-white backdrop-blur-sm rounded-lg shadow-md transition-all duration-200 text-sm"
                            >
                                <FaTrash />
                                <span>Remove</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                />

                <div className="relative z-10 h-full flex items-center w-full">
                    <div className="w-full py-0 mt-0">
                        <EditableHero
                            instructorDetails={hybridPageInstructorDetails}
                            isInstructorMode={isInstructorMode}
                            onManageSubscriptions={handleManageSubscriptions}
                        />
                    </div>
                </div>

                {/* Curved shape divider - responsive height */}
                {/* <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-[30px] sm:h-[50px] md:h-[75px] lg:h-[100px]"
            style={{ fill: "#ffffff" }}>
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C57.17,88.93,159.17,74.62,321.39,56.44Z"></path>
          </svg>
        </div> */}
            </motion.div>

            {/* Mobile Carousel */}
            <div className="lg:hidden py-4 sm:py-6 px-4">
                <InstructorBasedHybrid
                    instructorDetails={hybridPageInstructorDetails}
                />
            </div>

            {/* Features Section with animated cards */}
            <EditableFeatures
                instructorDetails={hybridPageInstructorDetails}
                isInstructorMode={isInstructorMode}
            />

            {/* Rest of sections with improved responsiveness */}
            <motion.section className="py-4 sm:py-6 md:py-8 bg-white">
                <div className="container mx-auto flex flex-col items-center px-4">
                    <InstructorTestimonial
                        instructorDetails={hybridPageInstructorDetails}
                    />
                </div>
            </motion.section>

            <section className="py-4 sm:py-6 md:py-8 bg-white">
                <div className="container mx-auto px-4 flex flex-col items-center">
                    <Testemonial instructorDetails={hybridPageInstructorDetails} />
                </div>
            </section>

            {/* Transform CTA tucked closer to testimonials */}
            <div className="py-4 sm:py-6 md:py-8">
                <Transform
                    onClaim={handleFreeTrial}
                    primaryColor={InstitutionData.PrimaryColor}
                />
            </div>

            {/* Overview Section */}
            {/* <EditableOverview
        instructorDetails={hybridPageInstructorDetails}
        isInstructorMode={isInstructorMode}
      /> */}

            {/* In-Person Classes Section */}
            {/* <section className="py-8 sm:py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <InPersonClassManager
            instructorDetails={hybridPageInstructorDetails}
          />
        </div>
      </section> */}

            {/* Subscription Cards */}
            {/* <motion.section
        className="py-8 sm:py-12 md:py-16 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}>
        <div className="container mx-auto px-4 flex flex-col items-center">
          <SubscriptionCard instructorDetails={hybridPageInstructorDetails} />
        </div>
      </motion.section> */}

            <Footer
                instructorDetails={hybridPageInstructorDetails}
                isInstructorMode={isInstructorMode}
            />
        </>
    );
};

export default HybridPayment;