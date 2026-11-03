import React, { useContext, useEffect, useState, useRef } from "react";
import Select from "react-select";
import { MdClose } from "react-icons/md";

import {
  X,
  Upload,
  User,
  Mail,
  Phone,
  Check,
  CreditCard,
  Calendar,
  Loader,
} from "lucide-react";
import Country from "../../../../../components_old/Country";
import InstitutionContext from "../../../../../Context/InstitutionContext";
import Context from "../../../../../Context/Context";
import { toast } from "react-toastify";
import {
  getCountryNameFromCode,
  getCountryNameFromValue,
  getCountryCodeFromValue,
} from "../../../../../utils/country-mapping.js";
import PhoneRules from "../../../../../utils/phoneRules.json";
import fileUpload from "../../../../../common/utils/upload-file.js";
import { productCurrencySymbol } from "../../../../../utils/helpers.js";

function CreateUser({
  phoneNumber,
  amount,
  name,
  imageUrl,
  email,
  status,
  cognitoId,
  setStatus,
  lastLogin,
  balance,
  setImageUrl,
  setShowUserAdd,
  setPhoneNumber,
  createButton,
  setCreateButton,
  setIsModalOpen,
  userType,
  setUserType,
  setEmail,
  countryCode,
  setCountryCode,
  setName,
  setBalance,
  productType,
  setProductType,
  selectedProductAmount,
  paymentDate,
  setLastLogin,
  setPaymentDate,
  setSelectedProductAmount,
  initialPaymentStatus = "paid",
  initialProductId = "",
  team = "",
}) {
  // console.log(paymentDate);

  const [instructorPaymentType, setInstructorPaymentType] = useState("");
  const [instructorPaymentAmount, setInstructorPaymentAmount] = useState("");
  const [perClassAmount, setPerClassAmount] = useState("");
  const [perClassCurrency, setPerClassCurrency] = useState("INR");
  const [trialPeriod, setTrialPeriod] = useState("");
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const {
    getUserList,
    getProductsAdmin,
    createUser,
    updateUser,
    updateAdminUserAttribute,
    changeUserPassword,
    createPresetSubscriptions,
    assignPaypalPlans,
    updateUserPayment,
  } = useContext(Context);
  const UtilCtx = useContext(Context).util;
  const [selectedClassTypes, setSelectedClassTypes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState({});
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [phoneChange, setPhoneChange] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(team || "");
  const didPrefillProduct = useRef(false);

  const TEAM_OPTIONS = [
    "HappyPrancer",
    "Rhythm Rockets",
    "Pulse Panthers",
    "Nova Groovers",
  ];
  // Fallback userType handling if parent does not pass a setter
  const [localUserType, setLocalUserType] = useState(userType || "member");
  useEffect(() => {
    if (userType) setLocalUserType(userType);
  }, [userType]);

  useEffect(() => {
    setSelectedTeam(team || "");
  }, [team]);
  const effectiveUserType =
    typeof setUserType === "function" ? userType : localUserType;
  // Normalize to ensure consistent behavior across views (e.g., "Instructor" vs "instructor")
  const normalizedUserType = (effectiveUserType || "member").toLowerCase();

  const handleChangeClick = () => {
    setShowInput(true);
  };

  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Ref for file input
  const fileInputRef = useRef(null);

  const classTypeOptions = InstitutionData.ClassTypes.map((classType) => ({
    value: classType,
    label: classType,
  }));
  const handleClassTypeChange = (selectedOptions) => {
    setSelectedClassTypes(selectedOptions || []);
    setTouched({ ...touched, classTypes: true });
  };

  const [productDetails, setProductDetails] = useState([]);

  const normalizePaymentStatus = (value) => {
    const normalized = (value || "").toString().toLowerCase();
    return normalized === "unpaid" ? "unPaid" : "paid";
  };

  const conversion = (localTime) => {
    return new Date(localTime).getTime();
  };

  // No changes to imports here, will handle import removal separately or let it be if harmless (better to remove).
  // I will use replace_file_content for imports separately if needed, but here I can do logic replacement.

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productList = await getProductsAdmin(
          InstitutionData.InstitutionId,
        );
        console.log("Fetched products:", productList);
        setProductDetails(productList || []);
      } catch (error) {
        console.error("Error fetching product details:", error);
        setProductDetails([]);
      }
    };

    if (getProductsAdmin && InstitutionData.InstitutionId) {
      fetchProducts();
    }
  }, [InstitutionData.InstitutionId, getProductsAdmin]);

  useEffect(() => {
    setPaymentStatus(normalizePaymentStatus(initialPaymentStatus));
  }, [initialPaymentStatus]);


  useEffect(() => {
    if (didPrefillProduct.current) return; // only prefill once
    if (!Array.isArray(productDetails) || !productDetails.length) return;

    const normalizedProductType = (productType || "")
      .toString()
      .trim()
      .toLowerCase();
    const normalizedProductId = (initialProductId || "").toString().trim();

    const matchedProduct = productDetails.find((product) => {
      const heading = (product?.heading || "").toString().trim().toLowerCase();
      const productTypeName = (product?.productType || "")
        .toString()
        .trim()
        .toLowerCase();
      const productId = (product?.productId || "").toString().trim();

      if (normalizedProductId && productId === normalizedProductId) {
        return true;
      }
      return (
        !!normalizedProductType &&
        (heading === normalizedProductType ||
          productTypeName === normalizedProductType)
      );
    });

    if (!matchedProduct) return;

    didPrefillProduct.current = true; // mark done so user selections aren't overridden later

    setSelectedProduct(matchedProduct);
    if (matchedProduct?.heading && productType !== matchedProduct.heading) {
      setProductType(matchedProduct.heading);
    }
    if (!selectedProductAmount) {
      setSelectedProductAmount(matchedProduct.amount || "");
    }
  }, [initialProductId, productDetails]); 

  // ... (lines 135-300 skipped in replace logic if not contiguous, but here I'm targeting blocks)

  // I'll use multi_replace for this file as edits are scattered.

  const handleProductTypeChange = (e) => {
    const selectedProduct = productDetails.find(
      (product) => product.heading === e.target.value,
    );
    setProductType(e.target.value);
    setSelectedProductAmount(selectedProduct ? selectedProduct.amount : "");
    setSelectedProduct(selectedProduct);
    setTouched({ ...touched, productType: true });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5 MB in bytes
      if (file.size > maxSize) {
        toast.error(
          "File size exceeds the 5 MB limit. Please upload a smaller file.",
        );
      } else {
        setImageUrl(file);
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImage(e.target.result);
        };
        reader.readAsDataURL(file);
        // Reset file input to allow re-uploading the same file
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } else {
      toast.warning("No file selected.");
    }
  };

  // Validation function

  function validatePhoneNumber(phoneNumber, countryCode, newErrors) {
    const rules = PhoneRules[countryCode];

    if (!phoneNumber || phoneNumber.trim() === "") {
      newErrors.phoneNumber = "Phone number is required";
      return newErrors;
    }

    // General digit-only check
    if (!/^\d+$/.test(phoneNumber)) {
      newErrors.phoneNumber = "Phone number should contain only digits";
      return newErrors;
    }

    // If country has rules
    if (rules) {
      const { min, max, pattern, message } = rules;

      if (phoneNumber.length < min || phoneNumber.length > max) {
        newErrors.phoneNumber = `Phone number must be between ${min}-${max} digits`;
        return newErrors;
      }

      if (!new RegExp(pattern).test(phoneNumber)) {
        newErrors.phoneNumber = message;
        return newErrors;
      }
    } else {
      // fallback for unknown countries
      if (phoneNumber.length < 6) {
        newErrors.phoneNumber = "Phone number is too short";
      }
    }

    return newErrors;
  }
  const validateForm = () => {
    let newErrors = {};
    const minLength = /.{8,}/;
    const upperCase = /[A-Z]/;
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/;

    if (showInput) {
      if (!minLength.test(newPassword)) {
        newErrors.newPassword = "Password must be at least 8 characters long.";
      } else if (!upperCase.test(newPassword)) {
        newErrors.newPassword =
          "Password must contain at least one uppercase letter.";
      } else if (!specialChar.test(newPassword)) {
        newErrors.newPassword =
          "Password must contain at least one special character.";
      }
    }

    // Basic field validations
    if (!name || name?.trim() === "") {
      newErrors.name = "Full name is required";
    } else if (name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!email || email?.trim() === "") {
      newErrors.email = "Email address is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    newErrors = validatePhoneNumber(
      phoneNumber,
      getCountryCodeFromValue(countryCode),
      newErrors,
    );

    // Status specific validations
    if (status === "Trial" && !trialPeriod) {
      newErrors.trialPeriod = "Trial period is required";
    }

    // User type specific validations
    if (normalizedUserType === "instructor") {
      if (instructorPaymentType && !instructorPaymentAmount) {
        newErrors.instructorPaymentAmount = "Payment amount is required";
      } else if (
        instructorPaymentType === "percent" &&
        (parseFloat(instructorPaymentAmount) <= 0 ||
          parseFloat(instructorPaymentAmount) > 100)
      ) {
        newErrors.instructorPaymentAmount =
          "Percentage must be between 0 and 100";
      } else if (
        instructorPaymentType === "flat" &&
        parseFloat(instructorPaymentAmount) < 0
      ) {
        newErrors.instructorPaymentAmount = "Amount cannot be negative";
      }

      // per-class amount (optional) - if provided must be a non-negative number
      if (perClassAmount !== "") {
        const parsed = parseFloat(perClassAmount);
        if (Number.isNaN(parsed) || parsed < 0) {
          newErrors.perClassAmount =
            "Per-class amount must be a non-negative number";
        }
      }

      if (selectedClassTypes.length === 0) {
        newErrors.classTypes = "At least one class type is required";
      }
    }

    // Product validations for active and grace members
    if (
      (status === "Active" || status === "GracePeriod") &&
      normalizedUserType === "member" &&
      !productType
    ) {
      newErrors.productType = "Product type is required";
    }

    if (
      (status === "Active" || status === "GracePeriod") &&
      normalizedUserType === "member" &&
      !paymentDate
    ) {
      newErrors.paymentDate = "Payment date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
  };

  const changePassword = async (username, newPassword) => {
    // console.log("emailandnewpassword", email, password);
    const institution = InstitutionData.InstitutionId;
    try {
      await changeUserPassword({
        institution,
        username,
        newPassword,
      });
    } catch (error) {
      console.error("Error changing password:", error);
    }
  };

  const formatDateToDisplayInInput = (epochTime) => {
    const date = new Date(epochTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Add 1 because months are 0-indexed
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  // Reset form function to clear all states
  const resetForm = () => {
    setName("");
    setCountryCode("+91");
    setEmail("");
    setStatus("Inactive");
    setPhoneNumber("");
    setBalance("");
    setImageUrl(null);
    setPreviewImage(null);
    setProductType("");
    setSelectedProductAmount("");
    setInstructorPaymentType("");
    setInstructorPaymentAmount("");
    setPerClassAmount("");
    setPerClassCurrency("INR");
    setTrialPeriod("");
    setSelectedClassTypes([]);
    setSelectedProduct({});
    setErrors({});
    setTouched({});
    setPaymentDate("");
    setPaymentStatus("paid");
    setPhoneChange(false);
    setShowUserAdd(false);
    setIsModalOpen(false);
    setLastLogin(null);
    if (typeof setUserType === "function") {
      setUserType("member");
    } else {
      setLocalUserType("member");
    }
    setCreateButton(false);
    setShowInput(false);
    setNewPassword("");
    setSelectedTeam("");
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onCreateUser = async (e) => {
    e.preventDefault();

    // Mark all fields as touched to show all validation errors
    const allFields = {
      name: true,
      email: true,
      phoneNumber: true,
      trialPeriod: true,
      instructorPaymentType: true,
      instructorPaymentAmount: true,
      perClassAmount: true,
      perClassCurrency: true,
      classTypes: true,
      productType: true,
      newPassword: true,
      paymentDate: true,
    };
    setTouched(allFields);

    // Validate form
    const isValid = validateForm();

    if (!isValid) {
      // Scroll to first error
      const firstError = document.querySelector(".error-message");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast.error("Please fix the errors before submitting");
      return;
    }

    // Set loading state to true
    setIsLoading(true);

    let apiResponse;
    let didPaymentUpdate = false; // track payment update to avoid double toasts
    let didPaymentPlanCreation = false; // track instructor payment plan creation
    let didMainOperationSucceed = false; // track if user create/update succeeded
    const formattedPhoneNumber = createButton
      ? `+${countryCode}${phoneNumber}`
      : phoneChange
        ? `+${countryCode}${phoneNumber}`
        : phoneNumber;
    console.log("formattednumber", formattedPhoneNumber);
    let countryName = getCountryNameFromValue(countryCode);
    console.log("county:", countryCode, countryName);

    let imgUrl = imageUrl
      ? await fileUpload({
          bucket: "institution-utils",
          region: "us-east-1",
          folder: `profile/${email}`,
          file: imageUrl,
        })
      : null;
    const data = {
      institution: InstitutionData.InstitutionId,
      cognitoId,
      emailId: email,
      userName: name,
      name: name,
      imgUrl: imgUrl,
      country: countryName,
      phoneNumber: formattedPhoneNumber,
      status,
      productType: normalizedUserType === "member" ? productType : "",
      productId:
        normalizedUserType === "member" && selectedProduct?.productId
          ? selectedProduct.productId
          : "",
      amount: selectedProductAmount,
      paymentDate: paymentDate ? conversion(paymentDate) : null,
      subscriptionType: selectedProduct.subscriptionType || "",
      userType: normalizedUserType,
      instructorPaymentType:
        normalizedUserType === "instructor" ? instructorPaymentType : "",
      instructorPaymentAmount:
        normalizedUserType === "instructor" ? instructorPaymentAmount : "",
      // Send per-class amount in paise (minor units). Multiply entered
      // major-unit value (e.g. 340.00) by 100 and round to integer.
      perClassAmount:
        normalizedUserType === "instructor" && perClassAmount !== ""
          ? Math.round(parseFloat(perClassAmount) * 100)
          : null,
      perClassCurrency:
        normalizedUserType === "instructor" ? perClassCurrency : "",
      trialPeriod: status === "Trial" ? trialPeriod : "",
      classType:
        normalizedUserType === "instructor"
          ? selectedClassTypes.map((type) => type.value)
          : [],
      product: selectedProduct.heading,
    };
    try {
      if (createButton) {
        apiResponse = await createUser(data);
      } else {
        apiResponse = await updateUser(InstitutionData.InstitutionId, data);
        if (newPassword) {
          changePassword(email, newPassword);
        }
      }

      data.userType === "instructor" &&
        window.localStorage.removeItem(
          `instructorList_${InstitutionData.InstitutionId}`,
        );

      // Team update is managed via dedicated admin update-attributes endpoint.
      // Trigger it when editing an existing user and a team is selected.
      if (!createButton && selectedTeam) {
        const cognitoIdForTeam = apiResponse?.user?.cognitoId || data.cognitoId;
        try {
          await updateAdminUserAttribute(
            InstitutionData.InstitutionId,
            "team",
            {
              cognitoId: cognitoIdForTeam,
              value: selectedTeam,
            },
          );
        } catch (teamUpdateError) {
          console.error("Error updating team attribute:", teamUpdateError);
          toast.warning("User updated, but team update failed");
        }
      }

      try {
        if (data.userType === "instructor" && apiResponse.cognitoId !== null) {
          const cognitoIdToUse = apiResponse?.user?.cognitoId || data.cognitoId;
          if (countryCode.includes("91")) {
            // Indian Instructor create razor pay products
            try {
              const subscriptionResponse = await createPresetSubscriptions(
                InstitutionData.InstitutionId,
                {
                  cognitoId: cognitoIdToUse, // This is the key part - explicitly providing the instructor's ID
                  country: getCountryNameFromCode(countryCode),
                },
              );

              console.log(
                "Preset subscription plans created:",
                subscriptionResponse,
              );
              didPaymentPlanCreation = true;
            } catch (subscriptionError) {
              console.error(
                "Failed to create preset subscription plans:",
                subscriptionError,
              );
            }
          } else {
            // Not Indian Instructor create paypal products
            try {
              const paypalResponse = await assignPaypalPlans(
                InstitutionData.InstitutionId,
                {
                  cognitoId: cognitoIdToUse, // This is the key part - explicitly providing the instructor's ID
                  country: getCountryNameFromCode(countryCode),
                },
              );
              console.log("PayPal products created:", paypalResponse);
              didPaymentPlanCreation = true;
            } catch (subscriptionError) {
              console.error(
                "Failed to create PayPal products:",
                subscriptionError,
              );
            }
          }
        }
      } catch {
        console.error("Failed to create instructor payment plans");
      }

      // Payment Update Logic - moved inside main try block
      if (
        (status === "Active" || status === "GracePeriod") &&
        normalizedUserType === "member" &&
        paymentDate &&
        selectedProduct?.productId
      ) {
        let cognitoIdForPayment = cognitoId;
        if (
          createButton &&
          apiResponse &&
          apiResponse.user &&
          apiResponse.user.cognitoId
        ) {
          cognitoIdForPayment = apiResponse.user.cognitoId;
        }
        const paymentData = {
          cognitoId: cognitoIdForPayment,
          institution: InstitutionData.InstitutionId,
          productType: productType,
          productId: selectedProduct.productId,
          planId: selectedProduct.planId,
          amount: selectedProduct.amount / 100,
          paymentDate: conversion(paymentDate),
          status: status,
          paymentStatus: paymentStatus,
          currency: "INR",
          subscriptionType: selectedProduct.subscriptionType,
        };

        console.log("Payment Data being sent:", paymentData);
        console.log("Payment Data being sent:", paymentData);
        try {
          await updateUserPayment(InstitutionData.InstitutionId, paymentData);
          didPaymentUpdate = true;
        } catch (paymentError) {
          console.error("Error updating payment:", paymentError);
          // Don't show error toast - payment might have succeeded on backend
          // Just log the error and let the main success message show
        }
      }

      // Mark operation as successful before any cleanup that might fail
      didMainOperationSucceed = true;

      // Show success toast immediately to avoid being suppressed by cleanup errors
      {
        let message = "";
        if (createButton) {
          message = "User created successfully";
          if (didPaymentPlanCreation) {
            message += " with payment plans";
          }
          if (didPaymentUpdate) {
            message = didPaymentPlanCreation
              ? "User created with payment plans and payment updated successfully"
              : "User created and payment updated successfully";
          }
        } else {
          message = "User updated successfully";
          if (didPaymentUpdate) {
            message = "User updated and payment updated successfully";
          }
        }
        toast.success(message);
      }

      // Cleanup operations - do not block success toast if these fail
      try {
        resetForm(); // Reset all states after successful submission
        getUserList();
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }
    } catch (error) {
      console.error("Error creating/updating user:", error);
      const errorMessage = error.response?.data?.message;

      if (
        error.response?.data?.message ===
        "Email already exists in the database."
      ) {
        toast.error("This email is already registered in the system");
      } else if (error.response?.data?.message?.includes("phone number")) {
        toast.error("This phone number is already registered");
      } else if (error.response?.status === 400) {
        toast.error(errorMessage || "Invalid input. Please check all fields");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later");
      }
    } finally {
      setIsLoading(false);
    }

    // Success toast already shown above; no-op here to avoid duplicates
  };

  // Input field styles
  const inputStyle =
    "border-[1px] border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm";
  const inputLabelStyle = "font-medium mb-1 text-gray-700 text-xs sm:text-sm";
  const errorStyle = "text-red-500 text-xs mt-1";
  const sectionStyle =
    "border border-gray-100 rounded-lg p-3 sm:p-4 bg-gray-50";

    const currencySymbol = selectedProduct?.currency
      ? productCurrencySymbol(selectedProduct.currency)
      : getCountryCodeFromValue(countryCode) === "IN"
        ? "₹"
        : "$";

  const productOptions = React.useMemo(() => {
    if (!Array.isArray(productDetails)) return [];

    const currencyGroups = {};

    productDetails
      .filter((p) => p?.heading)
      .forEach((p, index) => {
        const currency = p.currency || "INR";
        const symbol =
          currency === "USD" ? "$" : currency === "CAD" ? "CA$" : "₹";
        const amount = p.amount != null ? (p.amount / 100).toFixed(2) : "0.00";
        const duration =
          p.durationText || p.subscriptionType || p.interval
            ? `${p.durationText || p.subscriptionType || ""}`
            : "";

        const option = {
          // key by productId/planId so duplicates stay distinct in the list
          value: p.productId || p.planId || `idx-${index}`,
          label: p.heading,
          priceLabel: `${symbol}${amount}`,
          durationLabel: duration,
          product: p,
        };

        if (!currencyGroups[currency]) currencyGroups[currency] = [];
        currencyGroups[currency].push(option);
      });

    return Object.entries(currencyGroups).map(([currency, options]) => ({
      label: `${currency} plans`,
      options,
    }));
  }, [productDetails]);

  const selectedProductOption = React.useMemo(() => {
    if (!selectedProduct?.productId && !selectedProduct?.planId) return null;
    for (const group of productOptions) {
      const found = group.options.find(
        (o) =>
          o.value === (selectedProduct.productId || selectedProduct.planId),
      );
      if (found) return found;
    }
    return null;
  }, [productOptions, selectedProduct]);

  const handleProductSelectChange = (selected) => {
    const product = selected?.product || null;
    setProductType(product?.heading || "");
    setSelectedProductAmount(product?.amount || "");
    setSelectedProduct(product || {});
    setTouched({ ...touched, productType: true });
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className="bg-white px-6 py-8 rounded-xl flex flex-col justify-start items-center gap-6 w-full max-w-[800px] mx-auto relative overflow-y-auto max-h-[85vh] shadow-lg"
        style={{ marginTop: "20px", marginBottom: "20px" }}>
        <div
          className="absolute top-5 right-5 cursor-pointer bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
          onClick={() => {
            setShowUserAdd(false);
            setIsModalOpen(false);
            setCreateButton(false);
            setNewPassword("");
            setShowInput(false);
            setErrors({});
            setTouched({});
          }}>
          <X size={20} />
        </div>

        <div className="w-full flex flex-col items-center">
          <h2
            className="text-lg sm:text-2xl font-bold mb-2"
            style={{ color: InstitutionData.PrimaryColor }}>
            {createButton ? "Create New User" : "Update User"}
          </h2>
          <div
            className="h-1 w-20 rounded-full"
            style={{ backgroundColor: InstitutionData.PrimaryColor }}></div>
        </div>

        <div className="w-full p-0 flex flex-col gap-4 sm:gap-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center justify-center mb-2">
            <div
              className="w-20 sm:w-24 h-20 sm:h-24 rounded-full border-2 border-dashed flex items-center justify-center mb-2 overflow-hidden"
              style={{ borderColor: InstitutionData.PrimaryColor }}>
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={30} color={InstitutionData.PrimaryColor} />
              )}
            </div>
            <label
              className="cursor-pointer flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm"
              style={{
                backgroundColor: `${InstitutionData.PrimaryColor}15`,
                color: InstitutionData.PrimaryColor,
              }}>
              <Upload size={12} />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                ref={fileInputRef}
              />
            </label>
            <span className="text-xs text-gray-500 mt-1">
              Maximum size: 5MB
            </span>
          </div>

          {/* Basic Info Section */}
          <div className={sectionStyle}>
            <h3 className="text-xs sm:text-sm uppercase tracking-wider text-gray-500 mb-3 font-medium">
              Basic Information
            </h3>

            <div className="flex gap-3 sm:gap-4 mb-3 sm:mb-4 max850:flex-col">
              <div className="flex-1">
                <label className={inputLabelStyle}>
                  <User size={12} className="inline mr-1" />
                  Full Name*
                </label>
                <input
                  className={`${inputStyle} ${
                    touched.name && errors.name ? "border-red-500" : ""
                  }`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleBlur("name")}
                  placeholder="Enter full name"
                  required
                />
                {touched.name && errors.name && (
                  <p className={`${errorStyle} error-message`}>{errors.name}</p>
                )}
              </div>
              <div className="flex-1">
                <label className={inputLabelStyle}>
                  <Mail size={12} className="inline mr-1" />
                  Email Address*
                </label>
                <input
                    className={`${inputStyle} ${
                        touched.email && errors.email ? "border-red-500" : ""
                    } ${!createButton ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""}`}
                    value={email}
                    onChange={(e) => createButton && setEmail(e.target.value)}
                    onBlur={() => handleBlur("email")}
                    placeholder="Enter email address"
                    type="email"
                    required
                    disabled={!createButton}
                    title={!createButton ? "Email cannot be changed after account creation" : undefined}
                />
                {!createButton && (
                    <p className="text-xs text-gray-400 mt-1">
                      Email cannot be changed here — this changes the account owner's identity.
                    </p>
                )}
                {touched.email && errors.email && (
                    <p className={`${errorStyle} error-message`}>
                      {errors.email}
                    </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 mb-2">
              <div className="w-1/3">
                <label className={inputLabelStyle}>Country Code*</label>
                <select
                  value={countryCode}
                  name="countryCode"
                  className={inputStyle}
                  onChange={(e) => setCountryCode(e.target.value.toString())}>
                  {<Country />}
                </select>
              </div>
              <div className="w-2/3">
                <label className={inputLabelStyle}>
                  <Phone size={12} className="inline mr-1" />
                  Phone Number*
                </label>
                <input
                  className={`${inputStyle} ${
                    touched.phoneNumber && errors.phoneNumber
                      ? "border-red-500"
                      : ""
                  }`}
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneChange(true);
                    setPhoneNumber(e.target.value);
                  }}
                  onBlur={() => handleBlur("phoneNumber")}
                  placeholder="Enter phone number"
                  required
                />
                {touched.phoneNumber && errors.phoneNumber && (
                  <p className={`${errorStyle} error-message`}>
                    {errors.phoneNumber}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* User Type Section */}
          <div className={sectionStyle}>
            <h3 className="text-xs sm:text-sm uppercase tracking-wider text-gray-500 mb-3 font-medium">
              User Config
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div>
                <label className={inputLabelStyle}>User Type*</label>
                <select
                  className={inputStyle}
                  value={normalizedUserType}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (typeof setUserType === "function") {
                      setUserType(v);
                    } else {
                      setLocalUserType(v);
                    }
                    if (v !== "instructor") {
                      setInstructorPaymentType("");
                      setInstructorPaymentAmount("");
                      setSelectedClassTypes([]);
                    }
                    // Clear member product-related state when not a member
                    if (v !== "member") {
                      setProductType("");
                      setSelectedProductAmount("");
                      setSelectedProduct({});
                    }
                  }}>
                  <option value="member">Member</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className={inputLabelStyle}>Team</label>
                <select
                  className={inputStyle}
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}>
                  <option value="">Select Team</option>
                  {TEAM_OPTIONS.map((teamOption) => (
                    <option key={teamOption} value={teamOption}>
                      {teamOption}
                    </option>
                  ))}
                </select>
              </div>

              {normalizedUserType === "member" && (
                <div>
                  <label className={inputLabelStyle}>User Status*</label>
                  <select
                    required
                    className={inputStyle}
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      if (e.target.value !== "Trial") {
                        setTrialPeriod("");
                      }
                    }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Trial">Trial</option>
                    {status === "GracePeriod" && (
                      <option value="GracePeriod">Grace Period</option>
                    )}
                  </select>
                </div>
              )}
            </div>

            {status === "Trial" && (
              <div className="mb-3 sm:mb-4">
                <label className={inputLabelStyle}>Trial Period*</label>
                <select
                  required
                  className={`${inputStyle} ${
                    touched.trialPeriod && errors.trialPeriod
                      ? "border-red-500"
                      : ""
                  }`}
                  value={trialPeriod}
                  onChange={(e) => setTrialPeriod(e.target.value)}
                  onBlur={() => handleBlur("trialPeriod")}>
                  <option value="">Select Trial Period</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-yearly">Half-yearly</option>
                  <option value="Yearly">Yearly</option>
                </select>
                {touched.trialPeriod && errors.trialPeriod && (
                  <p className={`${errorStyle} error-message`}>
                    {errors.trialPeriod}
                  </p>
                )}
              </div>
            )}

            {/* Instructor Specific Fields */}
            {normalizedUserType === "instructor" && (
              <div className="mt-3 sm:mt-4 border-t border-gray-100 pt-3 sm:pt-4">
                <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-3">
                  Instructor Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <label className={inputLabelStyle}>Payment Type</label>
                    <select
                      className={inputStyle}
                      value={instructorPaymentType}
                      onChange={(e) => {
                        setInstructorPaymentType(e.target.value);
                        setTouched({
                          ...touched,
                          instructorPaymentType: true,
                        });
                        setInstructorPaymentAmount("");
                      }}
                      onBlur={() => handleBlur("instructorPaymentType")}>
                      <option value="">Select Payment Type</option>
                      <option value="percent">Percentage</option>
                      <option value="flat">Flat Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className={inputLabelStyle}>
                      Bonus Amount
                      {instructorPaymentType === "percent" && " (%)"}
                    </label>
                    <input
                      type="number"
                      className={`${inputStyle} ${
                        touched.instructorPaymentAmount &&
                        errors.instructorPaymentAmount
                          ? "border-red-500"
                          : ""
                      }`}
                      value={instructorPaymentAmount}
                      onChange={(e) =>
                        setInstructorPaymentAmount(e.target.value)
                      }
                      onBlur={() => handleBlur("instructorPaymentAmount")}
                      placeholder={
                        instructorPaymentType === "percent"
                          ? "Enter percentage"
                          : "Enter amount"
                      }
                    />
                    {touched.instructorPaymentAmount &&
                      errors.instructorPaymentAmount && (
                        <p className={`${errorStyle} error-message`}>
                          {errors.instructorPaymentAmount}
                        </p>
                      )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <label className={inputLabelStyle}>Currency</label>
                    <select
                      className={inputStyle}
                      value={perClassCurrency}
                      onChange={(e) => setPerClassCurrency(e.target.value)}
                      onBlur={() => handleBlur("perClassCurrency")}>
                      <option value="INR">₹ INR</option>
                      <option value="USD">$ USD</option>
                    </select>
                  </div>
                  <div>
                    <label className={inputLabelStyle}>Per-class Amount</label>
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-gray-500 text-sm pointer-events-none">
                        {perClassCurrency === "INR" ? "₹" : "$"}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`${inputStyle} pl-10 ${
                          touched.perClassAmount && errors.perClassAmount
                            ? "border-red-500"
                            : ""
                        }`}
                        value={perClassAmount}
                        onChange={(e) => setPerClassAmount(e.target.value)}
                        onBlur={() => handleBlur("perClassAmount")}
                        placeholder="0.00"
                      />
                      {touched.perClassAmount && errors.perClassAmount && (
                        <p className={`${errorStyle} error-message`}>
                          {errors.perClassAmount}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <label className={inputLabelStyle}>Class Types</label>
                  <Select
                    isMulti
                    options={classTypeOptions}
                    value={selectedClassTypes}
                    onChange={handleClassTypeChange}
                    placeholder="Select Class Type(s)"
                    className={`mt-1 ${
                      touched.classTypes && errors.classTypes
                        ? "select-error"
                        : ""
                    }`}
                    styles={{
                      control: (base) => ({
                        ...base,
                        fontSize: "14px",
                        minHeight: "38px",
                        borderColor:
                          touched.classTypes && errors.classTypes
                            ? "#ef4444"
                            : "#e2e8f0",
                        "&:hover": {
                          borderColor:
                            touched.classTypes && errors.classTypes
                              ? "#ef4444"
                              : InstitutionData.PrimaryColor,
                        },
                      }),
                      multiValue: (base) => ({
                        ...base,
                        fontSize: "12px",
                        backgroundColor: `${InstitutionData.PrimaryColor}20`,
                      }),
                      multiValueLabel: (base) => ({
                        ...base,
                        fontSize: "12px",
                        color: InstitutionData.PrimaryColor,
                      }),
                    }}
                  />
                  {touched.classTypes && errors.classTypes && (
                    <p className={`${errorStyle} error-message`}>
                      {errors.classTypes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Member Product Selection */}
            {(status === "Active" || status === "GracePeriod") &&
              normalizedUserType === "member" && (
              <div className="mt-3 sm:mt-4 border-t border-gray-100 pt-3 sm:pt-4">
                <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-3">
                  Product & Payment Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <label
                      className={`${inputLabelStyle} flex items-center gap-1`}>
                      <CreditCard size={12} />
                      Product Type*
                    </label>
                    <Select
                      inputId="productType"
                      options={productOptions}
                      value={selectedProductOption}
                      onChange={handleProductSelectChange}
                      onBlur={() => handleBlur("productType")}
                      placeholder="Search or select a product..."
                      isSearchable
                      formatOptionLabel={(opt) => (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 8,
                          }}>
                          <div>
                            <div style={{ fontSize: 13 }}>{opt.label}</div>
                            {opt.durationLabel && (
                              <div style={{ fontSize: 11, color: "#9ca3af" }}>
                                {opt.durationLabel}
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                            }}>
                            {opt.priceLabel}
                          </div>
                        </div>
                      )}
                      className="mt-1"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          fontSize: "14px",
                          minHeight: "38px",
                          borderColor:
                            touched.productType && errors.productType
                              ? "#ef4444"
                              : state.isFocused
                                ? InstitutionData.PrimaryColor
                                : "#e2e8f0",
                          boxShadow: "none",
                          "&:hover": {
                            borderColor:
                              touched.productType && errors.productType
                                ? "#ef4444"
                                : InstitutionData.PrimaryColor,
                          },
                        }),
                        groupHeading: (base) => ({
                          ...base,
                          fontSize: "11px",
                          textTransform: "uppercase",
                          color: "#9ca3af",
                          fontWeight: 600,
                        }),
                        menu: (base) => ({ ...base, zIndex: 20 }),
                      }}
                    />
                    {touched.productType && errors.productType && (
                      <p className={`${errorStyle} error-message`}>
                        {errors.productType}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={inputLabelStyle}>Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 text-sm">
                        {currencySymbol}
                      </span>
                      <input
                        className={`${inputStyle} pl-6`}
                        value={
                          selectedProductAmount
                            ? (selectedProductAmount / 100).toFixed(2)
                            : amount
                        }
                        readOnly
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-2">
                  <div>
                    <label
                      className={`${inputLabelStyle} flex items-center gap-1`}>
                      <Calendar size={12} />
                      Payment Date*
                    </label>
                    <input
                      required
                      className={`${inputStyle} ${
                        touched.paymentDate && errors.paymentDate
                          ? "border-red-500"
                          : ""
                      }`}
                      value={formatDateToDisplayInInput(paymentDate)}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      type="date"
                      onBlur={() => handleBlur("paymentDate")}
                    />
                  </div>
                  <div>
                    <label
                      className={`${inputLabelStyle} flex items-center gap-1`}>
                      <Check size={12} />
                      Payment Status
                    </label>
                    <select
                      required
                      className={inputStyle}
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}>
                      <option value="paid">Paid</option>
                      <option value="unPaid">Unpaid</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 sm:mt-4 border-t border-gray-100 pt-3 sm:pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-2">
                {showInput && (
                  <div className="relative">
                    <MdClose
                      className="absolute top-0 right-0 text-gray-500 cursor-pointer hover:text-red-500"
                      size={18}
                      onClick={() => setShowInput(false)}
                    />

                    <label className={inputLabelStyle}>ResetPassword</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={handlePasswordChange}
                      className={inputStyle}
                    />
                    {touched.newPassword && errors.newPassword && (
                      <p className={`${errorStyle} error-message`}>
                        {errors.newPassword}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          {!createButton && (
            <div>
              <h2 className={`text-xs text-${InstitutionData.PrimaryColor}`}>
                Last Login:{" "}
                {lastLogin
                  ? new Date(lastLogin).toISOString().split("T")[0]
                  : "N/A"}
              </h2>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center mt-2 gap-3 sm:gap-5">
            <div>
              {!showInput && !createButton && (
                <button
                  className="px-6 sm:px-8 py-2 sm:py-3 rounded-lg text-black font-medium flex flex-row gap-2 justify-center items-center w-full sm:w-[250px] transition-all hover:shadow-lg text-sm"
                  style={{
                    border: `1px solid ${InstitutionData.PrimaryColor}`,
                    boxShadow: `0 4px 6px ${InstitutionData.PrimaryColor}30`,
                  }}
                  onClick={handleChangeClick}>
                  ResetPassword
                </button>
              )}
            </div>
            <button
              className="px-6 sm:px-8 py-2 sm:py-3 rounded-lg text-white font-medium flex flex-row gap-2 justify-center items-center w-full sm:w-[250px] transition-all hover:shadow-lg text-sm"
              style={{
                backgroundColor: InstitutionData.PrimaryColor,
                boxShadow: `0 4px 6px ${InstitutionData.PrimaryColor}30`,
              }}
              onClick={onCreateUser}
              disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  <span>{createButton ? "Creating..." : "Updating..."}</span>
                </>
              ) : (
                <span>{createButton ? "Create User" : "Update User"}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateUser;