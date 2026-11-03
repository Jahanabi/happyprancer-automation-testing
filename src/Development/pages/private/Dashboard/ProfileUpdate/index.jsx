import {
  getCurrentUser,
  signIn,
  updatePassword,
  updateUserAttributes,
  confirmUserAttribute,
  signOut,
} from "aws-amplify/auth";
import { uploadData, getUrl } from "aws-amplify/storage";
// import { API } from "../../../../Context/ContextProvider";
import { Label, TextInput, Tooltip } from "flowbite-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import AvatarEditor from "react-avatar-editor";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { FaArrowCircleRight } from "react-icons/fa";
import { FaArrowLeft, FaCalendarAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { Button2 } from "../../../../common/Inputs";
import Context from "../../../../Context/Context";

import InstitutionContext from "../../../../Context/InstitutionContext";
import EditableInput from "./EditableInput";
import HybridReferral from "../../../../common/ReferralCode/HybridReferral.jsx";
import ReferralCode from "../../../../common/ReferralCode/index.jsx";
import "./index.css";
import EditableTextArea from "./EditableTextArea.jsx";
import institutionData from "../../../../constants.js";
import InsrtuctorReferral from "../../../../common/ReferralCode/index.jsx";
import { useNavigate } from "react-router-dom";
import { RiPagesFill } from "react-icons/ri";
import { htmlToPlainText, plainTextToHtml } from "../../../../utils/helpers.js";
import { Loader } from "lucide-react";
import countriesData from "../../../../common/Inputs/countries.json";

const ProfileUpdate = () => {
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const Ctx = useContext(Context);
  const UserCtx = useContext(Context).userData;
  const UtilCtx = useContext(Context).util;
  const {
    userData,
    setUserData,
    getInstructorProfileByReferral,
    updateUserProfileImage,
    updateUserProfile,
    getBirthdayMessage,
  } = useContext(Context);
  const [name, setName] = useState(UserCtx.userName);
  // Replace the old country line:
  const [country, setCountry] = useState(UserCtx.country || "");
  const [stateProvince, setStateProvince] = useState(UserCtx.stateProvince || "");
  const [postalCode, setPostalCode] = useState(UserCtx.postalCode || "");
  const [showCountrySelectDropdown, setShowCountrySelectDropdown] = useState(false);
  const [countrySelectSearch, setCountrySelectSearch] = useState("");

  const [currentEmail, setCurrentEmail] = useState(UserCtx.emailId);
  const [showForm, setShowForm] = useState(false);
  const [about, setAbout] = useState(
    UserCtx.hasOwnProperty("about") ? htmlToPlainText(UserCtx.about) : "",
  );
  const [dobError, setDobError] = useState("");

  const [image, setImage] = useState(null);
  const [editor, setEditor] = useState(null);
  const [scale, setScale] = useState(1);
  const getInitials = (name) => {
    if (!name) return "";
    const names = name.split(" ");
    const initials = names.map((name) => name.charAt(0).toUpperCase()).join("");
    return initials;
  };

  const getColor = (name) => {
    if (!name) return "#888888";
    const colors = [
      "#FF5733",
      "#33FF57",
      "#5733FF",
      "#FF5733",
      "#33FF57",
      "#5733FF",
      "#FF5733",
      "#33FF57",
      "#5733FF",
      "#FF5733",
      "#33FF57",
      "#5733FF",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const parsePhoneNumber = (phone) => {
    if (!phone) return { countryCode: "91", phoneNumber: "" };

    const normalized = phone.replace(/[^0-9]/g, "");
    const sortedCodes = countriesData
      .map((c) => c.value)
      .sort((a, b) => b.length - a.length);

    const matchedCode = sortedCodes.find((code) => normalized.startsWith(code));

    const countryCode = matchedCode || "91";
    const phoneNumber = normalized.slice(countryCode.length);

    return { countryCode, phoneNumber };
  };

  let domain;
  if (process.env.NODE_ENV === "development") {
    domain = "http://localhost:3000";
  } else if (process.env.REACT_APP_STAGE === "DEV") {
    domain = institutionData.BETA_DOMAIN;
  } else if (process.env.REACT_APP_STAGE === "PROD") {
    domain = institutionData.PROD_DOMAIN;
  }

  let referralLink;
  if (userData.userType === "instructor") {
    referralLink = `${domain}/hybrid/?institution=${userData.institution}&referral=${userData.referral_code}`;
  }

  const handleHybridPageClick = () => {
    navigate(
      `/hybrid?institution=${userData.institution}&referral=${userData.referral_code}`,
    );
  };

  const formatDate = (epochDate) => {
    epochDate = Number(epochDate);
    if (!epochDate) return "";
    const date = new Date(epochDate);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const formattedDay = day < 10 ? `0${day}` : day;
    const formattedMonth = month < 10 ? `0${month}` : month;
    const userLocation =
      localStorage.getItem("userLocation") || UserCtx?.location?.countryCode;
    return userLocation === "IN"
      ? `${formattedDay}/${formattedMonth}/${year}`
      : `${formattedMonth}/${formattedDay}/${year}`;
  };
  const fileInputRef = useRef(null);
  const [joiningDate] = useState(formatDate(UserCtx?.joiningDate));
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState(UserCtx.dob || "");
  const [address, setAddress] = useState(UserCtx.address || "");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isChangePassword, setIsChangePassword] = useState(false);
  const [err, setErr] = useState("");
  const parsedPhone = parsePhoneNumber(UserCtx.phoneNumber || "");
  const [countryCode, setCountryCode] = useState(parsedPhone.countryCode);
  const [phoneNumber, setPhoneNumber] = useState(parsedPhone.phoneNumber);
  const [phoneCode, setPhoneCode] = useState("");
  const [isPhoneChange, setIsPhoneChange] = useState(false);
  const [isPhoneCode, setIsPhoneCode] = useState(false);
  const [countryCodeSearch, setCountryCodeSearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [showConfirmationPassword, setShowConfirmationPassword] =
    useState(false);

  const showPasswordAction =
    (!UserCtx?.signupMethod || UserCtx?.signupMethod === "manual") &&
    !UserCtx?.oauthProvider;
  const filteredCountries = countriesData.filter((country) => {
    const searchTerm = countryCodeSearch.toLowerCase();
    return (
      country.name.toLowerCase().includes(searchTerm) ||
      country.value.includes(searchTerm) ||
      country.countryCode.toLowerCase().includes(searchTerm)
    );
  });
  const [useEditableInput, setUseEditableInput] = useState(true);
  const [noHybridProducts, setNoHybridProducts] = useState(false);

  const [tempDob, setTempDob] = useState(
    dob ? new Date(Number(dob)).toISOString().split("T")[0] : "",
  );
  const isDobSet = !!UserCtx.dob;

  const fetchInstructorProfile = async () => {
    if (UserCtx?.userType === "instructor" && UserCtx?.referral_code) {
      //Call the api to get the instructor profile
      const response = await getInstructorProfileByReferral(
        InstitutionData.InstitutionId,
        UserCtx?.referral_code,
      );
      if (!response?.hybridProducts?.length) {
        setNoHybridProducts(true);
      }
    }
    return;
  };

  useEffect(() => {
    if (!UserCtx) {
      return;
    }
    fetchInstructorProfile();
  }, [UserCtx]);

  useEffect(() => {
    if (!UserCtx) {
      return;
    }
    fetchInstructorProfile();
  }, [UserCtx]);

  const ifDataChanged = () => {
    const formattedDob = tempDob ? String(new Date(tempDob).getTime()) : "";
    const fullPhoneNumber = `+${countryCode}${phoneNumber?.trim() || ""}`;
    return (
        (name?.trim() || "") !== (UserCtx.userName?.trim() || "") ||
        (currentEmail?.trim() || "") !== (UserCtx.emailId?.trim() || "") ||
        fullPhoneNumber !== (UserCtx.phoneNumber?.trim() || "") ||
        formattedDob !== (UserCtx.dob || "") ||
        (address?.trim() || "") !== (UserCtx.address?.trim() || "") ||
        (country?.trim() || "") !== (UserCtx.country?.trim() || "") ||
        (stateProvince?.trim() || "") !== (UserCtx.stateProvince?.trim() || "") ||
        (postalCode?.trim() || "") !== (UserCtx.postalCode?.trim() || "")
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
  };

  const handleEditClick = () => {
    fileInputRef.current.click();
  };

  const handleSave = () => {
    if (editor) {
      const canvasScaled = editor.getImageScaledToCanvas();
      const croppedImage = canvasScaled.toDataURL();
      handleFileUpload(croppedImage);
    }
  };

  const handleCancel = () => {
    setImage(null);
    setEditor(null);
  };

  const handleFileUpload = async (base64File) => {
    UtilCtx.setLoader(true);
    try {
      if (base64File.size > 5 * 1024 * 1024) {
        throw new Error("File size exceeds 5MB limit.");
      }
      const currentUser = await getCurrentUser();
      const cognitoId = currentUser.userId || currentUser.username;
      const blob = await fetch(base64File).then((res) => res.blob());
      const response = await uploadData({
        key:
          `${InstitutionData.InstitutionId}/${cognitoId}/profile.jpg?v=` +
          new Date().getTime(),
        data: blob,
        options: {
          accessLevel: "guest", // or 'guest' based on your requirement, public replaced by guest usually
          // region: "us-east-1", // V6 handles config
          contentType: blob.type,
          // ACL: "public-read", // V6 doesn't support ACLs same way, handled by bucket policy
        },
      }).result;
      let imageUrl = (
        await getUrl({ key: response.key, options: { accessLevel: "guest" } })
      ).url.toString();
      imageUrl = imageUrl.split("?")[0];
      const apiResponse = await updateUserProfileImage(
        InstitutionData.InstitutionId,
        {
          imgUrl: imageUrl,
        },
      );
      const tempUser = { ...UserCtx, imgUrl: imageUrl };
      Ctx.setUserData(tempUser);
    } catch (error) {
      console.error("Error uploading profile picture: ", error);
    } finally {
      UtilCtx.setLoader(false);
      setImage(null);
    }
  };

  const phoneNumberValidator = (code, phone) => {
    // Remove any spaces or special characters from phone
    const cleanPhone = phone.replace(/[^0-9]/g, "");

    // Basic validation: phone should have 7-15 digits
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      return false;
    }

    // If country code is 91 (India), validate Indian phone format
    if (code === "91") {
      return /^[6-9]\d{9}$/.test(cleanPhone);
    }

    // For other countries, accept 7-15 digits
    return /^\d{7,15}$/.test(cleanPhone);
  };

  const postalCodeValidator = (code, countryValue) => {
    const clean = (code || "").trim();
    if (!clean) return true; // optional field
    // India: 6 digits. Otherwise: loose 3–10 alphanumeric check.
    if (countryValue === "India") return /^\d{6}$/.test(clean);
    return /^[A-Za-z0-9\s-]{3,10}$/.test(clean);
  };

  const handleEmailChangeConfirmation = async () => {
    if (!confirmationPassword) {
      toast.error("Please enter your password to confirm email change");
      return;
    }

    UtilCtx.setLoader(true);
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(currentEmail)) {
        throw new Error("Invalid email format");
      }

      if (!phoneNumberValidator(countryCode, phoneNumber)) {
        throw new Error("Invalid phone number format");
      }

      const fullPhoneNumber = `+${countryCode}${phoneNumber.trim()}`;
      const formattedDob = tempDob ? String(new Date(tempDob).getTime()) : "";
      const aboutHtml = plainTextToHtml(about);
      if (aboutHtml.length > 500) {
        throw new Error("About section cannot exceed 500 characters");
      }

      const userdata = await updateUserProfile(InstitutionData.InstitutionId, {
        emailId: currentEmail,
        userName: name,
        phoneNumber: fullPhoneNumber,
        country: country,
        stateProvince: stateProvince,
        postalCode: postalCode,
        joiningDate: joiningDate,
        dob: formattedDob,
        address: address,
        about: aboutHtml,
        password: confirmationPassword,
      });

      const showBirthdayModal = await getBirthdayMessage(
        InstitutionData.InstitutionId,
      );
      const data = { ...userdata.Attributes, showBirthdayModal };
      Ctx.setUserData(data);
      setDob(formattedDob);

      toast.info(
        "Email updated successfully. Please login with your new email address.",
      );
      setShowEmailChangeModal(false);
      setConfirmationPassword("");

      // Logout and redirect to login
      setTimeout(async () => {
        try {
          await signOut();
          navigate("/login");
        } catch (error) {
          console.error("Error during logout:", error);
          navigate("/login");
        }
      }, 2000);
    } catch (e) {
      console.log(e);
      if (e.name === "NotAuthorizedException") {
        toast.error("Incorrect password. Please try again.");
      } else {
        toast.error(e.message || "Failed to update email");
      }
    } finally {
      UtilCtx.setLoader(false);
    }
  };
  const [loading, setLoading] = useState(false);
  const onProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (ifDataChanged()) {
      try {
        // Check if email is being changed
        const emailChanged = currentEmail.trim() !== UserCtx.emailId.trim();

        // If email changed, show confirmation modal
        if (emailChanged) {
          setShowEmailChangeModal(true);
          setLoading(false);
          return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(currentEmail)) {
          throw new Error("Invalid email format");
        }

        if (!phoneNumberValidator(countryCode, phoneNumber)) {
          throw new Error("Invalid phone number format");
        }

        const fullPhoneNumber = `+${countryCode}${phoneNumber.trim()}`;
        const formattedDob = tempDob ? String(new Date(tempDob).getTime()) : "";
        const aboutHtml = plainTextToHtml(about);
        if (aboutHtml.length > 500) {
          throw new Error("About section cannot exceed 500 characters");
        }
        const userdata = await updateUserProfile(
          InstitutionData.InstitutionId,
          {
            emailId: currentEmail,
            userName: name,
            phoneNumber: fullPhoneNumber,
            country: country,
            stateProvince: stateProvince,
            postalCode: postalCode,
            joiningDate: joiningDate,
            dob: formattedDob,
            address: address,
            about: aboutHtml,
          },
        );
        const showBirthdayModal = await getBirthdayMessage(
          InstitutionData.InstitutionId,
        );
        const data = { ...userdata.Attributes, showBirthdayModal };
        Ctx.setUserData(data);
        setDob(formattedDob);

        // If email was changed, logout and redirect to login
        if (emailChanged) {
          toast.info(
            "Email updated successfully. Please login with your new email address.",
          );
          setTimeout(async () => {
            try {
              await signOut();
              navigate("/login");
            } catch (error) {
              console.error("Error during logout:", error);
              navigate("/login");
            }
          }, 2000);
        } else {
          toast.info("Updated");
        }
      } catch (e) {
        console.log(e);
        toast.warn(e.message);
      } finally {
        setLoading(false);
      }
    } else {
      toast.warn("Nothing is to be changed");
      UtilCtx.setLoader(false);
    }
  };

  const passwordValidator = () => {
    if (password.length < 8) {
      setErr("Password is too Short");
      return false;
    } else if (password !== confirmPassword) {
      setErr("Password Doesn't Match");
      return false;
    } else {
      setErr("");
      return true;
    }
  };

  const passwordVisibilityChange = () => {
    setPasswordVisible((prevState) => !prevState);
  };

  const onPasswordChange = async (e) => {
    e.preventDefault();
    UtilCtx.setLoader(true);
    if (passwordValidator()) {
      try {
        const currentUser = await getCurrentUser();
        // Auth.changePassword signature changed. It now takes only old and new password basically if user is signed in?
        // Actually v6 uses updatePassword({ oldPassword, newPassword })
        await updatePassword({ oldPassword, newPassword: password });
        toast.info("Password Changed");
        setIsChangePassword(false);
      } catch (e) {
        setErr(e.message);
      } finally {
        UtilCtx.setLoader(false);
      }
    } else {
      UtilCtx.setLoader(false);
    }
  };

  const onPhoneChange = async (e) => {
    e.preventDefault();
    if (err) {
      toast.warn(err);
      return;
    }
    UtilCtx.setLoader(true);
    try {
      const fullPhoneNumber = `+${countryCode}${phoneNumber.trim()}`;
      // Auth.updateUserAttributes signature changed.
      await updateUserAttributes({
        userAttributes: {
          phone_number: fullPhoneNumber,
        },
      });
      setIsPhoneCode(true);
    } catch (e) {
      console.error(e);
      setErr(e.message);
    } finally {
      UtilCtx.setLoader(false);
    }
  };

  const onPhoneCodeConfirm = async (e) => {
    e.preventDefault();
    UtilCtx.setLoader(true);
    if (phoneCode.length !== 0) {
      try {
        const fullPhoneNumber = `+${countryCode}${phoneNumber.trim()}`;
        await confirmUserAttribute({
          userAttributeKey: "phone_number",
          confirmationCode: phoneCode,
        });
        await updateUserProfile(InstitutionData.InstitutionId, {
          emailId: UserCtx.emailId,
          userName: UserCtx.userName,
          phoneNumber: fullPhoneNumber,
          country: UserCtx.country,
          joiningDate: UserCtx.joiningDate,
        });
        setUserData({
          ...userData,
          phoneNumber: fullPhoneNumber,
        });
        toast.info("Phone Number Updated");
        setIsPhoneChange(false);
        setIsPhoneCode(false);
      } catch (e) {
        console.error(e);
        setErr(e.message);
      } finally {
        setPhoneCode("");
        UtilCtx.setLoader(false);
      }
    } else {
      setErr("Please enter the code");
      UtilCtx.setLoader(false);
    }
  };

  const navigate = useNavigate();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  // FIXED: Updated password change handler with proper error handling
  const handlePasswordChange = async () => {
    if (
      !passwordData.oldPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("Please fill all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      UtilCtx.setLoader(true);

      // SOLUTION 1: Bypass cache to get fresh credentials - NOT suppported directly in v6 like this?
      // const user = await Auth.currentAuthenticatedUser({ bypassCache: true });
      await updatePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswords({
        old: false,
        new: false,
        confirm: false,
      });
    } catch (error) {
      console.error("Error changing password:", error);

      if (error.code === "NotAuthorizedException") {
        if (error.message && error.message.includes("User is disabled")) {
          toast.error("Account doesn't exist. Please create a new account.");
          setTimeout(async () => {
            try {
              await signOut();
              navigate("/signup");
            } catch (err) {
              console.error("Error during logout:", err);
              navigate("/signup");
            }
          }, 2000);
        } else {
          toast.error("Current password is incorrect");
        }
      } else if (error.code === "LimitExceededException") {
        toast.error("Too many attempts. Please try again later");
      } else if (error.message && error.message.includes("required scopes")) {
        // Handle the specific scope error
        toast.error(
          "Session expired. Please log out and log back in to change your password",
        );
      } else {
        toast.error(error.message || "Failed to change password");
      }
    } finally {
      UtilCtx.setLoader(false);
    }
  };

  return (
    <div className="no-scrollbar relative max-h-[calc(100vh-100px)]  max1050:w-screen p-8">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        style={{ display: "none" }}
      />
      {image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleCancel}>
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="text-lg font-semibold">Edit Profile Picture</h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <div className="p-5">
              <div className="flex flex-col items-center">
                <AvatarEditor
                  ref={(editor) => setEditor(editor)}
                  image={image}
                  width={250}
                  height={250}
                  border={50}
                  borderRadius={125}
                  color={[255, 255, 255, 0.6]}
                  scale={scale}
                  rotate={0}
                />
                <div className="mt-4 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zoom
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.01"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3">
              <button
                className="p-1 px-4 rounded-md text-black"
                onClick={handleCancel}
                style={{ border: `2px solid ${InstitutionData.PrimaryColor}` }}>
                Cancel
              </button>
              <button
                className="p-1 px-4 rounded-md text-white"
                onClick={handleSave}
                style={{
                  backgroundColor: InstitutionData.PrimaryColor,
                  border: `2px solid ${InstitutionData.PrimaryColor}`,
                }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-[1400px] mx-auto">
        <div className="relative rounded-xl p-6">
          <h1
            className="text-3xl font-bold"
            style={{ color: InstitutionData.PrimaryColor }}>
            Profile Settings
          </h1>
          <p
            className="text-white/80"
            style={{ color: InstitutionData.PrimaryColor }}>
            Manage your account information and settings
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-2 ">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="text-center p-6">
                <div className="relative inline-block">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto">
                    {UserCtx.imgUrl ? (
                      <img
                        src={UserCtx.imgUrl}
                        alt="profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: getColor(UserCtx.userName) }}>
                        <span className="text-3xl font-bold text-white">
                          {getInitials(UserCtx.userName)}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleEditClick}
                    className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform"
                    style={{ color: InstitutionData.PrimaryColor }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
                <h2 className="text-xl font-bold mt-4">{name}</h2>
                <p className="text-gray-500 capitalize">{UserCtx.userType}</p>
              </div>
              <div className="border-t border-gray-100 px-6 py-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium">
                    {formatDate(UserCtx?.joiningDate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      biggestColor: `${InstitutionData.PrimaryColor}20`,
                      color: InstitutionData.PrimaryColor,
                    }}>
                    {UserCtx.status}
                  </span>
                </div>
              </div>
              {(showPasswordAction || UserCtx.userType === "instructor") && (
                <div className="border-t border-gray-100 p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">
                    QUICK ACTIONS
                  </h3>
                  <div className="space-y-2">
                    {showPasswordAction && (
                      <button
                        onClick={handleChangePassword}
                        className="w-full p-3 text-left rounded-lg hover:bg-gray-50 transition-all flex items-center gap-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-500"
                          viewBox="0 0 20 20"
                          fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Change Password
                      </button>
                    )}
                  </div>
                  {UserCtx.userType === "instructor" && (
                    <div className="space-y-2">
                      <button
                        onClick={handleHybridPageClick}
                        className="w-full p-3 text-left rounded-lg hover:bg-gray-50 transition-all flex items-center gap-3 relative">
                        <RiPagesFill />
                        Hybrid Page
                        {/* Red dot notification when no hybrid products */}
                        {noHybridProducts && (
                          <span className="absolute right-3 top-3 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Personal Information</h3>
                <button
                  onClick={onProfileUpdate}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all ${
                    ifDataChanged()
                      ? "hover:opacity-90"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  style={{ backgroundColor: InstitutionData.PrimaryColor }}
                  disabled={!ifDataChanged() || loading}>
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primaryColor focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={currentEmail}
                    onChange={(e) => setCurrentEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primaryColor focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative w-32">
                      <button
                        type="button"
                        onClick={() =>
                          setShowCountryDropdown(!showCountryDropdown)
                        }
                        className="w-full px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primaryColor focus:border-transparent flex items-center justify-between bg-white hover:bg-gray-50">
                        <span>
                          +
                          {countriesData.find((c) => c.value === countryCode)
                            ?.value || "91"}
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            showCountryDropdown ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
                      </button>

                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 w-56 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          <input
                            type="text"
                            placeholder="Search country..."
                            value={countryCodeSearch}
                            onChange={(e) =>
                              setCountryCodeSearch(e.target.value)
                            }
                            className="w-full px-3 py-2 border-b border-gray-200 rounded-t-lg focus:outline-none text-sm"
                            autoFocus
                          />
                          <div className="max-h-48 overflow-y-auto">
                            {filteredCountries.length > 0 ? (
                              filteredCountries.map((country) => (
                                <button
                                  key={country.value}
                                  type="button"
                                  onClick={() => {
                                    setCountryCode(country.value);
                                    setShowCountryDropdown(false);
                                    setCountryCodeSearch("");
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex justify-between items-center">
                                  <span>{country.name}</span>
                                  <span className="text-gray-500 text-xs">
                                    +{country.value}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No countries found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      maxLength={15}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        setPhoneNumber(value);
                        // Live validation as user types
                        if (
                          value &&
                          !phoneNumberValidator(countryCode, value)
                        ) {
                          setErr(
                            countryCode === "91"
                              ? "Enter a valid 10-digit phone number starting with 6-9"
                              : "Enter a valid phone number (7-15 digits)",
                          );
                        } else {
                          setErr("");
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (
                          value &&
                          !phoneNumberValidator(countryCode, value)
                        ) {
                          setErr(
                            countryCode === "91"
                              ? "Enter a valid 10-digit phone number starting with 6-9"
                              : "Enter a valid phone number (7-15 digits)",
                          );
                        } else {
                          setErr("");
                        }
                      }}
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primaryColor focus:border-transparent"
                      placeholder={
                        countryCode === "91"
                          ? "9876543210"
                          : "Enter phone number"
                      }
                    />
                  </div>
                  {err && <p className="text-red-500 text-sm mt-1">{err}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={tempDob}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const currentYear = new Date().getFullYear();
                      if (selectedDate.getFullYear() > currentYear) {
                        setDobError("Year of birth cannot be in the future.");
                      } else {
                        setDobError("");
                        setTempDob(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primaryColor focus:border-transparent"
                    disabled={isDobSet}
                  />
                  {dobError && (
                    <p className="text-red-500 text-sm mt-1">{dobError}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h3 className="text-lg font-bold mb-4">Address Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Street Address
                  </label>
                  <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primaryColor focus:border-transparent"
                      placeholder="Enter your street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 relative">
                    <label className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowCountrySelectDropdown(!showCountrySelectDropdown)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primaryColor focus:border-transparent flex items-center justify-between bg-white hover:bg-gray-50 text-left">
          <span className={country ? "" : "text-gray-400"}>
            {country || "Select country"}
          </span>
                      <svg
                          className={`w-4 h-4 transition-transform ${showCountrySelectDropdown ? "rotate-180" : ""}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showCountrySelectDropdown && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          <input
                              type="text"
                              placeholder="Search country..."
                              value={countrySelectSearch}
                              onChange={(e) => setCountrySelectSearch(e.target.value)}
                              className="w-full px-3 py-2 border-b border-gray-200 rounded-t-lg focus:outline-none text-sm"
                              autoFocus
                          />
                          <div className="max-h-48 overflow-y-auto">
                            {countriesData
                                .filter((c) =>
                                    c.name.toLowerCase().includes(countrySelectSearch.toLowerCase()),
                                )
                                .map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => {
                                          setCountry(c.name);
                                          setShowCountrySelectDropdown(false);
                                          setCountrySelectSearch("");
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100">
                                      {c.name}
                                    </button>
                                ))}
                          </div>
                        </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      State / Province
                    </label>
                    <input
                        type="text"
                        value={stateProvince}
                        onChange={(e) => setStateProvince(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primaryColor focus:border-transparent"
                        placeholder="Enter state or province"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {country === "India" ? "PIN Code" : "Postal Code"}
                    </label>
                    <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.replace(/[^A-Za-z0-9\s-]/g, ""))}
                        maxLength={10}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primaryColor focus:border-transparent"
                        placeholder={country === "India" ? "560001" : "Enter postal code"}
                    />
                  </div>
                </div>
              </div>
            </div>
            {UserCtx.userType === "instructor" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">About Me</h3>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primaryColor focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              </div>
            )}
            {(userData.userType === "instructor" ||
              userData.userType === "admin") && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <ReferralCode />
              </div>
            )}
          </div>
        </div>
      </div>
      {isPhoneChange && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsPhoneChange(false)}>
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}>Ś
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="text-lg font-semibold">Change Phone Number</h3>
              <button
                onClick={() => setIsPhoneChange(false)}
                className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <div className="p-5">
              {!isPhoneCode ? (
                <form onSubmit={onPhoneChange}>
                  <div className="mb-4">
                    <Label htmlFor="phoneNumber" value="New Phone Number" />
                    <TextInput
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                  {err && <p className="text-red-500 text-sm mb-4">{err}</p>}
                  <div className="flex justify-end">
                    <Button2 type="submit">Send Verification Code</Button2>
                  </div>
                </form>
              ) : (
                <form onSubmit={onPhoneCodeConfirm}>
                  <div className="mb-4">
                    <Label htmlFor="phoneCode" value="Verification Code" />
                    <TextInput
                      id="phoneCode"
                      type="text"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      required
                    />
                  </div>
                  {err && <p className="text-red-500 text-sm mb-4">{err}</p>}
                  <div className="flex justify-end">
                    <Button2 type="submit">Verify Code</Button2>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal - FIXED */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            setShowPasswordModal(false);
            setPasswordData({
              oldPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
            setShowPasswords({ old: false, new: false, confirm: false });
          }}>
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="text-lg font-semibold">Change Password</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setShowPasswords({ old: false, new: false, confirm: false });
                }}
                className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="oldPassword" value="Current Password" />
                  <div className="relative">
                    <TextInput
                      id="oldPassword"
                      type={showPasswords.old ? "text" : "password"}
                      value={passwordData.oldPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          oldPassword: e.target.value,
                        })
                      }
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({
                          ...showPasswords,
                          old: !showPasswords.old,
                        })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {showPasswords.old ? (
                        <AiFillEyeInvisible size={20} />
                      ) : (
                        <AiFillEye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword" value="New Password" />
                  <div className="relative">
                    <TextInput
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="Enter new password (min 8 characters)"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({
                          ...showPasswords,
                          new: !showPasswords.new,
                        })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {showPasswords.new ? (
                        <AiFillEyeInvisible size={20} />
                      ) : (
                        <AiFillEye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="confirmPassword"
                    value="Confirm New Password"
                  />
                  <div className="relative">
                    <TextInput
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({
                          ...showPasswords,
                          confirm: !showPasswords.confirm,
                        })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {showPasswords.confirm ? (
                        <AiFillEyeInvisible size={20} />
                      ) : (
                        <AiFillEye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({
                        oldPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setShowPasswords({
                        old: false,
                        new: false,
                        confirm: false,
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    style={{ backgroundColor: InstitutionData.PrimaryColor }}
                    className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90">
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Change Confirmation Modal */}
      {showEmailChangeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            setShowEmailChangeModal(false);
            setConfirmationPassword("");
            setShowConfirmationPassword(false);
          }}>
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="text-lg font-semibold">Confirm Email Change</h3>
              <button
                onClick={() => {
                  setShowEmailChangeModal(false);
                  setConfirmationPassword("");
                  setShowConfirmationPassword(false);
                }}
                className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-yellow-600 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-1">
                        Important: Email Change
                      </h4>
                      <p className="text-sm text-yellow-700">
                        You are changing your email from{" "}
                        <strong>{UserCtx.emailId}</strong> to{" "}
                        <strong>{currentEmail}</strong>. You will be logged out
                        and need to sign in with your new email address.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="confirmPassword"
                    value="Enter Your Password to Confirm"
                  />
                  <div className="relative">
                    <TextInput
                      id="confirmPassword"
                      type={showConfirmationPassword ? "text" : "password"}
                      value={confirmationPassword}
                      onChange={(e) => setConfirmationPassword(e.target.value)}
                      placeholder="Enter your current password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmationPassword(!showConfirmationPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {showConfirmationPassword ? (
                        <AiFillEyeInvisible size={20} />
                      ) : (
                        <AiFillEye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      setShowEmailChangeModal(false);
                      setConfirmationPassword("");
                      setShowConfirmationPassword(false);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button
                    onClick={handleEmailChangeConfirmation}
                    style={{ backgroundColor: InstitutionData.PrimaryColor }}
                    className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90">
                    Confirm & Update Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileUpdate;
