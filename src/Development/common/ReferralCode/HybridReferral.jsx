import { animated, useSpring } from "@react-spring/web";
import React, { useContext, useEffect, useState } from "react";
import Context from "../../Context/Context";
import InstitutionContext from "../../Context/InstitutionContext";
import copy from "../../utils/Png/copy.png";
import Facebook from "../../utils/Png/Facebook.svg";
import share from "../../utils/Png/share.png";
import Telegram from "../../utils/Png/Telegram.svg";
import Twitter from "../../utils/Png/Twitter.svg";
import Whatsapp from "../../utils/Png/Whatsapp.svg";
// import { API } from "../../Context/ContextProvider";
import institutionData from "../../constants";

function HybridReferral() {
  const { userData, getReferredMembers } = useContext(Context);
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const [shareClicked, setShareClicked] = useState(false);
  const [members, setMembers] = useState(0);
  let domain;

  if (typeof window !== "undefined" && window.location?.origin) {
    domain = window.location.origin;
  } else if (process.env.NODE_ENV === "development") {
    domain = "http://localhost:3000";
  } else if (process.env.REACT_APP_STAGE === "DEV") {
    domain = "https://beta.happyprancer.com";
  } else if (process.env.REACT_APP_STAGE === "PROD") {
    domain = "https://happyprancer.com";
  }

  let referralLink;
  if (userData.userType === "instructor") {
    referralLink = `${domain}/hybrid/?institution=${userData.institution}&referral=${userData.referral_code}`;
  } else if (userData.userType === "admin") {
    referralLink = `${domain}/signup?referral=${userData.institution}`;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    alert("Referral link copied to clipboard!");
  };

  const handleShare = () => {
    setShareClicked(!shareClicked);
  };

  const shareMessage = `I'm inviting you to join ${InstitutionData.InstitutionId}. Just click the link below.\n${referralLink}`;

  const handleSocialShare = (platform) => {
    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          referralLink,
        )}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareMessage,
        )}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(
          referralLink,
        )}&text=${encodeURIComponent(shareMessage)}`;
        break;
      default:
        break;
    }
    window.open(url, "_blank");
  };
  useEffect(() => {
    async function fetchReferralData() {
      try {
        const response = await getReferredMembers(userData.referral_code);
        const hybridCount =
          response?.counts?.hybrid ??
          response?.hybridMembers?.length ??
          (response?.referredMembers || []).filter(
            (m) =>
              m.isHybrid === true ||
              m.hybridPageUser === true ||
              m.memberType === "hybrid" ||
              m.registrationSource === "hybrid" ||
              m.subscriptionType === "hybrid"
          ).length;
        setMembers(hybridCount);
      } catch (error) {
        console.error("Error fetching referral data:", error);
      }
    }
    fetchReferralData();
  }, [userData.referral_code]);

  const { number } = useSpring({
    from: { number: 0 },
    number: members,
    delay: 200,
    config: { duration: 1000 },
  });

  return (
    <div className="Poppins w-full flex flex-col justify-center items-center">
      <div className="flex mt-4 gap-4">
        <div
          className={`w-[85%] max1050:w-[100%] max-w-[40rem] p-7 flex flex-col items-center max536:w-[90%] relative bg-[#ffffffe1]`}
          style={{
            boxShadow: `0 0px 12px ${InstitutionData.LightestPrimaryColor}`,
          }}>
          <div className="text-[1.1rem] font-[600] w-[95%]">
            Share your link and earn exciting bonuses for every new member who
            joins!
          </div>
          <div className="flex gap-1 items-center mt-3">
            <div
              className="w-[87%] p-2 bg-[#f1f1f1a1] font-[500] border-[1.4px] border-[#808080]"
              style={{
                color: InstitutionData.PrimaryColor,
              }}>
              <div className="text-[0.95rem] font-[500] py-[3px]">
                {referralLink}
              </div>
            </div>
            <div
              className="flex flex-col font-[500] gap-1 -mb-8 cursor-pointer"
              onClick={handleCopy}>
              <div className="bg-white shadow-md p-[8px] flex items-center justify-center">
                <img src={copy} alt="Copy" />
              </div>
              <p className="text-[0.7rem] text-center">copy</p>
            </div>
            <div
              className="flex flex-col font-[500] gap-1 -mb-8 cursor-pointer"
              onClick={handleShare}>
              <div className="bg-white shadow-md p-[11px] flex items-center justify-center">
                <img src={share} alt="Share" />
              </div>
              <p className="text-[0.7rem] text-center">share</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="w-[15rem] bg-white shadow-md h-[50%]">
            <div
              className="text-center text-white "
              style={{ backgroundColor: InstitutionData.PrimaryColor }}>
              MEMBERS
            </div>
            <animated.div
              className="text-[2rem] p-2 text-center font-bold Inter"
              style={{ color: InstitutionData.PrimaryColor }}>
              {number.to((n) => n.toFixed(0))}
            </animated.div>
          </div>
          <div className="w-[15rem] bg-white shadow-sm h-[50%]">
            <div
              className="text-center text-white "
              style={{ backgroundColor: InstitutionData.PrimaryColor }}>
              EARNINGS
            </div>
            <div
              className="text-[1.8rem] p-2 h-full text-center font-bold Inter"
              style={{ color: InstitutionData.PrimaryColor }}>
              ₹ {userData.bonus / 100 || 0}
            </div>
          </div>
        </div>
      </div>
      {shareClicked && (
        <div
          className={`bg-[#ffffff] mt-3 mb-4 flex flex-col items-center px-5 p-2 fade-down`}
          style={{ boxShadow: "0 0 8px rgba(0, 0, 0, 0.2)" }}>
          <div className="flex justify-center items-center gap-5">
            <div
              className="flex flex-col gap-[2px] items-center cursor-pointer"
              onClick={() => handleSocialShare("whatsapp")}>
              <img width={27} src={Whatsapp} alt="WhatsApp" />
              <p className="font-[400] text-gray-500 text-[0.7rem] text-center mb-0">
                whatsapp
              </p>
            </div>
            <div
              className="flex flex-col gap-[2px] items-center cursor-pointer"
              onClick={() => handleSocialShare("facebook")}>
              <img width={27} src={Facebook} alt="Facebook" />
              <p className="font-[400] text-gray-500 text-[0.7rem] text-center mb-0">
                facebook
              </p>
            </div>
            <div
              className="flex flex-col gap-[2px] items-center cursor-pointer"
              onClick={() => handleSocialShare("twitter")}>
              <img width={27} src={Twitter} alt="Twitter" />
              <p className="font-[400] text-gray-500 text-[0.7rem] text-center mb-0">
                twitter
              </p>
            </div>
            <div
              className="flex flex-col gap-[2px] items-center cursor-pointer"
              onClick={() => handleSocialShare("telegram")}>
              <img width={27} src={Telegram} alt="Telegram" />
              <p className="font-[400] text-gray-500 text-[0.7rem] text-center mb-0">
                telegram
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HybridReferral;
