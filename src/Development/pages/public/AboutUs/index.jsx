// pages/AboutUs/AboutUs.jsx
import React, { useContext, useEffect, useState } from "react";
import NavBar from "../../../components/Header";
import Footer from "../../../components/Footer";
import Context from "../../../Context/Context";
import { useNavigate } from "react-router-dom";
import InstitutionContext from "../../../Context/InstitutionContext";
import TextEditor from "../../../common/TextEditor/TextEditor";
import "./AboutUs.css";
// import { API } from "../../../Context/ContextProvider";
import { toast } from "react-toastify";
import { FaPencilAlt } from "react-icons/fa";
import { MdCancel } from "react-icons/md";

const AboutUs = () => {
  const { institutionData } = useContext(InstitutionContext);
  const productId = institutionData?.productId;
  console.log("productId: " + productId);
  const UserCtx = useContext(Context).userData;
  const navigate = useNavigate();
  const { isAuth } = useContext(Context);
  const [editing, setEditing] = useState(false);
  const { updateStaticData } = useContext(Context);
  const util = useContext(Context).util;
  const folder = `${institutionData?.InstitutionId}/about-us-image`;

  const [aboutUsContent, setAboutUsContent] = useState(
    institutionData?.AboutUs || "",
  );
  const [savedContent, setSavedContent] = useState(
    institutionData?.AboutUs || "",
  );

  // console.log(aboutUsContent)

  const setPadding = () => {
    const tags = document.querySelectorAll("span");
    tags.forEach((tag) => {
      if (tag.style.backgroundColor) {
        tag.style.paddingTop = "4px";
        tag.style.paddingBottom = "4px";
        tag.style.paddingLeft = "7px";
        tag.style.paddingRight = "7px";
      }
    });
  };

  useEffect(() => {
    setPadding();

    const contentContainer = document.querySelector(".about-us-content");

    if (!contentContainer) return;

    const observer = new MutationObserver(() => {
      setPadding();
    });

    observer.observe(contentContainer, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [aboutUsContent, savedContent]);

  useEffect(() => {
    if (!institutionData?.AboutUs) return;
    let data = "";
    if (Array.isArray(institutionData.AboutUs)) {
      data = Array.isArray(institutionData.AboutUs)
        ? institutionData.AboutUs.map((item) => {
            if (item.title || item.content) {
              return `<h2>${item.title || null}</h2><p>${
                item.content || null
              }</p>`;
            }
            return "";
          }).join("")
        : "";
    } else {
      data = institutionData.AboutUs;
    }

    setAboutUsContent(data);
    setSavedContent(data);
  }, [institutionData.AboutUs]);

  const handleButtonClick = () => {
    if (isAuth) {
      navigate("/dashboard");
    } else {
      navigate("/SignUp");
    }
  };

  const handleSave = async () => {
    setSavedContent(aboutUsContent);
    try {
      util.setLoader(true);
      await updateStaticData(
        institutionData.InstitutionId,
        "AboutUs",
        aboutUsContent,
      );
      toast.success("About Us content updated successfully");
      setEditing(false);
    } catch (e) {
      util.setLoader(false);
      console.log(e.message);
      toast.error("Failed to update About Us content");
    } finally {
      util.setLoader(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="flex bg-[#E8FFFC] flex-col items-center pt-4 lg:pt-7 px-4 sm:px-6">
        <div
          className="w-full max-w-[82vw] sm:max-w-[90vw] lg:max-w-[82vw] mt-[2rem] sm:mt-[1rem]"
          style={{
            "--primary-color": institutionData?.PrimaryColor || "#4A90E2",
            "--primary-text-color": "#333",
          }}
        >
          <div className="flex justify-center items-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-center text-[#03413A]">
              About Us
            </h1>
          </div>

          {isAuth && UserCtx?.userType === "admin" && (
            <div className="edit-button-container">
              <button
                className="edit-button text-white"
                style={{
                  backgroundColor: institutionData?.LightPrimaryColor,
                }}
                onClick={() => setEditing((prev) => !prev)}
              >
                {editing ? (
                  <span className="flex items-center justify-center">
                    <MdCancel className="mr-2" />
                    Cancel
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <FaPencilAlt className="mr-2" />
                    Edit
                  </span>
                )}
              </button>
            </div>
          )}

          {UserCtx.userType === "admin" && editing && (
            <TextEditor
              value={aboutUsContent}
              onChange={setAboutUsContent}
              setEditing={setEditing}
              onSave={handleSave}
              folder={folder || ""}
              editorClassName="h-[90dvh] sm:h-[70dvh] max600:h-[50rem] text-gray-800 leading-relaxed text-base sm:text-lg lg:text-[1.2rem] w-full about-us-content"
              saveButtonStyle={{
                backgroundColor: institutionData?.LightPrimaryColor,
              }}
            />
          )}

          {editing === false && (
            // Display Saved Content
            <div
              className="about-us-content mt-5 text-gray-800 leading-relaxed text-base sm:text-lg lg:text-[1.2rem]"
              dangerouslySetInnerHTML={{
                __html: savedContent || "<p>No content available.</p>",
              }}
            />
          )}
        </div>

        {/* Call-to-Action Button */}
        {productId === "1000007" && (
          <div className="flex justify-center mt-[20px] mb-8 px-4">
            <button
              className="w-full max-w-[15rem] sm:w-[15rem] text-white px-6 sm:px-12 py-2 sm:py-3 rounded-[8px] h-[2.5rem] sm:h-[3rem] text-base sm:text-[1.2rem] tracking-[0.8px] hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: institutionData?.LightPrimaryColor,
              }}
              onClick={handleButtonClick}
            >
              {isAuth ? "Dashboard" : "Sign Up Now"}
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default AboutUs;
