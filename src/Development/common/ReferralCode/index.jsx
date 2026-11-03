import React, { useContext, useEffect, useState } from "react";
import { useSpring, animated } from "@react-spring/web";
import Context from "../../Context/Context";
import InstitutionContext from "../../Context/InstitutionContext";
import copy from "../../utils/Png/copy.png";
import share from "../../utils/Png/share.png";
import Telegram from "../../utils/Png/Telegram.svg";
import Twitter from "../../utils/Png/Twitter.svg";
import Facebook from "../../utils/Png/Facebook.svg";
import Whatsapp from "../../utils/Png/Whatsapp.svg";
import { Modal, Table } from "flowbite-react";
import PaginationComponent from "../Pagination";

function ReferralCode() {
  const { userData, setUserData, getReferredMembers, getInstructorProfile } =
    useContext(Context);
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const [shareClicked, setShareClicked] = useState(false);
  const [members, setMembers] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [memberDetails, setMemberDetails] = useState([]);
  const [paymentLogs, setPaymentLogs] = useState([]);
  const [earningsModal, setEarningsModal] = useState(false);
  const [currentEarningsPage, setCurrentEarningsPage] = useState(1);
  const [earningsPerPage] = useState(5);

  const { number } = useSpring({
    from: { number: 0 },
    to: { number: members },
    config: { tension: 200, friction: 20 },
  });

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
    referralLink = `${domain}/signup?referral=${userData.referral_code}`;
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
        const normalCount =
          response?.counts?.normal ??
          response?.normalMembers?.length ??
          (response?.referredMembers || []).filter(
            (m) =>
              !m.isHybrid &&
              !m.hybridPageUser &&
              String(m.memberType || "").toLowerCase() !== "hybrid" &&
              String(m.registrationSource || "").toLowerCase() !== "hybrid"
          ).length;
        setMembers(normalCount);

        const resp2 = await getInstructorProfile(
          InstitutionData.InstitutionId,
          userData.referral_code,
        );
        const bonus = resp2?.bonus ?? 0;

        // update bonus in context
        setUserData((prev) => ({ ...prev, bonus }));
        setPaymentLogs(resp2?.instructorProfile?.cashoutLogs);
      } catch (error) {
        console.error(error);
      }
    }

    fetchReferralData();
  }, [userData.referral_code]);

  const fetchMemberDetails = async () => {
    try {
      const response = await getReferredMembers(userData.referral_code);
      const list =
        response?.normalMembers?.length
          ? response.normalMembers
          : (response?.referredMembers || []).filter(
              (m) =>
                !m.isHybrid &&
                !m.hybridPageUser &&
                String(m.memberType || "").toLowerCase() !== "hybrid" &&
                String(m.registrationSource || "").toLowerCase() !== "hybrid"
            );

      setMemberDetails(list);

      setShowModal(true);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const displayModal = async () => {
    setEarningsModal(true);
  };

  const indexOfLastEarning = currentEarningsPage * earningsPerPage;
  const indexOfFirstEarning = indexOfLastEarning - earningsPerPage;
  const currentEarnings =
    paymentLogs?.slice(indexOfFirstEarning, indexOfLastEarning) || [];
  const totalEarningsPages = Math.ceil(
    (paymentLogs?.length || 0) / earningsPerPage,
  );
  const dateLocale =
    userData?.location?.countryCode === "IN" ? "en-IN" : "en-US";

  return (
    <div className="Poppins w-full flex flex-col justify-center items-center">
      <div className="flex mt-4 gap-4 max600:flex-col items-center justify-center">
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
              className="flex items-center justify-between text-white px-4 py-2"
              style={{ backgroundColor: InstitutionData.PrimaryColor }}>
              <span className="text-center w-full">MEMBERS</span>
              <button onClick={fetchMemberDetails} className="ml-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
              </button>
            </div>

            <animated.div
              className="text-[2rem] p-2 text-center font-bold Inter"
              style={{ color: InstitutionData.PrimaryColor }}>
              {number.to((n) => n.toFixed(0))}
            </animated.div>

            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-lg overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-800">
                      Referred Members
                    </h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-gray-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>

                  {/* Body */}
                  <div className="max-h-80 overflow-y-auto">
                    {memberDetails.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {memberDetails.map((member, index) => (
                          <li
                            key={index}
                            className="px-4 py-3 hover:bg-gray-50">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <div className="mb-1 sm:mb-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {member.userName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {member.emailId}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600">
                                {member.phoneNumber}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="py-8 px-4 text-center">
                        <p className="text-gray-500">
                          No referred members found.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 bg-gray-50 text-right">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-3 py-1.5 text-white text-sm rounded-md"
                      style={{ backgroundColor: InstitutionData.PrimaryColor }}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-[15rem] bg-white shadow-md h-[50%]">
            <div
              className="flex items-center justify-between text-white px-4 py-2"
              style={{ backgroundColor: InstitutionData.PrimaryColor }}>
              <span className="text-center w-full">EARNINGS</span>
              <button onClick={displayModal} className="ml-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
              </button>
            </div>
            <animated.div
              className="text-[2rem] p-2 text-center font-bold Inter"
              style={{ color: InstitutionData.PrimaryColor }}>
              ₹ {userData.bonus / 100 || 0}
            </animated.div>
          </div>

          {earningsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-800">
                    Earnings History
                  </h3>
                  <button
                    onClick={() => setEarningsModal(false)}
                    className="text-gray-400 hover:text-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                {/* Body */}
                <div className="max-h-80 overflow-y-auto px-4 py-3">
                  {paymentLogs?.length > 0 ? (
                    <>
                      <p className="text-sm text-gray-500 mb-3">
                        Here are your earnings from referred members:
                      </p>
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transaction ID
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {currentEarnings.map((log, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {log.transactionId}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {new Date(
                                  log.date *
                                    (log.date.toString().length === 10
                                      ? 1000
                                      : 1),
                                ).toLocaleDateString(dateLocale)}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                ₹ {log.amount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination controls */}
                      {paymentLogs?.length > earningsPerPage && (
                        <div className="mt-4 flex justify-center">
                          <PaginationComponent
                            data={paymentLogs || []}
                            currentPage={currentEarningsPage}
                            onPageChange={setCurrentEarningsPage}
                            itemsPerPage={earningsPerPage}
                            showIcons={true}
                            hideResultsText={true}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-gray-500">
                        No earnings history found.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 text-right">
                  <button
                    onClick={() => setEarningsModal(false)}
                    className="px-3 py-1.5 text-white text-sm rounded-md"
                    style={{ backgroundColor: InstitutionData.PrimaryColor }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {shareClicked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-800">Share via</h3>
              <button
                onClick={() => setShareClicked(false)}
                className="text-gray-400 hover:text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-8">
              <div className="flex justify-center items-center gap-8">
                <div
                  className="flex flex-col gap-2 items-center cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => {
                    handleSocialShare("whatsapp");
                    setShareClicked(false);
                  }}>
                  <img width={40} src={Whatsapp} alt="WhatsApp" />
                  <p className="font-[400] text-gray-600 text-[0.8rem] text-center mb-0">
                    WhatsApp
                  </p>
                </div>
                <div
                  className="flex flex-col gap-2 items-center cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => {
                    handleSocialShare("facebook");
                    setShareClicked(false);
                  }}>
                  <img width={40} src={Facebook} alt="Facebook" />
                  <p className="font-[400] text-gray-600 text-[0.8rem] text-center mb-0">
                    Facebook
                  </p>
                </div>
                <div
                  className="flex flex-col gap-2 items-center cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => {
                    handleSocialShare("twitter");
                    setShareClicked(false);
                  }}>
                  <img width={40} src={Twitter} alt="Twitter" />
                  <p className="font-[400] text-gray-600 text-[0.8rem] text-center mb-0">
                    Twitter
                  </p>
                </div>
                <div
                  className="flex flex-col gap-2 items-center cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => {
                    handleSocialShare("telegram");
                    setShareClicked(false);
                  }}>
                  <img width={40} src={Telegram} alt="Telegram" />
                  <p className="font-[400] text-gray-600 text-[0.8rem] text-center mb-0">
                    Telegram
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReferralCode;
