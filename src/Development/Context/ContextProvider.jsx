import { get, put, post, del, patch } from "aws-amplify/api";
import { uploadData, getUrl } from "aws-amplify/storage";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import Context from "./Context";
import apiPaths from "../utils/api-paths";
import institutionData from "../constants";
import { set } from "date-fns";
import { getTimezoneFromCountryCode } from "../utils/helpers";

export const uploadFile = async (file, { bucket, region, folder }) => {
  if (!file) return;

  try {
    const fileName = `${folder}/${file.name}_${Date.now()}`;

    const response = await uploadData({
      path: fileName,
      data: file,
      options: { contentType: file.type, accessLevel: "guest" },
    }).result;

    const url = await getUrl({ path: response.path });
    return url.url.toString().split("?")[0];
  } catch (error) {
    console.error("FileUpload error", error);
    throw error;
  }
};

const ContextProvider = (props) => {
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [userData, setUserData] = useState({});
  const [loader, setLoader] = useState(false);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [previousClasses, setPreviousClasses] = useState([]);
  const [userList, setUserList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [instructorList, setInstructorList] = useState([]);
  const [streakData, setStreakData] = useState({});
  const [ratings, setRatings] = useState([]);
  const [userAttendance, setUserAttendance] = useState({});
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [lodingRatings, setLoadingRatings] = useState(false);
  const [lodingStreak, setLoadingStreak] = useState(false);
  const [loadingNav, setLoadingNav] = useState(true);

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone) {
      localStorage.setItem("userTimeZone", timeZone);
    }
  }, []);
  useEffect(() => {
    const countryCode = userData?.location?.countryCode;
    console.log("[ContextProvider] CloudFront countryCode:", countryCode);
    console.log("[ContextProvider] userData.location:", userData?.location);
    if (!countryCode) return;
    const timeZone = getTimezoneFromCountryCode(countryCode);
    console.log("[ContextProvider] Resolved timezone:", timeZone);
    if (timeZone) {
      localStorage.setItem("userTimeZone", timeZone);
      localStorage.setItem("userLocation", countryCode);
    }
  }, [userData?.location?.countryCode]);
  const [loadingUserList, setLoadingUserList] = useState(false);
  const [userLocation, setUserLocation] = useState(
    localStorage.getItem("userLocation"),
  );
  console.log("userLocation", loadingNav);
  const onAuthLoad = async (auth, id) => {
    if (auth) {
      try {
        setLoadingUpcoming(true);
        console.log("Setting loadingUpcoming to true");
        const classesOp = get({
          apiName: "main",
          path: apiPaths.getUpcomingSchedule,
          options: {},
        });
        const classesRes = await classesOp.response;
        const classes = await classesRes.body.json();
        setUpcomingClasses(
          Array.isArray(classes)
            ? classes
            : classes?.schedule || classes?.items || classes?.classes || []
        );
      } catch (e) {
        setUpcomingClasses([]);
        console.log(e);
      } finally {
        setLoadingUpcoming(false);
        console.log("Setting loadingUpcoming to false");
      }

      try {
        // Add the API call for fetching streak data
        setLoadingStreak(true);
        console.log("Setting loadingStreak to true");
        const streakResOp = get({ apiName: "main", path: apiPaths.getStreak });
        const streakRes = await streakResOp.response;
        const streakResponse = await streakRes.body.json();
        setStreakData(streakResponse);
      } catch (e) {
        console.log(e);
        setStreakData({});
      } finally {
        setLoadingStreak(false);
        console.log("Setting loadingStreak to false");
      }

      try {
        setLoadingPrevious(true);
        console.log("Setting loadingPrevious to true");
        const classesOp = get({
          apiName: "main",
          path: apiPaths.getPreviousScedule,
          options: {},
        });
        const classesRes = await classesOp.response;
        const classes = await classesRes.body.json();
        setPreviousClasses(classes);
      } catch (e) {
        setPreviousClasses([]);
        console.log(e);
      } finally {
        setLoadingPrevious(false);
        console.log("Setting loadingPrevious to false");
      }
      getUserList();

      await getInstructorList();

      try {
        setLoadingRatings(true);
        console.log("Setting loadingRatings to true");
        const responseOp = put({
          apiName: "main",
          path: apiPaths.getRating,
          options: { body: {} },
        });
        const responseRes = await responseOp.response;
        const response = await responseRes.body.json();
        console.log(response);
        setRatings(response);
      } catch (error) {
        console.error("Error fetching ratings:", error);
      } finally {
        setLoadingRatings(false);
        console.log("Setting loadingRatings to false");
      }

      try {
        const responseOp = get({
          apiName: "main",
          path: apiPaths.listAttendance,
          options: {},
        });
        const responseRes = await responseOp.response;
        const response = await responseRes.body.json();
        console.log(response);
        setUserAttendance(response.attendanceByUser);
      } catch (e) {
        console.log(e);
      }
    }
  };

  const getInstructorList = async () => {
    try {
      const listOp = get({ apiName: "main", path: apiPaths.getInstructors });
      const listRes = await listOp.response;
      const list = await listRes.body.json();
      console.log("Instructors:", list);
      console.log("Fetched instructors:", list.length);
      setInstructorList(list);
    } catch (error) {
      console.log(error);
    }
  };

  const getUserAttendance = async () => {
    try {
      const responseOp = get({
        apiName: "main",
        path: apiPaths.listAttendance,
      });
      const responseRes = await responseOp.response;
      const response = await responseRes.body.json();
      setUserAttendance(response.attendanceByUser);
    } catch (e) {
      console.log(e);
    }
  };

  const getUserList = async () => {
    try {
      setLoadingUserList(true);
      console.log("Setting loadingUserList to true");
      const listOp = get({ apiName: "main", path: apiPaths.getMembers });
      const listRes = await listOp.response;
      const list = await listRes.body.json();
      setUserList(list);
    } catch (e) {
      console.log(e);
      setUserList([]);
    } finally {
      setLoadingUserList(false);
      console.log("Setting loadingUserList to false");
    }
  };

  const [filteredProductList, setFilteredProductList] = useState([]);

  useEffect(() => {
    const initializeLocation = async () => {
      if (userData?.location?.countryCode) {
        setUserLocation(userData.location.countryCode);
        localStorage.setItem("userLocation", userData.location.countryCode);
        return;
      }
      const storedLocation = localStorage.getItem("userLocation");
      if (storedLocation) {
        setUserLocation(storedLocation);
        return;
      }
      // Fallback location
      setUserLocation("US");
      localStorage.setItem("userLocation", "US");
    };
    initializeLocation();
  }, [userData?.location?.countryCode]);

  const onUnauthLoad = async () => {
    try {
      const listOp = get({ apiName: "main", path: apiPaths.getProducts });
      const listRes = await listOp.response;
      const list = await listRes.body.json();
      setProductList(list);
      try {
        console.log(
          "[ContextProvider] fetched products count:",
          Array.isArray(list) ? list.length : 0,
        );
        console.log(
          "[ContextProvider] fetched productIds:",
          Array.isArray(list)
            ? list.map((p) => p.productId || p.planId || p.plan_id)
            : list,
        );
      } catch (logErr) {
        console.warn("[ContextProvider] failed to log products", logErr);
      }
    } catch (e) {
      console.error(e);
      setProductList([]);
    }
  };
  useEffect(() => {
    onUnauthLoad();
  }, []);

  useEffect(() => {
    onUnauthLoad();
  }, []); // Run once on component mount

  useEffect(() => {
    if (!userLocation || !productList.length) return;

    const filtered = productList
      .filter((item) => item.productId !== "1000048")
      .filter((item) => {
        if (userLocation === "IN") {
          return item.currency === "INR" && item.subscriptionType !== "hybrid";
        }
        return item.currency !== "INR" && item.subscriptionType !== "hybrid";
      });

    setFilteredProductList(filtered);
  }, [userLocation, productList]);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylist, setLoadingPlaylist] = useState(true);
  const [errorPlaylist, setErrorPlaylist] = useState(null);

  const setIsAuthFn = (data) => {
    setIsAuth(data);
  };

  const setUserDataFn = (data) => {
    setUserData(data);
  };

  const setLoaderFn = (data) => {
    setLoader(data);
    console.log("Setting loader to", data);
  };

  const setUpcomingClassesFn = (classes) => {
    setUpcomingClasses(
      Array.isArray(classes)
        ? classes
        : classes?.schedule || classes?.items || classes?.classes || []
    );
  };

  const setPreviousClassesFn = (classes) => {
    setPreviousClasses(classes);
  };

  const setUserListFn = (list) => {
    setUserList(list);
  };

  const setStreakDataFn = (streakResponse) => {
    setStreakData(streakResponse);
  };

  const checkSubscriptionStatus = useMemo(() => {
    if (userData && userData.userType) {
      const subscriptionType = userData.userType;
      const subscriptionStatus = userData.status;
      if (subscriptionType === "admin") {
        return { borderColor: "green" };
      } else if (subscriptionType === "instructor") {
        return { borderColor: "blue" };
      } else if (
        subscriptionType === "member" &&
        subscriptionStatus === "Active"
      ) {
        return { borderColor: "#1b7571" };
      }
    }
    // Return the default style for non-admin and non-active accounts
    return { borderColor: "red" };
  }, [userData]);

  const [imageUrls, setImageUrls] = useState([]);
  const [galleryData, setGalleryData] = useState({});
  const [tempImgSrc, setTempImgSrc] = useState();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const getImagesFromAPI = async (imageUrl) => {
    try {
      const responseOp = get({
        apiName: "main",
        path: `/user/get-imageUrl/${institutionData.InstitutionId}`,
      });
      const responseRes = await responseOp.response;
      const response = await responseRes.body.json();
      setImageUrls(response.GalleryImagesLinks || []);
      if (response.gallery) {
        setGalleryData(response.gallery);
      }
      if (imageUrl) {
        const filename = imageUrl.split("/").pop();
        if (response.gallery && response.gallery[filename]) {
          setDescription(response.gallery[filename].description);
          setTitle(response.gallery[filename].title);
        }
      }
      return response;
    } catch (error) {
      console.error("Error getting images from API: ", error);
    }
  };

  const [revenue, setRevenue] = useState([]); // Initialize with an empty array

  useEffect(() => {
    const paymentDetailsAdmin = async () => {
      try {
        const responseOp = get({
          apiName: "main",
          path: `/payment-history/${userData.institution}`,
        });
        const responseRes = await responseOp.response;
        const response = await responseRes.body.json();
        const payments = response?.payments || [];
        setRevenue(Array.isArray(payments) ? payments : []); // Ensure revenue is an array
      } catch (error) {
        console.error("Error getting payment history from API: ", error);
      }
    };

    // Only run the function if userData.institution is available
    if (userData.institution) {
      paymentDetailsAdmin();
    }
  }, [userData.institution]); // Dependency on userData.institution

  const updateUserStatus = async (userId, institution) => {
    const currentEpochTime = Math.floor(new Date().getTime() / 1000);

    // Assuming userData contains the trialEndDate
    if (userData && userData.trialEndDate && userData.status === "Trial") {
      const trialEndEpoch = userData.trialEndDate;

      if (currentEpochTime > trialEndEpoch) {
        try {
          // Call the user update API to set the status to 'Inactive'
          const responseOp = put({
            apiName: "main",
            path: `/user/profile-update/${institution}`,
            options: {
              body: {
                status: "Inactive",
              },
            },
          });
          const responseRes = await responseOp.response;
          const response = await responseRes.body.json();
          console.log("User status updated to Inactive:", response);
          setUserData((prevData) => ({
            ...prevData,
            status: "Inactive", // Update the context state
          }));
        } catch (error) {
          console.error("Error updating user status to Inactive:", error);
        }
      }
    }
  };

  //update user status after renew date finished
  const updateUserStatusRenew = async (institution) => {
    try {
      // API call to fetch the user status based on institution
      // API call to fetch the user status based on institution
      const statusResponseOp = put({
        apiName: "main",
        path: `/user/status/${institution}`,
        options: {
          body: {},
        },
      });
      const statusResponseRes = await statusResponseOp.response;
      const statusResponse = await statusResponseRes.body.json();

      if (statusResponse && statusResponse.status) {
        // Update the user status in the context
        setUserData((prevData) => ({
          ...prevData,
          status: statusResponse.status, // Assuming the API returns the status
        }));
        console.log("User status updated:", statusResponse.status);
      }
    } catch (e) {
      console.log("Error fetching or updating user status:", e);
    }
  };

  useEffect(() => {
    if (userData && userData.status) {
      // Check if user status requires renewal update
      updateUserStatusRenew(userData.institution); // Just pass the institution to update status
    }
  }, [userData]); // Trigger the effect whenever userData changes

  // Call this function periodically or after certain actions
  useEffect(() => {
    if (userData.institution && userData.cognitoId) {
      updateUserStatus(userData.cognitoId, userData.institution);
    }
  }, [userData]); // Run whenever userData changes

  // Cart System
  const [itemCount, setItemCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [cartState, setCartState] = useState({
    subtotal: 0,
    productItems: [],
    quantities: [],
    currencySymbol: "$",
  });

  const getCartItems = async (institution, cognitoId) => {
    try {
      const responseOp = get({
        apiName: "awsaiapp",
        path: `/any/getcartitems/${institution}/${cognitoId}`,
      });
      const responseRes = await responseOp.response;
      const response = await responseRes.body.json();
      setCartItems(response);
      setItemCount(response.length);
      getPaymentHistory(institution, cognitoId);
      if (Array.isArray(response) && response.length > 0) {
        const quantities = response.map(() => 1);
        const subtotal = response.reduce(
          (total, item, index) =>
            total + (item.amount / 100) * quantities[index],
          0,
        );
        const currencySymbol = response[0].currency === "INR" ? "₹" : "$";
        setCartState({
          productItems: response,
          quantities,
          subtotal,
          currencySymbol,
        });
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  const removeCartItem = async (productId, institution, cognitoId) => {
    try {
      const delOp = del({
        apiName: "awsaiapp",
        path: `/any/deleteCartItem/${institution}/${cognitoId}`,
        options: {
          body: { productId },
        },
      });
      await delOp.response;
      getCartItems(institution, cognitoId);
    } catch (error) {
      console.error("Error removing product:", error);
    }
  };

  const addCartItem = async (item, institution, cognitoId) => {
    try {
      const postOp = post({
        apiName: "awsaiapp",
        path: "/any/addtocart",
        options: {
          body: { institution, cognitoId, cart: [item] },
        },
      });
      await postOp.response;
      getCartItems(institution, cognitoId);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const getPaymentHistory = async (institution, cognitoId) => {
    try {
      const paymentHistoryOp = get({
        apiName: "awsaiapp",
        path: `/getReciept/${institution}/${cognitoId}`,
      });
      const paymentHistoryRes = await paymentHistoryOp.response;
      const paymentHistory = await paymentHistoryRes.body.json();
      setPaymentHistory(paymentHistory);
      return paymentHistory;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const fetchPaymentHistory = async (institution, cognitoId) => {
    const historyOp = get({
      apiName: "awsaiapp",
      path: `/getReciept/${institution}/${cognitoId}`,
    });
    const historyRes = await historyOp.response;
    return await historyRes.body.json();
  };

  // New function to check if a product is in the cart
  const isProductInCart = useCallback(
    (productId) => {
      return (
        Array.isArray(cartItems) &&
        cartItems.some((item) => item.planId === productId)
      );
    },
    [cartItems],
  );

  const deleteUser = async (institution, cognitoId) => {
    try {
      const putOp = put({
        apiName: "main",
        path: "/admin/delete-user",
        options: {
          body: { institution, cognitoId },
          headers: { "Content-Type": "application/json" },
        },
      });
      const putRes = await putOp.response;
      return await putRes.body.json();
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

  const getProductsAdmin = async (institutionId) => {
    const op = get({ apiName: "main", path: `/any/products/${institutionId}` });
    const res = await op.response;
    return await res.body.json();
  };

  const createUser = async (payload) => {
    const op = post({
      apiName: "main",
      path: `/admin/create-user`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const updateUser = async (institutionId, payload) => {
    const op = put({
      apiName: "main",
      path: `/admin/update-user/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const updateAdminUserAttribute = async (
    institutionId,
    attributeName,
    payload,
  ) => {
    const op = patch({
      apiName: "main",
      path: `/admin/update-attributes/${institutionId}/${attributeName}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const changeUserPassword = async (payload) => {
    const op = put({
      apiName: "main",
      path: "/admin/change-user-password",
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const createPresetSubscriptions = async (institutionId, payload) => {
    const op = post({
      apiName: "main",
      path: `/instructor/preset-subscriptions/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const assignPaypalPlans = async (institutionId, payload) => {
    const op = post({
      apiName: "main",
      path: `/instructor/assign-paypal-plans/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const updateUserPayment = async (institutionId, payload) => {
    const op = post({
      apiName: "main",
      path: `/admin/user-payment-update/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const updateInstructor = async (institutionId, instructorId, payload) => {
    const op = put({
      apiName: "main",
      path: `/admin/put-instructor/${institutionId}/${instructorId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const instructorCashout = async (institutionId, payload) => {
    const op = post({
      apiName: "main",
      path: `/admin/instructor-cashout/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const getInstructorAttendance = async (
    institutionId,
    cognitoIdsOrQuery,
    month,
    year,
    page,
    pageSize,
  ) => {
    try {
      const isObjectQuery =
        cognitoIdsOrQuery &&
        typeof cognitoIdsOrQuery === "object" &&
        !Array.isArray(cognitoIdsOrQuery);

      const query = isObjectQuery
        ? { ...cognitoIdsOrQuery }
        : {
            cognitoIds: cognitoIdsOrQuery,
            month,
            year,
            page,
            pageSize,
          };

      const rawCognitoIds = query.cognitoIds;
      let cognitoIds = rawCognitoIds;

      if (Array.isArray(rawCognitoIds)) {
        cognitoIds = JSON.stringify(rawCognitoIds);
      } else if (typeof rawCognitoIds === "string") {
        // Keep already-stringified values as-is, but normalize stringified arrays.
        try {
          const parsed = JSON.parse(rawCognitoIds);
          cognitoIds = Array.isArray(parsed)
            ? JSON.stringify(parsed)
            : rawCognitoIds;
        } catch {
          cognitoIds = rawCognitoIds;
        }
      } else if (rawCognitoIds !== undefined && rawCognitoIds !== null) {
        cognitoIds = JSON.stringify(rawCognitoIds);
      }

      const queryParams = {
        institution: institutionId,
        cognitoIds,
        month: query.month,
        year: query.year,
      };

      if (query.page !== undefined) queryParams.page = query.page;
      if (query.pageSize !== undefined) queryParams.pageSize = query.pageSize;

      const op = get({
        apiName: "main",
        path: "/admin/get-instructor-attendance",
        options: {
          queryParams,
        },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error fetching instructor attendance:", error);
      throw error;
    }
  };

  const getInstructorProfileByReferral = async (institutionId, referral) => {
    const op = get({
      apiName: "main",
      path: `/instructor/profile/${institutionId}?referral=${referral}`,
    });
    const res = await op.response;
    return await res.body.json();
  };

  const getGenericInstructorList = async (institutionId) => {
    const op = get({
      apiName: "main",
      path: `/any/instructor-list/${institutionId}`,
    });
    const res = await op.response;
    const instructors = await res.body.json();
    return instructors.filter(
      (instructor) => instructor.instructorStatus?.toLowerCase() !== "inactive",
    );
  };

  const queryAttendance = async (institutionId, classId, userId) => {
    let finalUrl = `/admin/query-attendance/${institutionId}?classId=${classId}`;
    if (userId) finalUrl += `&userId=${userId}`;
    const op = get({ apiName: "main", path: finalUrl });
    const res = await op.response;
    return await res.body.json();
  };

  const editScheduleName = async (institutionId, payload) => {
    const op = put({
      apiName: "main",
      path: `/admin/edit-schedule-name/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const putAttendance = async (institutionId, payload) => {
    return submitUserAttendance(institutionId, payload);
  };

  const addSchedule = async (institutionId, payload) => {
    const op = post({
      apiName: "main",
      path: `/admin/add-schedule/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const getStreak = async (institutionId) => {
    const op = get({
      apiName: "main",
      path: `/user/streak-get/${institutionId}`,
    });
    const res = await op.response;
    return await res.body.json();
  };

  const updateStreak = async (institutionId) => {
    const op = put({
      apiName: "main",
      path: `/user/streak-update/${institutionId}`,
    });
    const res = await op.response;
    return await res.body.json();
  };

  const updateUserProfile = async (institutionId, payload) => {
    const op = put({
      apiName: "main",
      path: `/user/profile/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const getUserAttendanceList = async (institutionId) => {
    const op = get({
      apiName: "main",
      path: `/user/list-attendance/${institutionId}`,
    });
    const res = await op.response;
    return await res.body.json();
  };

  const updateAchievement = async (institutionId, payload) => {
    const op = post({
      apiName: "main",
      path: `/milestone-certificate/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const cancelSubscription = async (institutionId) => {
    const op = post({
      apiName: "main",
      path: `/user/cancel-subscription/${institutionId}`,
      options: { body: {} },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const pauseSubscription = async (payload) => {
    return pauseSubscriptionAdmin(payload);
  };

  const fetchRazorpaySubscription = async (payload) => {
    const op = post({
      apiName: "main",
      path: "/payment/razorpay-subscription-fetch",
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const submitInstructorRating = async (institutionId, payload) => {
    // 1. Client-side normalization and guard
    const normalizedPayload = {
      ...payload,
      rating: Number(payload?.rating),
      instructorId: payload?.instructorId ? String(payload.instructorId).trim() : "",
      classId: payload?.classId ? String(payload.classId).trim() : "",
      review: payload?.review ? String(payload.review).trim() : "",
    };

    try {
      const op = put({
        apiName: "main",
        path: `/instructor/rating/${institutionId}`,
        options: { body: normalizedPayload },
      });
      const res = await op.response;
      const data = await res.body.json();

      // 2. Authoritative points synchronization on new rating creation only (Requirement 6)
      if (data?.isCreated) {
        if (data?.updatedUser?.Attributes?.rating_points !== undefined) {
          const freshPoints = Number(data.updatedUser.Attributes.rating_points);
          setUserData((prev) => ({
            ...prev,
            rating_points: freshPoints,
          }));
        } else if (typeof getUserProfile === "function") {
          getUserProfile(institutionId).catch(() => {});
        }
      }

      // 3. UI synchronization for ratings list (Requirement 4 & 6)
      if (data?.rating) {
        setRatings((prevRatings) => {
          const list = Array.isArray(prevRatings) ? [...prevRatings] : [];
          const idx = list.findIndex(
            (r) =>
              r.instructorId === data.rating.instructorId &&
              r.userId === data.rating.userId &&
              ((r.classId && r.classId === data.rating.classId) || (!r.classId && !data.rating.classId))
          );
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...data.rating };
            return list;
          }
          return [data.rating, ...list];
        });
      }

      return data;
    } catch (error) {
      // 4. Robust error extraction for Amplify RestError (Requirement 5)
      let statusCode = error?.response?.statusCode || (error?.statusCode ? Number(error.statusCode) : 500);
      let errorBody = null;
      let backendMessage = "";

      if (error?.response?.body) {
        try {
          if (typeof error.response.body.json === "function") {
            errorBody = await error.response.body.json();
          } else if (typeof error.response.body.text === "function") {
            const rawText = await error.response.body.text();
            try {
              errorBody = JSON.parse(rawText);
            } catch {
              errorBody = { error: rawText };
            }
          }
        } catch (_) {
          // Response body could not be parsed as json/text
        }
      }

      if (errorBody && (errorBody.error || errorBody.message)) {
        backendMessage = errorBody.error || errorBody.message;
      }

      const structuredError = new Error(
        backendMessage || error.message || "Failed to submit rating"
      );
      structuredError.statusCode = statusCode;
      structuredError.backendMessage = backendMessage;
      structuredError.errorBody = errorBody;
      structuredError.originalError = error;

      throw structuredError;
    }
  };

  const getCurrentClass = async (institutionId) => {
    const op = get({
      apiName: "main",
      path: `/any/get-current-class/${institutionId}`,
      options: {},
    });
    const res = await op.response;
    return await res.body.json();
  };

  const submitUserAttendance = async (institutionId, payload) => {
    const op = post({
      apiName: "main",
      path: `/user/put-attendance/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const deleteObject = async (key) => {
    const op = del({
      apiName: "main",
      path: "/any/delete-object",
      options: { body: { key } },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const updateInstructorAttribute = async (
    institutionId,
    attributeName,
    payload,
  ) => {
    try {
      const op = put({
        apiName: "main",
        path: `/instructor/attribute-update/${institutionId}/${attributeName}`,
        options: { body: payload },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error updating instructor attribute:", error);
      throw error;
    }
  };

  const deleteFile = async (bucket, folder) => {
    const op = post({
      apiName: "main",
      path: "/file/delete",
      options: { body: { bucket, folder } },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const updateHybridPage = async (institutionId, instructorId, payload) => {
    const op = put({
      apiName: "main",
      path: `/hybrid-page/update/${institutionId}/${instructorId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const createShortLink = async (payload) => {
    try {
      const op = post({
        apiName: "main",
        path: apiPaths.createShortLink || "/short-links",
        options: { body: payload },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error creating short link:", error);
      throw error;
    }
  };

  const markAttendanceUser = async (institutionId) => {
    const op = put({
      apiName: "main",
      path: `/user/put-attendance/${institutionId}`,
    });
    const res = await op.response;
    return await res.body.json();
  };

  const updateScheduleRecording = async (institutionId, payload) => {
    const op = put({
      apiName: "main",
      path: `/admin/edit-schedule-recording/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const cancelSubscriptionAdmin = async (payload) => {
    const op = post({
      apiName: "main",
      path: `/admin/cancel-subscription`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const pauseSubscriptionAdmin = async (payload) => {
    const op = post({
      apiName: "main",
      path: `/admin/pause-subscription`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const processRefundPayment = async ({
    institutionId,
    paymentId,
    cognitoId,
    reason,
  }) => {
    const targetInstitution = institutionId || userData.institution;
    if (!targetInstitution) {
      throw new Error("Institution ID is required for refund processing.");
    }
    if (!paymentId) {
      throw new Error("Payment ID is required for refund processing.");
    }

    try {
      const op = post({
        apiName: "main",
        path: `/payment/refund/${targetInstitution}`,
        options: {
          body: {
            institutionId: targetInstitution,
            paymentId,
            cognitoId,
            reason: reason || "Full refund requested from dashboard",
          },
        },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (err) {
      let errorMessage = err.message || "Failed to process refund.";
      if (err.response) {
        try {
          const body = await err.response.body.json();
          if (body && (body.error || body.message)) {
            errorMessage = body.error || body.message;
          }
        } catch (parseErr) {
          try {
            const text = await err.response.body.text();
            if (text) errorMessage = text;
          } catch {}
        }
      }
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = err;
      throw enhancedError;
    }
  };

  const getPendingRefundRequests = async (institutionId) => {
    const targetInstitution = institutionId || userData.institution;
    if (!targetInstitution) {
      throw new Error("Institution ID is required to fetch refund requests.");
    }

    try {
      const op = get({
        apiName: "main",
        path: `/payment/refund-requests/${targetInstitution}`,
      });
      const res = await op.response;
      const data = await res.body.json();
      return data;
    } catch (err) {
      let errorMessage = err.message || "Failed to fetch refund requests.";
      if (err.response) {
        try {
          const body = await err.response.body.json();
          if (body && (body.error || body.message)) {
            errorMessage = body.error || body.message;
          }
        } catch (parseErr) {
          try {
            const text = await err.response.body.text();
            if (text) errorMessage = text;
          } catch {}
        }
      }
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = err;
      throw enhancedError;
    }
  };

  const approveRefundRequest = async ({
    institutionId,
    refundRequestId,
    reason,
  }) => {
    const targetInstitution = institutionId || userData.institution;
    if (!targetInstitution) {
      throw new Error("Institution ID is required for refund approval.");
    }
    if (!refundRequestId) {
      throw new Error("Refund Request ID is required for refund approval.");
    }

    try {
      const op = post({
        apiName: "main",
        path: `/payment/refund/${targetInstitution}/${refundRequestId}/approve`,
        options: {
          body: {
            reason: reason || "Approved by administrator",
          },
        },
      });
      const res = await op.response;
      const data = await res.body.json();
      return data;
    } catch (err) {
      let errorMessage = err.message || "Failed to approve refund request.";
      let status = null;
      if (err.response) {
        try {
          const body = await err.response.body.json();
          if (body && (body.error || body.message)) {
            errorMessage = body.error || body.message;
          }
          if (body?.status) {
            status = body.status;
          }
        } catch (parseErr) {
          try {
            const text = await err.response.body.text();
            if (text) errorMessage = text;
          } catch {}
        }
      }
      const enhancedError = new Error(errorMessage);
      enhancedError.status = status;
      enhancedError.originalError = err;
      throw enhancedError;
    }
  };

  const rejectRefundRequest = async ({
    institutionId,
    refundRequestId,
    reason,
  }) => {
    const targetInstitution = institutionId || userData.institution;
    if (!targetInstitution) {
      throw new Error("Institution ID is required for refund rejection.");
    }
    if (!refundRequestId) {
      throw new Error("Refund Request ID is required for refund rejection.");
    }

    try {
      const op = post({
        apiName: "main",
        path: `/payment/refund/${targetInstitution}/${refundRequestId}/reject`,
        options: {
          body: {
            reason: reason || "Rejected by administrator",
          },
        },
      });
      const res = await op.response;
      const data = await res.body.json();
      return data;
    } catch (err) {
      let errorMessage = err.message || "Failed to reject refund request.";
      if (err.response) {
        try {
          const body = await err.response.body.json();
          if (body && (body.error || body.message)) {
            errorMessage = body.error || body.message;
          }
        } catch (parseErr) {
          try {
            const text = await err.response.body.text();
            if (text) errorMessage = text;
          } catch {}
        }
      }
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = err;
      throw enhancedError;
    }
  };

  const reloadRevenue = async (institutionId) => {
    const targetInstitution = institutionId || userData.institution;
    if (!targetInstitution) return [];
    try {
      const responseOp = get({
        apiName: "main",
        path: `/payment-history/${targetInstitution}`,
      });
      const responseRes = await responseOp.response;
      const response = await responseRes.body.json();
      const payments = response?.payments || [];
      const paymentList = Array.isArray(payments) ? payments : [];
      setRevenue(paymentList);
      return paymentList;
    } catch (error) {
      console.error("Error reloading revenue history: ", error);
      return [];
    }
  };

  const getCashCollected = async (institutionId) => {
    const op = get({
      apiName: "main",
      path: `/cashCollected/${institutionId}`,
    });
    const res = await op.response;
    return await res.body.json();
  };

  const updateUserProfileImage = async (institutionId, payload) => {
    const op = put({
      apiName: "main",
      path: `/user/profile/img/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const getBirthdayMessage = async (institutionId) => {
    const op = post({
      apiName: "main",
      path: `/user/birthday-message/${institutionId}`,
    });
    const res = await op.response;
    return await res.body.json();
  };

  const getProductsAny = async (institutionId) => {
    const op = get({ apiName: "main", path: `/any/products/${institutionId}` });
    const res = await op.response;
    return await res.body.json();
  };

  const updateUserAdmin = async (institutionId, payload) => {
    const op = put({
      apiName: "main",
      path: `/admin/update-user/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const updateUserPaymentAdmin = async (institutionId, payload) => {
    const op = post({
      apiName: "main",
      path: `/admin/user-payment-update/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const sendEmail = async (institutionId, payload) => {
    const op = post({
      apiName: "main",
      path: `/user/send-email/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const getInstructorAttendanceAdmin = async (queryParams) => {
    const op = get({
      apiName: "main",
      path: "/admin/get-instructor-attendance",
      options: { queryParams: queryParams },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const getMembers = async (queryParams) => {
    const op = get({
      apiName: "main",
      path: "/user/get-members",
      options: { queryParams: queryParams },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const addMember = async (payload) => {
    const op = post({
      apiName: "main",
      path: "/user/add-member",
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const updateMember = async (payload) => {
    const op = patch({
      apiName: "main",
      path: "/user/update-member",
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const deleteMember = async (payload) => {
    const op = put({
      apiName: "main",
      path: `/admin/delete-user`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const fetchRatingsAdmin = async () => {
    const institutionId =
      userData?.institution ||
      userData?.institutionId ||
      institutionData.InstitutionId;

    const op = put({
      apiName: "main",
      path: `/admin/rating-fetch/${institutionId}`,
      options: {},
    });
    const res = await op.response;
    return await res.body.json();
  };

  const updateInstructorTestimonials = async (institutionId, payload) => {
    const op = put({
      apiName: "main",
      path: `/instructor/attribute-update/${institutionId}/testimonials`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const fetchVideosChoreography = async (institutionId, queryParams) => {
    const normalizedQueryParams =
      queryParams instanceof URLSearchParams
        ? Object.fromEntries(queryParams.entries())
        : queryParams;

    const tryFetch = async (path) => {
      const op = get({
        apiName: "main",
        path,
        options: { queryParams: normalizedQueryParams },
      });
      const res = await op.response;
      return await res.body.json();
    };

    try {
      return await tryFetch(`/user/fetch-videos/${institutionId}`);
    } catch (error) {
      const statusCode = error?.$metadata?.httpStatusCode;
      if (statusCode === 404) {
        return await tryFetch(`/user/fetch-video/${institutionId}`);
      }
      throw error;
    }
  };

  const deleteClassVideo = async (institutionId, payload) => {
    const op = del({
      apiName: "main",
      path: `/admin/delete-class-videos/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const manageClassVideoUpload = async (institutionId, payload) => {
    const op = post({
      apiName: "main",
      path: `/admin/upload-class-videos/${institutionId}`,
      options: { body: payload },
    });
    const res = await op.response;
    return await res.body.json();
  };

  const searchVideos = async (institutionId, term) => {
    const op = get({
      apiName: "main",
      path: `/user/search-by-song-choreographer-playlist/${institutionId}?q=${encodeURIComponent(term)}`,
    });
    const res = await op.response;
    return await res.body.json();
  };

  const fetchVideoBySongName = async (institutionId, songName) => {
    const op = get({
      apiName: "main",
      path: `/user/fetch-by-songName/${songName}/${institutionId}`,
    });
    const res = await op.response;
    return await res.body.json();
  };

  const buildPlaylistsFromVideos = useCallback((videoList = []) => {
    const grouped = new Map();

    videoList.forEach((video) => {
      const playlistName = (video.playlist || "Uncategorized").trim();
      const existing = grouped.get(playlistName) || {
        playlistName,
        videos: [],
        videoCount: 0,
        partNoInclude: [],
      };

      existing.videos.push(video);

      const fallbackPartNo = video.videoType_partNo
        ? String(video.videoType_partNo).split("_").pop()
        : null;
      const partNo = video.partNo ?? fallbackPartNo;

      if (partNo !== undefined && partNo !== null && partNo !== "") {
        existing.partNoInclude.push(String(partNo));
      }

      grouped.set(playlistName, existing);
    });

    return Array.from(grouped.values())
      .map((playlist) => ({
        ...playlist,
        videoCount: playlist.videos.length,
        partNoInclude: [...new Set(playlist.partNoInclude)],
      }))
      .sort((a, b) => a.playlistName.localeCompare(b.playlistName));
  }, []);

  const fetchPlaylists = useCallback(
    async (institutionIdOverride) => {
      const institutionId = institutionIdOverride || userData?.institution;

      if (!institutionId) {
        setPlaylists([]);
        setLoadingPlaylist(false);
        setErrorPlaylist(null);
        return [];
      }

      setLoadingPlaylist(true);
      setErrorPlaylist(null);

      try {
        const collectedVideos = [];
        let nextLastKey = null;
        let hasMore = true;
        let pageGuard = 0;

        while (hasMore && pageGuard < 20) {
          const queryParams = new URLSearchParams({
            pageSize: "100",
            ...(nextLastKey ? { lastKey: nextLastKey } : {}),
          });

          const response = await fetchVideosChoreography(
            institutionId,
            queryParams,
          );
          const pageVideos = Array.isArray(response?.videos)
            ? response.videos
            : [];

          collectedVideos.push(...pageVideos);
          nextLastKey = response?.lastKey || null;
          hasMore = Boolean(nextLastKey);
          pageGuard += 1;
        }

        const playlistData = buildPlaylistsFromVideos(collectedVideos);
        setPlaylists(playlistData);
        return playlistData;
      } catch (err) {
        console.error("Error fetching choreography playlists:", err);
        setErrorPlaylist("Failed to fetch playlists");
        setPlaylists([]);
        return [];
      } finally {
        setLoadingPlaylist(false);
      }
    },
    [buildPlaylistsFromVideos, fetchVideosChoreography, userData?.institution],
  );

  const fetchVideos = useCallback(
    async (institutionIdOverride, queryParams) => {
      const institutionId = institutionIdOverride || userData?.institution;
      if (!institutionId) {
        return { videos: [], lastKey: null };
      }

      try {
        const response = await fetchVideosChoreography(
          institutionId,
          queryParams,
        );
        return response || { videos: [], lastKey: null };
      } catch (err) {
        console.error("Error fetching choreography videos:", err);
        throw err;
      }
    },
    [fetchVideosChoreography, userData?.institution],
  );

  const fetchAttendance = async (institutionId, classId) => {
    return queryAttendance(institutionId, classId);
  };

  const markUserAttendance = async (
    institutionId,
    { classId, cognitoId, emailId },
  ) => {
    return submitUserAttendance(institutionId, { classId, cognitoId, emailId });
  };

  const updateScheduleInstructor = async (institutionId, payload) => {
    return editScheduleName(institutionId, payload);
  };

  const markInstructorAttendance = async (payload) => {
    try {
      const op = patch({
        apiName: "main",
        path: `/admin/update-instructor-attendance`,
        options: { body: payload },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error marking instructor attendance:", error);
      throw error;
    }
  };

  const getInstructorDashboard = async (institutionId, params = {}) => {
    try {
      const instId =
        institutionId || userData?.institution || institutionData.InstitutionId;
      if (!instId) {
        throw new Error("Institution ID is required");
      }

      const queryParams = {};
      if (params.period) queryParams.period = String(params.period);
      if (params.startDate) queryParams.startDate = String(params.startDate);
      if (params.endDate) queryParams.endDate = String(params.endDate);

      const op = get({
        apiName: "main",
        path: `/instructor/dashboard/${instId}`,
        options: Object.keys(queryParams).length > 0 ? { queryParams } : {},
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error fetching instructor dashboard:", error);
      throw error;
    }
  };

  const getReferredMembers = async (referralCode) => {
    try {
      const op = get({
        apiName: "main",
        path: `/instructor/referred-members/${referralCode}`,
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error fetching referred members:", error);
      throw error;
    }
  };

  const getInstructorProfile = async (institutionId, referralCode) => {
    try {
      const op = get({
        apiName: "main",
        path: `/instructor/profile/${institutionId}?referral=${referralCode}`,
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error fetching instructor profile:", error);
      throw error;
    }
  };

  const updateFooterData = async (payload) => {
    try {
      const op = put({
        apiName: "main",
        path: "/admin/update-footer-data",
        options: { body: payload },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error updating footer data:", error);
      throw error;
    }
  };

  const uploadHeroVideos = async (institutionId, file) => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    try {
      // 1. Initiate
      const initOp = post({
        apiName: "main",
        path: `/admin/upload-hero-videos/${institutionId}`,
        options: {
          body: {
            operation: "INITIATE_VIDEO_UPLOAD",
            fileName: file.name,
            contentType: file.type,
          },
        },
      });
      const initRes = await initOp.response;
      const initResponse = await initRes.body.json();
      const { uploadId, key } = initResponse;

      // 2. Upload Parts
      const parts = [];
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const urlOp = post({
          apiName: "main",
          path: `/admin/upload-hero-videos/${institutionId}`,
          options: {
            body: {
              operation: "GET_VIDEO_UPLOAD_URL",
              uploadId,
              partNumber,
              key,
            },
          },
        });
        const urlRes = await urlOp.response;
        const urlResponse = await urlRes.body.json();
        const presignedUrl = urlResponse.presignedUrl;

        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: chunk,
          headers: { "Content-Type": "application/octet-stream" },
        });

        const etag = uploadResponse.headers.get("ETag");
        parts.push({
          PartNumber: partNumber,
          ETag: etag ? etag.replaceAll('"', "") : null,
        });
      }

      // 3. Complete
      const completeOp = post({
        apiName: "main",
        path: `/admin/upload-hero-videos/${institutionId}`,
        options: {
          body: {
            operation: "COMPLETE_VIDEO_UPLOAD",
            uploadId,
            key,
            parts,
          },
        },
      });
      const completeRes = await completeOp.response;
      const completeResponse = await completeRes.body.json();
      return completeResponse;
    } catch (error) {
      console.error("Error uploading hero video:", error);
      throw error;
    }
  };

  const updateHeroSection = async (data) => {
    try {
      const op = put({
        apiName: "awsaiapp",
        path: "/user/development-form/hero-page",
        options: { body: data },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error updating hero section:", error);
      throw error;
    }
  };

  const updateStaticData = async (institutionId, field, value) => {
    try {
      const op = put({
        apiName: "main",
        path: "/admin/update-static-data",
        options: {
          body: {
            institutionid: institutionId,
            field: field,
            value: value,
          },
        },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error(`Error updating static data (${field}):`, error);
      throw error;
    }
  };

  const updateServiceData = async (type, payload) => {
    try {
      const op = put({
        apiName: "main",
        path: `/admin/update-service-data?type=${type}`,
        options: { body: payload },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error updating service data:", error);
      throw error;
    }
  };

  const updateSubscription = async (institutionId, productId, payload) => {
    try {
      const op = put({
        apiName: "main",
        path: `/admin/update-subscription/${institutionId}/${productId}`,
        options: { body: payload },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  };

  const createSubscription = async (institutionId, payload, isPaypal) => {
    try {
      const endpoint = isPaypal
        ? `/admin/create-paypal-subscription/${institutionId}`
        : `/admin/create-subscription/${institutionId}`;
      const op = post({
        apiName: "main",
        path: endpoint,
        options: { body: payload },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  };

  const updateTestimonialData = async (payload) => {
    try {
      const op = put({
        apiName: "main",
        path: "/admin/update-testimonial-data",
        options: { body: payload },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error updating testimonial data:", error);
      throw error;
    }
  };

  const manageGalleryImage = async (action, institutionId, payload) => {
    try {
      let op;
      if (action === "upload") {
        op = post({
          apiName: "main",
          path: `/admin/upload-image/${institutionId}`,
          options: { body: payload },
        });
      } else if (action === "delete") {
        op = del({
          apiName: "main",
          path: `/admin/delete-image/${institutionId}`,
          options: { body: payload },
        });
      } else if (action === "edit") {
        op = put({
          apiName: "main",
          path: `/admin/edit-image/${institutionId}`,
          options: { body: payload },
        });
      }
      if (op) {
        const res = await op.response;
        return await res.body.json();
      }
    } catch (error) {
      console.error(`Error managing gallery image (${action}):`, error);
      throw error;
    }
  };

  const manageInstructor = async (action, payload) => {
    try {
      let op;
      if (action === "create") {
        op = post({
          apiName: "main",
          path: "/admin/create-user",
          options: { body: payload },
        });
      } else if (action === "promote") {
        op = put({
          apiName: "main",
          path: "/admin/member-to-instructor",
          options: { body: payload },
        });
      } else if (action === "put") {
        const { institutionId, cognitoId, data } = payload;
        op = put({
          apiName: "main",
          path: `/admin/put-instructor/${institutionId}/${cognitoId}`,
          options: { body: data },
        });
      } else if (action === "delete-instructor") {
        op = del({
          apiName: "main",
          path: `/admin/delete-instructor/${payload.institutionId}`,
          options: { body: { instructorId: payload.instructorId } },
        });
      } else if (action === "update") {
        if (payload.attributeName) {
          op = put({
            apiName: "main",
            path: `/instructor/attribute-update/${payload.institutionId}/${payload.attributeName}`,
            options: { body: payload.data },
          });
        } else {
          op = put({
            apiName: "main",
            path: "/admin/update-instructor-data",
            options: { body: payload },
          });
        }
      }
      if (op) {
        const res = await op.response;
        return await res.body.json();
      }
    } catch (error) {
      console.error(`Error managing instructor (${action}):`, error);
      throw error;
    }
  };

  const getLeaderboard = async (path) => {
    try {
      const op = get({ apiName: "main", path });
      const res = await op.response;
      const data = await res.body.json();
      try {
        const headerDate = res.headers?.get
          ? res.headers.get("date")
          : res.headers?.date;
        if (headerDate && data && typeof data === "object") {
          data._serverDate = headerDate;
        }
      } catch (_) {}
      return data;
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      throw error;
    }
  };

  const submitQuery = async (institutionId, payload) => {
    try {
      const op = put({
        apiName: "main",
        path: `/any/create-query/${institutionId}`,
        options: { body: payload },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error submitting query:", error);
      throw error;
    }
  };

  const getSchedule = async (institutionId) => {
    try {
      const op = get({
        apiName: "main",
        path: `/user/schedule/${institutionId}`,
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error getting schedule:", error);
      throw error;
    }
  };

  // ---- Class Notices (paste into ContextProvider.jsx, right after getSchedule) ----

  const getClassNotices = useCallback(async (institutionId, month) => {
    try {
      const targetInst =
        institutionId || userData?.institution || institutionData.InstitutionId;
      const now = new Date();
      const defaultMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;
      const queryMonth = month || defaultMonth;
      const op = get({
        apiName: "main",
        path: `/user/class-notice/${targetInst}`,
        options: { queryParams: { month: queryMonth } },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error getting class notices:", error);
      throw error;
    }
  }, [userData?.institution]);

  const createClassNotice = useCallback(async (institutionId, payload) => {
    try {
      const op = post({
        apiName: "main",
        path: `/admin/class-notice/${institutionId}`,
        options: { body: payload },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error creating class notice:", error);
      throw error;
    }
  }, []);

  const updateClassNotice = useCallback(async (institutionId, payload) => {
    try {
      const op = put({
        apiName: "main",
        path: `/admin/class-notice/${institutionId}`,
        options: { body: payload },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error updating class notice:", error);
      throw error;
    }
  }, []);

  const deleteClassNotice = useCallback(async (institutionId, date) => {
    try {
      const op = del({
        apiName: "main",
        path: `/admin/class-notice/${institutionId}/${date}`,
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error deleting class notice:", error);
      throw error;
    }
  }, []);

  const getUserProfile = async (institutionId) => {
    try {
      const op = get({
        apiName: "main",
        path: `/user/profile/${institutionId}`,
      });
      const res = await op.response;
      const data = await res.body.json();
      if (data) {
        setUserData((prev) => ({ ...prev, ...data }));
      }
      return data;
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  };

  const updatePayment = async (endpoint, payload) => {
    try {
      const op = put({
        apiName: "main",
        path: endpoint,
        options: { body: payload },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error updating payment:", error);
      throw error;
    }
  };

  const checkUserExist = async (institutionId, payload) => {
    try {
      const op = post({
        apiName: "main",
        path: `/any/user-exists/${institutionId}`,
        options: { body: payload },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error checking user existence:", error);
      throw error;
    }
  };

  const updateLoginDate = async (institutionId) => {
    try {
      const op = post({
        apiName: "main",
        path: `/user/logindate-update/${institutionId}`,
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error updating login date:", error);
      throw error;
    }
  };

  const signupUser = async (institutionId, payload, queryParams = {}) => {
    try {
      const op = post({
        apiName: "main",
        path: `/user/profile/${institutionId}`,
        options: {
          queryParams: queryParams,
          body: payload,
        },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error signing up user:", error);
      throw error;
    }
  };

  const phoneExist = async (institutionId, payload) => {
    try {
      const op = post({
        apiName: "main",
        path: `/any/phone-exists/${institutionId}`,
        options: { body: payload },
      });
      const res = await op.response;
      return await res.body.json();
    } catch (error) {
      console.error("Error checking phone existence:", error);
      throw error;
    }
  };

  const ContextData = {
    onAuthLoad,
    onUnauthLoad,
    isAuth,
    setIsAuth: setIsAuthFn,
    authInitialized,
    setAuthInitialized,
    userData,
    setUserData: setUserDataFn,
    util: {
      loader,
      setLoader: setLoaderFn,
    },
    upcomingClasses,
    setUpcomingClasses: setUpcomingClassesFn,
    previousClasses,
    setPreviousClasses: setPreviousClassesFn,
    userList,
    setUserList: setUserListFn,
    getUserList,
    productList,
    instructorList,
    setInstructorList: () => {},
    setProductList: () => {},
    getInstructorList,
    checkSubscriptionStatus,
    streakData,
    setStreakData: setStreakDataFn,
    ratings,
    setRatings: () => {},
    getImagesFromAPI,
    setTempImgSrc,
    tempImgSrc,
    imageUrls,
    setImageUrls,
    title,
    setTitle,
    description,
    setDescription,
    galleryData,
    setGalleryData,
    revenue,
    setRevenue,
    getCartItems,
    getPaymentHistory,
    cartState,
    setCartState,
    removeCartItem,
    addCartItem,
    setCartItems,
    paymentHistory,
    cartItems,
    itemCount,
    isProductInCart,
    userAttendance,
    setUserAttendance,
    getUserAttendance,
    videos,
    fetchVideos,
    setVideos,
    error,
    setError,
    loading,
    setLoading,
    playlists,
    fetchPlaylists,
    setPlaylists,
    errorPlaylist,
    setErrorPlaylist,
    loadingPlaylist,
    setLoadingPlaylist,
    loadingUpcoming,
    setLoadingUpcoming,
    loadingPrevious,
    setLoadingPrevious,
    loadingInstructors,
    setLoadingInstructors,
    lodingRatings,
    setLoadingRatings,
    lodingStreak,
    setLoadingStreak,
    filteredProductList,
    loadingUserList,
    setLoadingUserList,
    updateUserStatusRenew,
    setLoadingNav,
    loadingNav,
    deleteUser,
    getProductsAdmin,
    createUser,
    updateUser,
    updateAdminUserAttribute,
    changeUserPassword,
    createPresetSubscriptions,
    assignPaypalPlans,
    updateUserPayment,
    updateInstructor,
    instructorCashout,
    getInstructorAttendance,
    getInstructorProfileByReferral,
    getGenericInstructorList,
    queryAttendance,
    editScheduleName,
    putAttendance,
    addSchedule,
    getStreak,
    updateStreak,
    updateUserProfile,
    getUserAttendanceList,
    updateAchievement,
    cancelSubscription,
    pauseSubscription,
    fetchRazorpaySubscription,
    fetchPaymentHistory,
    submitInstructorRating,
    getCurrentClass,
    submitUserAttendance,
    deleteObject,
    updateInstructorAttribute,
    deleteFile,
    updateHybridPage,
    createShortLink,
    markAttendanceUser,
    updateScheduleRecording,
    cancelSubscriptionAdmin,
    pauseSubscriptionAdmin,
    processRefundPayment,
    getPendingRefundRequests,
    approveRefundRequest,
    rejectRefundRequest,
    reloadRevenue,
    getCashCollected,
    updateUserProfileImage,
    getBirthdayMessage,
    getProductsAny,
    updateUserAdmin,
    updateUserPaymentAdmin,
    sendEmail,
    getInstructorAttendanceAdmin,
    getMembers,
    addMember,
    updateMember,
    deleteMember,
    fetchRatingsAdmin,
    updateInstructorTestimonials,
    fetchVideosChoreography,
    deleteClassVideo,
    manageClassVideoUpload,
    searchVideos,
    fetchVideoBySongName,
    fetchAttendance,
    markUserAttendance,
    updateScheduleInstructor,
    markInstructorAttendance,
    getReferredMembers,
    getInstructorDashboard,
    getInstructorProfile,
    updateFooterData,
    uploadHeroVideos,
    updateHeroSection,
    updateStaticData,
    updateServiceData,
    updateSubscription,
    createSubscription,
    updateTestimonialData,
    manageGalleryImage,
    manageInstructor,
    getLeaderboard,
    submitQuery,
    getSchedule,
    getClassNotices,
    createClassNotice,
    updateClassNotice,
    deleteClassNotice,
    getUserProfile,
    updatePayment,
    checkUserExist,
    updateLoginDate,
    signupUser,
    phoneExist,
    uploadFile,
  };

  return (
    <Context.Provider value={ContextData}>{props.children}</Context.Provider>
  );
};

export { ContextProvider };
