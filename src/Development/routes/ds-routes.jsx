// Packages
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import React, { useContext, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
// Local
import Home from "../pages/public/Home";
import About from "../pages/public/AboutUs";
import Instructor from "../pages/public/Instructors";
import MacyClasses from "../pages/public/MacyClasses";
import Error from "../pages/Error";
import Logout from "../pages/Auth/Logout";
import DashBoard from "../pages/private/Dashboard";
import Meeting from "../pages/private/Meeting";
import Query from "../pages/public/Query";
import Gallery from "../pages/public/Gallery";
import Schedule from "../pages/public/Schedule";
import Leaderboard from "../pages/public/Leaderboard";
import PrivacyPolicy from "../pages/public/PrivacyPolicy";
import Terms from "../pages/public/Terms";
import Refund from "../pages/public/Refund";
import Attendance from "../pages/private/Attendance";
import Subscriptions from "../pages/private/Subscriptions";
import PaymentSuccessful from "../pages/private/PaymentSuccessful";
import PaymentFailed from "../pages/private/PaymentFailed";
import Rating from "../pages/private/Rating";
import PutAttendance from "../pages/private/PutAttendance";
import DevAuth from "../pages/Auth/dev";
import Redirect from "../pages/Auth/Login/Redirect";
import Login from "../pages/Auth/Login";
import Signup from "../pages/Auth/Signup";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import QR from "../pages/private/PutAttendance/QR";
// import HomePayment from "../CommonPayment/HomePayment";
import PaymentError from "../pages/PaymentError";
import PhoneAuth from "../pages/Auth/phone";
import InstitutionContext from "../Context/InstitutionContext";
import AppContext from "../Context/Context";
import DevSubscription from "../pages/public/Home/DevSubscription";
import PlanSubscription from "../pages/public/Home/PlanSubscription";

// import Cafepayment from "../CommonPayment/Cafe/Cafepayment";
import PhoneUpdate from "../pages/private/PhoneUpdate";
import InstructorCalendarPage from "../pages/private/Dashboard/UsersList/InstructorCalendarPage";
import CombinedHybridPage from "../pages/private/HybridPage/index";
import TestingPayment from "../pages/public/Home/TestingPayment";
import UpcomingSessions from "../pages/private/Dashboard/UpcomingSessions";
import PreviousSessions from "../pages/private/Dashboard/PreviousSessions";
import Choreography from "../pages/private/Dashboard/Choreography";
import ProfileUpdate from "../pages/private/Dashboard/ProfileUpdate";
import UsersList from "../pages/private/Dashboard/UsersList";
import DashboardRating from "../pages/private/Dashboard/DashboardRating";
import Reward from "../pages/private/Dashboard/Rewards/Rewards";
import Payments from "../pages/private/Dashboard/Billing";
import Revenue from "../pages/private/Dashboard/Revenue";
import MemberManagement from "../pages/private/Dashboard/MemberManagement";
import MacyVideosSidebar from "../components/Macy/MacyVideosSidebar";
import ReferredMembersList from "../pages/private/Dashboard/InstructorActivityTabs/ReferredMembersList";
import HealthCare from "../pages/private/Dashboard/HealthCare";
import AuthLoadingOverlay from "../components/AuthLoadingOverlay";
//const Navigate = ({to}) => {
//  const navigate = useNavigate();
//  useEffect(() => {
//    navigate(to);
//  }, [])
//  return (
//    <div></div>
//  )
//}

// Code
const ProtectedRoute = ({ children }) => {
  const { isAuth, authInitialized } = useContext(AppContext);
  const location = useLocation();
  if (!authInitialized) return <AuthLoadingOverlay />;
  // If user is authenticated, render the requested route
  if (isAuth) return children;
  // Otherwise redirect to login and preserve the attempted location
  return <Navigate to="/login" state={{ from: location }} replace />;
};

const ReferredMembersRoute = () => {
  const { userData, authInitialized, isUserDataLoaded } = useContext(AppContext);

  // Avoid rendering incorrect role dashboard while auth or user state is resolving
  if (!authInitialized || (isUserDataLoaded !== undefined && !isUserDataLoaded && !userData?.userType)) {
    return <AuthLoadingOverlay />;
  }

  const userType = String(userData?.userType || "").toLowerCase();

  // Instructors access their activity and referred members directly on /dashboard
  if (userType === "instructor") {
    return <Navigate to="/dashboard" replace />;
  }

  // Administrators view their referred members list
  if (userType === "admin") {
    return (
      <div className="Poppins w-full flex flex-col items-center px-4 py-4">
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Referred Members
            </h2>
          </div>
          <ReferredMembersList />
        </div>
      </div>
    );
  }

  // Students, members, or other unauthorized roles are redirected away
  return <Navigate to="/dashboard" replace />;
};



const getRouteTitle = (pathname) => {
  const path = (pathname || "").toLowerCase().split("?")[0].replace(/\/+$/, "") || "/";
  const staticTitles = {
    "/": "HappyPrancer | Live Yoga, Zumba & Dance Fitness",
    "/aboutus": "About Us | HappyPrancer",
    "/instructor": "Meet Our Instructors | HappyPrancer",
    "/gallery": "Gallery | HappyPrancer",
    "/schedule": "Class Schedule | HappyPrancer",
    "/leaderboard": "Leaderboard | HappyPrancer",
    "/privacypolicy": "Privacy Policy | HappyPrancer",
    "/terms": "Terms of Service | HappyPrancer",
    "/refund": "Cancellation & Refund Policy | HappyPrancer",
    "/login": "Sign In | HappyPrancer",
    "/signup": "Join HappyPrancer | Sign Up",
    "/forgotpassword": "Reset Password | HappyPrancer",
    "/subscription": "Plans & Membership | HappyPrancer",
    "/subscriptions": "Plans & Membership | HappyPrancer",
    "/hybrid": "Hybrid Training | HappyPrancer",
    "/query": "Contact & Support | HappyPrancer",
    "/meeting": "Live Class Session | HappyPrancer",
  };

  if (staticTitles[path]) return staticTitles[path];
  if (path.startsWith("/hybrid")) return "Hybrid Training | HappyPrancer";
  if (path.startsWith("/subscribe")) return "Plans & Membership | HappyPrancer";
  if (path.startsWith("/instructor-calendar")) return "Instructor Schedule | HappyPrancer";
  if (
    path.startsWith("/dashboard") ||
    path.startsWith("/previous") ||
    path.startsWith("/choreography") ||
    path.startsWith("/yoga-classes") ||
    path.startsWith("/ratings") ||
    path.startsWith("/reward") ||
    path.startsWith("/members") ||
    path.startsWith("/payments") ||
    path.startsWith("/revenue") ||
    path.startsWith("/manage-members") ||
    path.startsWith("/referred-members") ||
    path.startsWith("/account") ||
    path.startsWith("/health-care") ||
    path.startsWith("/qr") ||
    path.startsWith("/macy-classes") ||
    path.startsWith("/paymentsuccessful") ||
    path.startsWith("/paymentfailed")
  ) {
    return "Member Dashboard | HappyPrancer";
  }
  return "HappyPrancer | Live Yoga, Zumba & Dance Fitness";
};

const RoutesContainer = () => {
  const institutionData = useContext(InstitutionContext).institutionData;
  const { productId } = institutionData;
  const location = useLocation();

  const currentTitle = useMemo(
    () => getRouteTitle(location.pathname),
    [location.pathname]
  );

  useEffect(() => {
    window.google?.accounts.id.cancel();
    document.title = currentTitle;
  }, [location.pathname, currentTitle]);

  return (
    <>
      <Helmet>
        <title>{currentTitle}</title>
      </Helmet>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/aboutus" element={<About />} />
      <Route path="/instructor" element={<Instructor />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/privacypolicy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/refund" element={<Refund />} />
      {productId !== "1000008" && (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
        </>
      )}
      {productId === "1000007" && <Route path="/signup" element={<Signup />} />}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }>
        <Route index element={<UpcomingSessions />} />
      </Route>
      <Route
        path="/previous"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }>
        <Route index element={<PreviousSessions />} />
      </Route>
      <Route
        path="/choreography"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }>
        <Route index element={<Choreography />} />
      </Route>
      <Route
        path="/yoga-classes"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }>
        <Route
          index
          element={
            <div className="p-4">
              <MacyVideosSidebar
                prefix={`happyprancer/videos/macy-videos/`}
                bucket={
                  process.env.REACT_APP_VIDEO_BUCKET ||
                  institutionData?.VideoBucket
                }
              />
            </div>
          }
        />
      </Route>
      <Route
        path="/ratings"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }>
        <Route
          index
          element={
            <div>
              <DashboardRating />
            </div>
          }
        />
      </Route>
      <Route
        path="/reward"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }>
        <Route index element={<Reward />} />
      </Route>
      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }>
        <Route index element={<UsersList />} />
      </Route>
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }>
        <Route index element={<Payments />} />
      </Route>
      <Route
        path="/revenue"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }>
        <Route index element={<Revenue />} />
      </Route>
      <Route
        path="/manage-members"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }>
        <Route index element={<MemberManagement />} />
      </Route>
      <Route
        path="/referred-members"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }>
        <Route index element={<ReferredMembersRoute />} />
      </Route>
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }>
        <Route index element={<ProfileUpdate />} />
      </Route>
      <Route
        path="/health-care"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }>
        <Route index element={<HealthCare />} />
      </Route>
      <Route
        path="/instructor-calendar/:id"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }>
        <Route index element={<InstructorCalendarPage />} />
      </Route>
      <Route path="/meeting" element={<Meeting />} />
      <Route path="/query" element={<Query />} />
      <Route
        path="/qr"
        element={
          <ProtectedRoute>
            <Attendance />
          </ProtectedRoute>
        }
      />
      <Route path="/subscription" element={<Subscriptions />} />
      <Route path="/subscribe/:productId" element={<PlanSubscription />} />
      <Route
        path="/macy-classes"
        element={
          <ProtectedRoute>
            <MacyClasses />
          </ProtectedRoute>
        }
      />
      <Route path="/hybrid" element={<CombinedHybridPage />} />
      <Route
        path="/paymentsuccessful"
        element={
          <ProtectedRoute>
            <PaymentSuccessful />
          </ProtectedRoute>
        }
      />
      <Route
        path="/paymentfailed"
        element={
          <ProtectedRoute>
            <PaymentFailed />
          </ProtectedRoute>
        }
      />
      <Route path="/payment-error" element={<PaymentError />} />
      <Route
        path="/rating"
        element={
          <ProtectedRoute>
            <Rating />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auth"
        element={
          process.env.REACT_APP_STAGE === "PROD" ? <Error /> : <DevAuth />
        }
      />
      <Route path="/test-payment" element={<TestingPayment />} />
      <Route
        path="/put-attendance"
        element={
          <ProtectedRoute>
            <PutAttendance />
          </ProtectedRoute>
        }
      />
      <Route path="/attendance-qr" element={<QR />} />
      <Route path="/redirect" element={<Redirect />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="*" element={<Error />} />
      <Route path="/dev-subscription" element={<DevSubscription />} />
      <Route path="/phone-update" element={<PhoneUpdate />} />
    </Routes>
    </>
  );
};

export default RoutesContainer;
