import React, { useContext } from "react";
import NavBar from "../../../components/Header";
import Footer from "../../../components/Footer";
import InstitutionContext from "../../../Context/InstitutionContext";
import institutionJson from "../../../../Operation/institutionData.json";

const PrivacyPolicy = () => {
  const institutionData = useContext(InstitutionContext)?.institutionData;
  const primary = institutionData?.PrimaryColor || "#225c59";

  const policyList =
    institutionData?.PrivacyPolicy?.length > 0
      ? institutionData.PrivacyPolicy
      : institutionJson.PrivacyPolicy || [];

  // Function to convert URLs and emails to hyperlinks
  const convertLinks = (text) => {
    if (!text || typeof text !== "string") return text;
    const urlRegex =
      /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (!part) return null;
      if (part.includes("@") && !part.startsWith("http")) {
        return (
          <a
            key={index}
            href={`mailto:${part}`}
            className="text-teal-700 underline font-medium hover:text-teal-900 break-words"
          >
            {part}
          </a>
        );
      }
      if (part.startsWith("http://") || part.startsWith("https://")) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-700 underline font-medium hover:text-teal-900 break-words"
          >
            {part}
          </a>
        );
      }
      if (part.startsWith("www.")) {
        return (
          <a
            key={index}
            href={`https://${part}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-700 underline font-medium hover:text-teal-900 break-words"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Helper to render body content with paragraphs and bullet points
  const renderContent = (content) => {
    if (!content) return null;
    const paragraphs = content.split("\n\n");

    return paragraphs.map((para, pIdx) => {
      const lines = para.split("\n").filter(Boolean);

      return (
        <div key={pIdx} className={pIdx > 0 ? "mt-4" : ""}>
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-");

            if (isBullet) {
              const cleaned = trimmed.replace(/^[•\-]\s*/, "");
              return (
                <div
                  key={lIdx}
                  className="flex items-start gap-2.5 text-gray-700 text-sm sm:text-base leading-relaxed mt-2 pl-2 sm:pl-3"
                >
                  <span
                    className="mt-1 font-bold text-base leading-none select-none"
                    style={{ color: primary }}
                  >
                    •
                  </span>
                  <div className="flex-1">{convertLinks(cleaned)}</div>
                </div>
              );
            }

            return (
              <p
                key={lIdx}
                className="text-gray-700 text-sm sm:text-base leading-relaxed mt-2 first:mt-0"
              >
                {convertLinks(line)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <NavBar />
      <div className="flex-1 flex justify-center items-center bg-[#E8FFFC] flex-col pb-12 pt-6">
        <div className="w-[92vw] max-w-[1440px] mx-auto mt-2">
          {policyList.map((item, index) => {
            if (index === 0) {
              return (
                <div key={index} className="w-full text-center mb-8">
                  <div
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-black/[0.08] text-xs sm:text-sm font-semibold mb-3"
                    style={{ color: primary }}
                  >
                    <span>🛡️</span>
                    <span>Official Privacy Policy</span>
                  </div>
                  <h1
                    className="text-3xl sm:text-5xl font-bold poppins tracking-tight"
                    style={{ color: primary }}
                  >
                    {item.title || "Privacy Policy"}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 font-medium poppins">
                    Last updated: May 16, 2025 • HappyPrancer Virtual Fitness Platform
                  </p>
                  {item.content && (
                    <div className="bg-white rounded-2xl shadow-sm border border-black/[0.06] p-6 sm:p-8 mt-6 text-left">
                      {renderContent(item.content)}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={index}
                className="w-full bg-white rounded-2xl shadow-sm border border-black/[0.06] p-6 sm:p-8 mt-6 transition-all hover:shadow-md"
              >
                <h2
                  className="text-lg sm:text-xl font-bold poppins mb-4 pb-2 border-b border-gray-100 flex items-center gap-2"
                  style={{ color: primary }}
                >
                  <span className="text-xs sm:text-sm opacity-60 font-semibold">
                    {index}.
                  </span>
                  <span>{item.title}</span>
                </h2>
                {item.content && renderContent(item.content)}
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
