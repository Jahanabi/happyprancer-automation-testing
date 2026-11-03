// Packages
import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import institutionContext from "../../Context/InstitutionContext";
import Context from "../../Context/Context";
//import { useSelector } from "react-redux";

const AuthBar = ({ content }) => {
  const { PrimaryColor } = useContext(institutionContext).institutionData;
  const { loadingNav } = useContext(Context);
  const height = "h-8";

  return (
    <div className={height}>
      <div
        className={`flex flex-row gap-4 items-center justify-end
          fixed z-50 w-full pr-12 ${height}`}
        style={{ backgroundColor: PrimaryColor }}
      >
        {loadingNav ? (
          <div className="flex items-center space-x-1.5 bg-[#37978259] backdrop-blur-xl rounded-full px-3 py-1 shadow-sm">
            <span className="text-white text-sm font-medium">Checking Authentication</span>
            <div className="flex space-x-0.5">
              <div
                className="w-1.5 h-1.5 bg-white rounded-full animate-[dotDotDot_1.5s_infinite_ease-in-out]"
                style={{ animationDelay: '0s' }}
              ></div>
              <div
                className="w-1.5 h-1.5 bg-white rounded-full animate-[dotDotDot_1.5s_infinite_ease-in-out]"
                style={{ animationDelay: '0.3s' }}
              ></div>
              <div
                className="w-1.5 h-1.5 bg-white rounded-full animate-[dotDotDot_1.5s_infinite_ease-in-out]"
                style={{ animationDelay: '0.6s' }}
              ></div>
            </div>
          </div>

        ) : (
          content.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                [
                  isActive ? "text-white" : "text-stone-300",
                  "text-md font-bold text-decoration-none hover:text-stone-100",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))
        )}
      </div>
    </div>
  );
};

export default AuthBar;
