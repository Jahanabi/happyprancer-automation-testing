import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BsBoxArrowRight } from "react-icons/bs";
import { signOut } from "aws-amplify/auth";
// import { API } from "../../../../Context/ContextProvider";
import Context from "../../../../Context/Context";
import InstitutionContext from "../../../../Context/InstitutionContext";
import institutionData from "../../../../constants";
import {
  FaUser,
  FaCalendarAlt,
  FaHistory,
  FaUsers,
  FaVideo,
  FaEdit,
  FaEnvelope,
  FaBars,
  FaTimes,
  FaUserPlus,
  FaTrophy,
} from "react-icons/fa";
import { GiStarsStack } from "react-icons/gi";
import { HeartPulse } from "lucide-react";
import { HiCurrencyDollar } from "react-icons/hi2";

const LeftBanner = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const Navigate = useNavigate();
  const location = useLocation();
  const UserCtx = useContext(Context);
  const InstitutionData = useContext(InstitutionContext).institutionData;

  const isAdmin = UserCtx.userData.userType === "admin";
  const isInstructor = UserCtx.userData.userType === "instructor";

  // Use ratings directly from Context
  const ratings = UserCtx.ratings || [];

  const getInitials = (name) => {
    if (!name) return "";
    const initials = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
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

  const ListItem = ({ icon, text, onClickFn, isActive }) => {
    return (
      <div
        className={`w-[90%] px-2 flex flex-row items-center rounded-md hover:bg-lighestPrimaryColor hover:bg-opacity-10 cursor-pointer ${
          isActive && `bg-lighestPrimaryColor bg-opacity-20 font-medium`
        }`}
        onClick={onClickFn}>
        <span className="px-2">{icon}</span>
        <li
          className={`px-1 py-2 ${
            isActive ? `font-semibold` : `font-medium`
          }`}>
          {text}
        </li>
      </div>
    );
  };

  const MobileMenuItem = ({ icon, text, onClickFn, isActive }) => {
    return (
      <div
        className={`w-full px-6 py-2 flex flex-row items-center cursor-pointer transition-all duration-200 ${
          isActive ? "bg-gray-50 border-r-3" : "hover:bg-gray-50"
        }`}
        style={{
          borderRightColor:
            isActive ? InstitutionData.PrimaryColor : "transparent",
        }}
        onClick={() => {
          onClickFn();
          setIsMobileMenuOpen(false);
        }}>
        <div
          className="mr-4 p-2 rounded-lg transition-colors duration-200"
          style={{
            backgroundColor:
              isActive
                ? `${InstitutionData.PrimaryColor}15`
                : "transparent",
            color:
              isActive ? InstitutionData.PrimaryColor : "#6B7280",
          }}>
          {icon}
        </div>
        <span
          className={`text-gray-800 text-sm ${
            isActive ? "font-semibold" : "font-medium"
          }`}>
          {text}
        </span>
      </div>
    );
  };

  const activePath = location.pathname;
  const paymentsOrRevenuePath = isAdmin ? "/revenue" : "/payments";

  const getDesktopActiveLabel = () => {
    if (activePath === "/dashboard") return "Upcoming Classes";
    if (activePath === "/previous") return "Previous Classes";
    if (activePath === "/choreography") return "Choreography";
    if (activePath === "/yoga-classes") return "Yoga Classes";
    if (activePath === "/ratings") return "Ratings";
    if (activePath === "/reward") return "Reward";
    if (activePath === "/members") return "Members";
    if (activePath === "/payments") return "Payments";
    if (activePath === "/revenue") return "Revenue";
    if (activePath === "/manage-members") return "Manage Members";
    if (activePath === "/referred-members") return "Referred Members";
    if (activePath === "/account") return "Account";
    return "";
  };

  const getMobileActiveLabel = () => {
    if (activePath === "/account") return "Profile Settings";
    return getDesktopActiveLabel();
  };

  const activeDesktopLabel = getDesktopActiveLabel();
  const activeMobileLabel = getMobileActiveLabel();

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut();
      setLoading(false);
      window.location.href = "/";
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Enhanced hamburger icon for mobile */}
      <div
        className={`fixed left-4 ${
          isMobileMenuOpen === true ? "top-10" : "mt-4"
        } z-[50] min1050:hidden`}>
        <button
          className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            borderColor: "#E5E7EB",
            backgroundColor: "white",
          }}>
          {isMobileMenuOpen ? (
            <svg
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4 4L16 16M16 4L4 16"
                stroke="#6B7280"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 5H17M3 10H17M3 15H17"
                stroke="#6B7280"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Enhanced mobile slide-in menu */}
      <div
        className={`fixed top-0 left-0 z-40 w-72 h-full bg-white shadow-2xl transform transition-transform duration-300 ease-out min1050:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        <div className="h-full overflow-y-visible">
          {/* Enhanced profile section */}
          <div className="hidden">
            <div className="flex items-center gap-4">
              {UserCtx.userData.imgUrl ? (
                <img
                  className="h-14 w-14 rounded-2xl object-cover shadow-md"
                  src={UserCtx.userData.imgUrl}
                  alt="profile"
                />
              ) : (
                <div
                  className="rounded-2xl h-14 w-14 flex items-center justify-center text-white text-lg font-semibold shadow-md"
                  style={{
                    backgroundColor: InstitutionData.PrimaryColor,
                  }}>
                  {getInitials(UserCtx.userData.userName)}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-gray-800 text-lg">
                  {UserCtx.userData.userName?.split(" ")[0]}
                </span>
                <span className="text-gray-500 text-sm font-medium">
                  Welcome back!
                </span>
                <div
                  className="mt-2 py-1 px-3 text-center rounded-full text-xs font-semibold capitalize shadow-sm"
                  style={{
                    backgroundColor: `${InstitutionData.PrimaryColor}15`,
                    color: InstitutionData.PrimaryColor,
                  }}>
                  {UserCtx.userData.userType}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced menu items */}
          <div className="mt-20">
            <MobileMenuItem
              icon={<FaCalendarAlt size={16} />}
              text="Upcoming Classes"
              isActive={activeMobileLabel === "Upcoming Classes"}
              onClickFn={() => Navigate("/dashboard")}
            />
            <MobileMenuItem
              icon={<FaHistory size={16} />}
              text="Previous Classes"
              isActive={activeMobileLabel === "Previous Classes"}
              onClickFn={() => Navigate("/previous")}
            />
            <MobileMenuItem
              icon={<FaVideo size={16} />}
              text="Choreography"
              isActive={activeMobileLabel === "Choreography"}
              onClickFn={() => Navigate("/choreography")}
            />
            <MobileMenuItem
              icon={<FaVideo size={16} />}
              text="Yoga Classes"
              isActive={activeMobileLabel === "Yoga Classes"}
              onClickFn={() => Navigate("/yoga-classes")}
            />
            {ratings.length >= 1 && (
              <MobileMenuItem
                icon={<GiStarsStack size={16} />}
                text="Ratings"
                isActive={activeMobileLabel === "Ratings"}
                onClickFn={() => Navigate("/ratings")}
              />
            )}
            <MobileMenuItem
              icon={<FaTrophy size={16} />}
              text="Reward"
              isActive={activeMobileLabel === "Reward"}
              onClickFn={() => Navigate("/reward")}
            />
            {isAdmin && (
              <MobileMenuItem
                icon={<FaUsers size={16} />}
                text="Members"
                isActive={activeMobileLabel === "Members"}
                onClickFn={() => Navigate("/members")}
              />
            )}
            {/* <MobileMenuItem
              icon={<HeartPulse size={16} />}
              text="Health Care"
              onClickFn={() => {
                setMobileClick("Health Care");
                displayAfterClick(10);
              }}
            /> */}
            {!isInstructor && (
              <MobileMenuItem
                icon={<HiCurrencyDollar size={16} />}
                text={isAdmin ? "Revenue" : "Payments"}
                isActive={activePath === paymentsOrRevenuePath}
                onClickFn={() => Navigate(paymentsOrRevenuePath)}
              />
            )}
            {/* {isAdmin && (
              <MobileMenuItem
                icon={<FaEdit size={16} />}
                text="Subscriptions"
                onClickFn={() => {
                  const baseUrl =
                    process.env.NODE_ENV === "development"
                      ? "http://localhost:3000"
                      : process.env.REACT_APP_STAGE === "PROD"
                      ? institutionData.PROD_DOMAIN
                      : institutionData.BETA_DOMAIN;

                  const url = `${baseUrl}/allpayment/${
                    institutionData.InstitutionId
                  }/${UserCtx.cognitoId}/${
                    UserCtx.emailId
                  }?primary=${encodeURIComponent(
                    InstitutionData.PrimaryColor.replace("#", "")
                  )}&secondary=${encodeURIComponent(
                    InstitutionData.SecondaryColor.replace("#", "")
                  )}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
              />
            )} */}

            {/* Account section */}
            <div className="mt-6">
              <div className="px-6 py-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Account
                </span>
              </div>

              {/* Manage Members menu item for mobile - show if user has members attribute */}
              {UserCtx.userData?.members > 0 && (
                <MobileMenuItem
                  icon={<FaUserPlus size={16} />}
                  text="Manage Members"
                  isActive={activeMobileLabel === "Manage Members"}
                  onClickFn={() => Navigate("/manage-members")}
                />
              )}

                {(isAdmin || isInstructor) && UserCtx.userData?.referral_code && (
                    <MobileMenuItem
                        icon={<FaUserPlus size={16} />}
                        text="Referred Members"
                        isActive={activeMobileLabel === "Referred Members"}
                        onClickFn={() => Navigate("/referred-members")}
                    />
                )}

              <MobileMenuItem
                icon={<FaUser size={16} />}
                text="Profile Settings"
                isActive={activeMobileLabel === "Profile Settings"}
                onClickFn={() => Navigate("/account")}
              />
              <MobileMenuItem
                icon={<FaEnvelope size={16} />}
                text="Contact Support"
                onClickFn={() => Navigate("/query")}
              />
            </div>

            {/* Enhanced logout section */}
            <div className="mt-8 mx-6">
              <button
                className="w-full fixed bottom-0 left-0 px-4 py-2 flex items-center justify-center gap-3 bg-red-50 hover:bg-red-100 border border-red-100 transition-all duration-200"
                onClick={handleLogout}
                disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin h-3 w-4 border-2 border-red-500 border-t-transparent"></div>
                    <span className="text-red-600 font-medium text-sm">
                      Signing out...
                    </span>
                  </>
                ) : (
                  <>
                    <BsBoxArrowRight size={16} className="text-red-500" />
                    <span className="text-red-600 font-medium text-sm">
                      Sign Out
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-30 min1050:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Desktop view remains unchanged */}
      <div
        className="text-[#E4E4E4] w-[18rem] pb-10 relative max1050:hidden"
        style={{ backgroundColor: InstitutionData.PrimaryColor }}>
        <nav>
          <div className="h-auto flex items-center gap-3 px-3 py-3">
            {UserCtx.userData.imgUrl ? (
              <img
                className="h-12 w-12 rounded-full bg-white"
                src={UserCtx.userData.imgUrl}
                alt="profile"
              />
            ) : (
              <div
                className={`rounded-full p-2 h-12 w-12 bg-gray-600 flex items-center justify-center text-[1rem] text-white`}
                style={{
                  backgroundColor: getColor(UserCtx.userData.userName),
                }}>
                {getInitials(UserCtx.userData.userName)}
              </div>
            )}

            <div className="m-0 p-0 text-lg font-semibold flex flex-col gap-2 mt-1">
              Hi👋, {UserCtx.userData.userName?.split(" ")[0]}
              <div className="flex justify-center items-center">
                <div
                  className=" bg-white py-0 px-2 text-center inline-block rounded-xl text-[0.75rem] font-medium capitalize "
                  style={{ color: InstitutionData.PrimaryColor }}>
                  {UserCtx.userData.userType}
                </div>
              </div>
            </div>
          </div>

          <span className="h-[1px] w-full bg-primaryColor block mb-3"></span>
          <ul className="flex flex-col gap-2 justify-center ml-0 list-none pl-0 items-center overflow-y-auto">
            <ListItem
              icon={<FaCalendarAlt size={18} />}
              text="Upcoming Classes"
              isActive={activeDesktopLabel === "Upcoming Classes"}
              onClickFn={() => Navigate("/dashboard")}
            />
            <ListItem
              icon={<FaHistory size={18} />}
              text="Previous Classes"
              isActive={activeDesktopLabel === "Previous Classes"}
              onClickFn={() => Navigate("/previous")}
            />
            <ListItem
              icon={<FaVideo size={18} />}
              text="Choreography"
              isActive={activeDesktopLabel === "Choreography"}
              onClickFn={() => Navigate("/choreography")}
            />
            <ListItem
              icon={<FaVideo size={18} />}
              text="Yoga Classes"
              isActive={activeDesktopLabel === "Yoga Classes"}
              onClickFn={() => Navigate("/yoga-classes")}
            />
            {ratings.length >= 1 && (
              <ListItem
                icon={<GiStarsStack size={18} />}
                text="Ratings"
                isActive={activeDesktopLabel === "Ratings"}
                onClickFn={() => Navigate("/ratings")}
              />
            )}
            <ListItem
              icon={<FaTrophy size={18} />}
              text="Reward"
              isActive={activeDesktopLabel === "Reward"}
              onClickFn={() => Navigate("/reward")}
            />
            {isAdmin && (
              <ListItem
                icon={<FaUsers size={18} />}
                text="Members"
                isActive={activeDesktopLabel === "Members"}
                onClickFn={() => Navigate("/members")}
              />
            )}
            {/* <ListItem
              icon={<HeartPulse size={18} />}
              text="Health Care"
              onClickFn={() => {
                setClick("Health Care");
                displayAfterClick(10);
              }}
            /> */}
            {!isInstructor && (
              <ListItem
                icon={<HiCurrencyDollar size={18} />}
                text={isAdmin ? "Revenue" : "Payments"}
                isActive={activePath === paymentsOrRevenuePath}
                onClickFn={() => Navigate(paymentsOrRevenuePath)}
              />
            )}

            {/* {isAdmin && (
              <ListItem
                icon={<FaEdit size={18} />}
                text="Subscriptions"
                onClickFn={() => {
                  const baseUrl =
                    process.env.NODE_ENV === "development"
                      ? "http://localhost:3000"
                      : process.env.REACT_APP_STAGE === "PROD"
                      ? institutionData.PROD_DOMAIN
                      : institutionData.BETA_DOMAIN;

                  const url = `${baseUrl}/allpayment/${
                    institutionData.InstitutionId
                  }/${UserCtx.cognitoId}/${
                    UserCtx.emailId
                  }?primary=${encodeURIComponent(
                    InstitutionData.PrimaryColor.replace("#", "")
                  )}&secondary=${encodeURIComponent(
                    InstitutionData.SecondaryColor.replace("#", "")
                  )}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
              />
            )} */}

            {/* Manage Members menu item for users with members attribute */}
            {UserCtx.userData?.members > 0 && (
              <ListItem
                icon={<FaUserPlus size={18} />}
                text="Manage Members"
                isActive={activeDesktopLabel === "Manage Members"}
                onClickFn={() => Navigate("/manage-members")}
              />
            )}

              {(isAdmin || isInstructor) && UserCtx.userData?.referral_code && (
                  <ListItem
                      icon={<FaUserPlus size={18} />}
                      text="Referred Members"
                      isActive={activeDesktopLabel === "Referred Members"}
                      onClickFn={() => Navigate("/referred-members")}
                  />
              )}

            <ListItem
              icon={<FaUser size={18} />}
              text="Account"
              isActive={activeDesktopLabel === "Account"}
              onClickFn={() => Navigate("/account")}
            />

            <ListItem
              icon={<FaEnvelope size={18} />}
              text="Contact us ?"
              onClickFn={() => Navigate("/query")}
            />
            <button
              className={`flex gap-1 items-center text-[1.1rem] w-[75%] font-bold text-white rounded-md cursor-pointer transition
    ${
      UserCtx.userData.userType === "member"
        ? "mt-36"
        : UserCtx.userData.userType === "instructor"
          ? "mt-48"
          : "mt-16"
    }`}
              onClick={handleLogout}
              disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3 w-2 border-b-2 border-white"></div>
                  <p className="ml-2 text-sm max1050:font-[400] mb-0">
                    Logging out...
                  </p>
                </div>
              ) : (
                <>
                  <BsBoxArrowRight
                    size={"1.5rem"}
                    className="mr-2 text-white"
                  />
                  <p className="text-sm max1050:font-[400] mb-0">Logout</p>
                </>
              )}
            </button>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default LeftBanner;
