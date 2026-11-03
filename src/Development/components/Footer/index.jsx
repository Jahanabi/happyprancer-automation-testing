import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import "./Footer.css";
import { useContext } from "react";
import InstitutionContext from "../../Context/InstitutionContext";
import Context from "../../Context/Context";
import { Button, Modal, FileInput, Label, TextInput } from "flowbite-react";
import { MdEdit } from "react-icons/md";
import {
  FaPlus,
  FaTimes,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
// import { API } from "../../Context/ContextProvider";
import { uploadData, getUrl } from "aws-amplify/storage";
import { toast } from "react-toastify";

const YOUTUBE_FALLBACK = "https://www.youtube.com/@happyprancerfitness/shorts";

const footerSections = [
  {
    title: "COMPANY",
    links: [
      { label: "About", path: "/aboutus" },
      { label: "Instructor", path: "/instructor" },
      { label: "Gallery", path: "/gallery" },
    ],
  },
  {
    title: "PRODUCT",
    links: [
      { label: "Classes", path: "/schedule" },
      { label: "Pricing", path: "/subscription" },
    ],
  },
  {
    title: "LEGAL",
    links: [
      { label: "Privacy Policy", path: "/privacypolicy" },
      { label: "Terms & Condition", path: "/terms" },
      { label: "Cancellation Policy", path: "/refund" },
    ],
  },
];

const Footer = (props) => {
  const { instructorDetails, isInstructorMode } = props;
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const Navigate = useNavigate();
  const UserCtx = useContext(Context);
  const isAdmin = UserCtx.userData.userType === "admin";
  const { updateInstructorAttribute, updateFooterData } = useContext(Context);
  const [modalShow, setModalShow] = useState(false);
  const [facebookLink, setFacebookLink] = useState("");
  const [instagramLink, setInstagramLink] = useState("");
  const [youtubeLink, setYoutubeLink] = useState(YOUTUBE_FALLBACK);
  const [displayLinks, setDisplayLinks] = useState({
    Facebook: "",
    Instagram: "",
    YouTube: YOUTUBE_FALLBACK,
  });
  const [addSection, setAddSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const { PrimaryColor } = InstitutionData;
  const [items, setItems] = useState([
    {
      item: "",
      link: "",
    },
  ]);
  const [selectedFile, setSelectedFile] = useState(null);

  const isInstructor = UserCtx.userData.userType === "instructor";
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const isHybridQuery = urlParams.get("hybrid") === "true";
  const isHybridPath = location.pathname.includes("/hybrid");
  const isHybridMode = isHybridQuery || isHybridPath || isInstructorMode;
  const { isAuth } = UserCtx;

  // Get the appropriate social links - instructor links in instructor mode, institution links otherwise
  const socialLinks = {
    Facebook: isInstructorMode
      ? instructorDetails?.instructorProfile?.socialLinks?.Facebook || ""
      : InstitutionData?.Facebook || "",
    Instagram: isInstructorMode
      ? instructorDetails?.instructorProfile?.socialLinks?.Instagram || ""
      : InstitutionData?.Instagram || "",
    YouTube: isInstructorMode
      ? instructorDetails?.instructorProfile?.socialLinks?.YouTube || ""
      : InstitutionData?.YouTube || YOUTUBE_FALLBACK,
  };

  // Initialize social links based on mode
  useEffect(() => {
    const currentFacebook = isInstructorMode
      ? instructorDetails?.instructorProfile?.socialLinks?.Facebook || ""
      : InstitutionData?.Facebook || "";

    const currentInstagram = isInstructorMode
      ? instructorDetails?.instructorProfile?.socialLinks?.Instagram || ""
      : InstitutionData?.Instagram || "";

    const currentYouTube = isInstructorMode
      ? instructorDetails?.instructorProfile?.socialLinks?.YouTube || ""
      : InstitutionData?.YouTube || YOUTUBE_FALLBACK;

    setDisplayLinks({
      Facebook: currentFacebook,
      Instagram: currentInstagram,
      YouTube: currentYouTube,
    });

    // Only update input fields if modal is not open to avoid overriding user input
    if (!modalShow) {
      setFacebookLink(currentFacebook);
      setInstagramLink(currentInstagram);
      setYoutubeLink(currentYouTube);
    }
  }, [instructorDetails, isInstructorMode, InstitutionData, modalShow]);

  // Initialize modal fields when modal opens
  useEffect(() => {
    if (modalShow) {
      setFacebookLink(displayLinks.Facebook);
      setInstagramLink(displayLinks.Instagram);
      setYoutubeLink(displayLinks.YouTube || YOUTUBE_FALLBACK);
    }
  }, [modalShow, displayLinks]);

  // Handle instructor updates
  const handleInstructorUpdate = async () => {
    try {
      const socialLinksUpdate = {
        Facebook: facebookLink,
        Instagram: instagramLink,
        YouTube: youtubeLink,
      };

      const attributeName = "socialLinks";
      await updateInstructorAttribute(
        InstitutionData.InstitutionId,
        attributeName,
        {
          cognitoId: isInstructorMode
            ? instructorDetails?.cognitoId
            : UserCtx.userData.cognitoId,
          [attributeName]: socialLinksUpdate,
        },
      );

      // Update display links immediately after successful API call
      setDisplayLinks({
        Facebook: facebookLink,
        Instagram: instagramLink,
        YouTube: youtubeLink,
      });

      // Update the instructor details in parent component if possible
      if (instructorDetails && instructorDetails.instructorProfile) {
        instructorDetails.instructorProfile.socialLinks = socialLinksUpdate;
      }

      toast.success("Social links updated successfully!");
      setModalShow(false);
    } catch (error) {
      console.error("Error updating social links:", error);
      toast.error("Error updating social links");
    }
  };

  // Add new item input
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        item: "",
        link: "",
      },
    ]);
  };

  const handleChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Remove all inputs
  const handleCancel = () => {
    setAddSection(false);
    setNewSectionTitle("");
    setItems([{ item: "", link: "" }]);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [props.initialContent]);

  const onCloseModal = () => {
    setModalShow(false);
  };

  const onCloseModal2 = () => {
    setAddSection(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        alert("Only JPG, JPEG, and PNG files are allowed.");
        event.target.value = "";
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const uploadToS3 = async (file) => {
    try {
      const result = await uploadData({
        key: `Logo/${file.name}`,
        data: file,
        options: {
          contentType: file.type,
          accessLevel: "guest", // Assuming public access is desired as per previous ACL: public-read
        },
      }).result;
      const urlResult = await getUrl({
        key: result.key,
        options: { accessLevel: "guest" },
      });
      return urlResult.url.toString().split("?")[0];
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw error;
    }
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);

    if (newItems.length === 0) {
      handleCancel();
    }
  };

  const handleUpdateFooter = async () => {
    try {
      let newUrl;
      let AdditionalColumn = {};

      if (selectedFile) {
        newUrl = await uploadToS3(selectedFile);
      } else {
        newUrl = InstitutionData.logoUrl;
      }

      if (newSectionTitle.trim() !== "") {
        AdditionalColumn = {
          title: newSectionTitle,
          items: items,
        };
      }

      const response = await updateFooterData({
        institutionid: InstitutionData.institutionid,
        Facebook: facebookLink,
        Instagram: instagramLink,
        YouTube: youtubeLink,
        logoUrl: newUrl,
        AdditionalColumn: AdditionalColumn,
      });

      // Update display links and institution data immediately
      setDisplayLinks({
        Facebook: facebookLink,
        Instagram: instagramLink,
        YouTube: youtubeLink,
      });

      // Update the context data
      InstitutionData.Facebook = facebookLink;
      InstitutionData.Instagram = instagramLink;
      InstitutionData.YouTube = youtubeLink;

      setModalShow(false);
      console.log(response);
      toast.success("Footer updated successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Error in Updating the Data");
    }
  };

  const handleUpdateClick = () => {
    setModalShow(false);
    if (isInstructor || isInstructorMode) {
      handleInstructorUpdate();
    } else {
      handleUpdateFooter();
    }
  };

  return (
    <div className="">
      {/* --- MODALS (Preserved Functionality) --- */}
      <Modal show={modalShow} size="lg" onClose={onCloseModal} popup>
        <Modal.Header className="py-4 px-4">Update Footer Section</Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            {isAdmin && !isInstructorMode && (
              <div id="fileUpload" className="max-w-md">
                <div className="mb-2 block">
                  <Label htmlFor="file" value="Upload Logo" />
                </div>
                <FileInput
                  id="fileUpload"
                  accept=".jpg, .jpeg, .png, .img"
                  onChange={handleFileChange}
                  helperText="Upload a Logo (img, jpg, jpeg, png)"
                />
              </div>
            )}
            <div className="max-w-md">
              <div className="mb-2 block">
                <Label htmlFor="text" value="Facebook Link" />
              </div>
              <TextInput
                color={"primary"}
                id="text"
                type="text"
                value={facebookLink}
                placeholder="Enter Facebook Link"
                onChange={(e) => setFacebookLink(e.target.value)}
                required
                rightIcon={MdEdit}
              />
            </div>
            <div className="max-w-md">
              <div className="mb-2 block">
                <Label htmlFor="text" value="Instagram Link" />
              </div>
              <TextInput
                color={"primary"}
                id="text"
                type="text"
                value={instagramLink}
                placeholder="Enter Instagram Link"
                onChange={(e) => setInstagramLink(e.target.value)}
                required
                rightIcon={MdEdit}
              />
            </div>
            <div className="max-w-md">
              <div className="mb-2 block">
                <Label htmlFor="youtube" value="YouTube Link" />
              </div>
              <TextInput
                color={"primary"}
                id="youtube"
                type="text"
                value={youtubeLink}
                placeholder="Enter YouTube Link"
                onChange={(e) => setYoutubeLink(e.target.value)}
                required
                rightIcon={MdEdit}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            style={{ backgroundColor: PrimaryColor }}
            onClick={handleUpdateClick}
            className="w-full">
            Update
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={addSection} onClose={onCloseModal2} popup>
        <Modal.Header className="py-4 px-4">Update Footer Section</Modal.Header>
        <Modal.Body>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="sectionTitle" value="Title" />
            </div>
            <TextInput
              color={"primary"}
              id="sectionTitle"
              type="text"
              placeholder="Enter title of new column"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              required
            />
          </div>
          {items.map((entry, index) => (
            <div key={index} className="relative mb-2">
              <button
                onClick={() => handleRemoveItem(index)}
                className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                <FaTimes size={10} />
              </button>
              <div className="mb-2 block">
                <Label htmlFor={`item-${index}`} value={`Item ${index + 1}`} />
              </div>
              <div className="flex flex-row justify-between gap-3">
                <TextInput
                  color="primary"
                  id={`item-${index}`}
                  type="text"
                  placeholder="Enter item"
                  value={entry.item}
                  onChange={(e) => handleChange(index, "item", e.target.value)}
                  required
                  className="w-[50%]"
                />
                <TextInput
                  color="primary"
                  id={`link-${index}`}
                  type="text"
                  placeholder="Enter Link"
                  value={entry.link}
                  onChange={(e) => handleChange(index, "link", e.target.value)}
                  required
                  className="w-[50%]"
                />
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleAddItem}
              className="bg-gray-300 text-black text-sm flex flex-row items-center justify-center p-0 m-0 hover:bg-gray-400 group">
              <FaPlus className="mr-1 group-hover:text-white" />
              <span className="group-hover:text-white">Add Item</span>
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            style={{ backgroundColor: PrimaryColor }}
            onClick={() => {
              setAddSection(false);
              handleUpdateFooter();
            }}
            className="w-full">
            Update
          </Button>
        </Modal.Footer>
      </Modal>

      {/* --- NEW FOOTER DESIGN --- */}
      <footer className="bg-[#03413A] text-[#C3E0DD] relative px-2 pt-10 pb-  xl:px-6 lg:px-12">
        {/* Admin Edit Trigger (Preserved but styled to fit) */}
        {/* {(isAdmin || (isInstructor && isHybridMode) || isInstructorMode) && (
          <button
            onClick={() => setModalShow(true)}
            className="absolute top-4 left-4 text-white/50 hover:text-white transition-colors p-2"
            title="Edit Footer"
          >
            <MdEdit size={20} />
          </button>
        )} */}

        <div className="">
          <div className="flex flex-col xl:flex-row gap-12 pb-4 md:px-4  xl:px-10">
            {/* LEFT SIDE: LOGO & DESC */}
            <div className="flex xl:flex-col xl:pl-12 items-start xl:justify-center gap-4 xl:w-[32%]">
              <Link to="/" className="xl:pl-10 block shrink-0">
                {/* Using static image as requested */}
                <img
                  src="/images/footer.png"
                  alt="HappyPrancer"
                  className="h-16 w-16 xl:h-32 xl:w-32 md:h-24 md:w-24  object-contain"
                />
              </Link>
              <div>
                <h3 className="hidden xl:block text-4xl font-semibold font-baijamjuree leading-1 text-white mb-3">
                  HappyPrancer
                </h3>
                <p className="text-[#C3E0DDA6] text-md md:text-lg xl:text-xl font-[600] font-inter leading-tight max-w-sm">
                  Live yoga and dance fitness, with a community that helps you keep showing up.
                </p>
              </div>
            </div>

            {/* RIGHT SIDE: LINKS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 px-2 xl:grid-cols-4 gap- xl:w-[68%] pt-2 xl:mt-8">
              {footerSections.map((section, index) => (
                <div key={index}>
                  <h4 className="text-[#FFFFFFC9] text-lg font-[600] font-inter tracking-wider mb-6 border-b-2 border-[#4D7C75] pb-2 xl:pb-0 xl:pr-10 inline-block">
                    {section.title}
                  </h4>
                  <ul className="space-y-3">
                    {section.links.map((link, idx) => (
                      <li key={idx}>
                        <Link
                          to={link.path}
                          className="hover:text-white text-[#C3E0DDDB] font-[450] transition-colors"
                          style={{ color: "#C3E0DDDB" }}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                    {/* Dynamic Links for PRODUCT section */}
                    {section.title === "PRODUCT" && (
                      <>
                        {InstitutionData?.Footer_Link_1 && (
                          <li>
                            <a
                              href={InstitutionData.Footer_Link_1}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-white text-[#C3E0DDDB] transition-colors"
                              style={{ color: "#C3E0DDDB" }}>
                              BWORKZ
                            </a>
                          </li>
                        )}
                        {InstitutionData?.Footer_Link_2 && (
                          <li>
                            <a
                              href={InstitutionData.Footer_Link_2}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-white text-[#C3E0DDDB] transition-colors"
                              style={{ color: "#C3E0DDDB" }}>
                              Zumba
                            </a>
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                </div>
              ))}

              {/* COL 4: CONTACT */}
              <div>
                <h4 className="text-[#FFFFFFC9] text-lg font-[600] font-inter tracking-wider mb-6 border-b-2 mt-2 md:!mt-0 border-[#4D7C75] pb-2 xl:pb-0 xl:pr-10 inline-block">
                  CONTACT
                </h4>
                <div className="space-y-4">
                  <a
                    href="mailto:admin@happyprancer.com"
                    className="text-[#C3E0DD]/90 hover:text-[#C3E0DD] transition cursor-pointer break-all">
                    admin@happyprancer.com
                  </a>
                  <a
                    href="tel:+12735227398"
                    className="text-[#C3E0DD]/90 hover:text-[#C3E0DD] transition cursor-pointer block">
                    +1(273)5227398
                  </a>

                  <div className="flex gap-2 mt-6">
                    {displayLinks.Facebook && (
                      <a
                        href={displayLinks.Facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-[#C3E0DDCF] flex items-center justify-center hover:bg-[#9FCFC8] hover:text-[#03413A] transition text-[#C3E0DDCF]">
                        <FaFacebookF />
                      </a>
                    )}
                    {displayLinks.Instagram && (
                      <a
                        href={displayLinks.Instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-[#C3E0DDCF] flex items-center justify-center hover:bg-[#9FCFC8] hover:text-[#03413A] transition text-[#C3E0DDCF]">
                        <FaInstagram />
                      </a>
                    )}
                    {(displayLinks.YouTube || YOUTUBE_FALLBACK) && (
                      <a
                        href={displayLinks.YouTube || YOUTUBE_FALLBACK}
                        target="_blank"
                        rel="noreferrer"
                        className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-[#C3E0DDCF] flex items-center justify-center hover:bg-[#9FCFC8] hover:text-[#03413A] transition text-[#C3E0DDCF]">
                        <FaYoutube />
                      </a>
                    )}
                    {/* <div className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-[#C3E0DDCF] flex items-center justify-center hover:bg-[#9FCFC8] hover:text-[#03413A] transition text-[#C3E0DDCF]">
                      <FaTwitter />
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COPYRIGHT */}
          <div className="text-center pt-5 pb-3 text-[#C3E0DD61] text-md font-inter font-[500]">
            All rights reserved. © {new Date().getFullYear()} happyprancer.com
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
