import { useContext } from "react";
import { useLocation } from "react-router-dom"; // Add this import
import institutionContext from "../../Context/InstitutionContext";
import Context from "../../Context/Context";
import NavBar from "./NavBar";

const Header = () => {
  const { isAuth, userData } = useContext(Context);
  // const { imgUrl, userName, status, userType } = userData;

  const { productId } = useContext(institutionContext).institutionData;

  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const isHybridQuery = urlParams.get('hybrid') === 'true';
  const isHybridPath = location.pathname.includes('/hybrid');
  const shouldHideAuthBar = !isAuth && (isHybridQuery || isHybridPath);



  let authBarContent = [];

  // Hide AuthBar if hybrid=true in URL
  if (shouldHideAuthBar) {
    authBarContent = [];
  } else if (productId === "1000008") { // Basic Plan
    authBarContent = [];
  } else if (productId === "1000009") { // Standard Plan
    authBarContent = isAuth
      ? [
        { label: "Dashboard", path: "/dashboard" },
      ]
      : [
        { label: "Login", path: "/login" },
      ];
  } else if (productId === "1000007") { // Advanced Plan
    authBarContent = isAuth
      ? [
        { label: "Dashboard", path: "/dashboard" },
      ]
      : [
        { label: 'Login', path: '/login' },
        { label: process.env.REACT_APP_STAGE !== 'PROD' && 'DEV', path: "/auth" },
      ];
  }

  const navBarContent = [
    { label: "About Us", path: "/aboutus" },
    { label: "Instructor", path: "/instructor" },
    { label: "Gallery", path: "/gallery" },
    { label: "Leaderboard", path: "/leaderboard" },
    { label: "Schedule", path: "/schedule" },

  ];

  return (
    <header className="z-50">
      <NavBar content={navBarContent} authContent={authBarContent} />
    </header>
  );
};

export default Header;