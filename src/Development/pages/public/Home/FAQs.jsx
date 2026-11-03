import React, { useState, useContext, useEffect } from "react";
import Context from "../../../Context/Context";
import InstitutionContext from "../../../Context/InstitutionContext";
import {
  useMonthlySubscriptionPricing,
  isSubscriptionFaq,
  getDynamicFaqSubscriptionText,
} from "../../../utils/subscriptionPricing";
// import { API } from "../../../Context/ContextProvider";

const renderFaqContent = (text) => {
  if (!text || typeof text !== "string") return text;

  const urlRegex =
    /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:com|org|net|io|in|app|ai)[^\s]*|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;

  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    const trimmed = part.replace(/[.,;:!?]+$/, "");
    const trailingPunctuation = part.slice(trimmed.length);

    if (trimmed.includes("@") && !trimmed.startsWith("http")) {
      return (
        <React.Fragment key={index}>
          <a
            href={`mailto:${trimmed}`}
            className="text-[#114E3B] underline font-medium hover:text-[#03413A] transition-colors"
          >
            {trimmed}
          </a>
          {trailingPunctuation}
        </React.Fragment>
      );
    }

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return (
        <React.Fragment key={index}>
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#114E3B] underline font-medium hover:text-[#03413A] transition-colors"
          >
            {trimmed}
          </a>
          {trailingPunctuation}
        </React.Fragment>
      );
    }

    if (trimmed.startsWith("www.")) {
      return (
        <React.Fragment key={index}>
          <a
            href={`https://${trimmed}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#114E3B] underline font-medium hover:text-[#03413A] transition-colors"
          >
            {trimmed}
          </a>
          {trailingPunctuation}
        </React.Fragment>
      );
    }

    if (
      /^[a-zA-Z0-9-]+\.(?:com|org|net|io|in|app|ai)(?:\/[^\s]*)?$/i.test(trimmed)
    ) {
      return (
        <React.Fragment key={index}>
          <a
            href={`https://${trimmed}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#114E3B] underline font-medium hover:text-[#03413A] transition-colors"
          >
            {trimmed}
          </a>
          {trailingPunctuation}
        </React.Fragment>
      );
    }

    return part;
  });
};

export default function FAQ() {
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const UserCtx = useContext(Context);
  const isAdmin = UserCtx.userData.userType === "admin";
  const { indianPricing, intlPricing } = useMonthlySubscriptionPricing();

  const { institutionData } = useContext(InstitutionContext);
  const [faqDataState, setFaqDataState] = useState(institutionData?.FAQ || []);
  const [openIndex, setOpenIndex] = useState(0);

  // Static Data (Fallback or Base)
  const initialFaqs = {
    title: "Frequently Asked Questions",
    items: [
      {
        title: "Do I need special equipment for online classes?",
        content:
          "No! Just a yoga mat and a stable internet connection. For BWORKZ, comfortable shoes are recommended.",
      },
      {
        title: "Can I switch between plans later?",
        content:
          "Absolutely. You can upgrade from an Online plan to a Hybrid plan (or vice versa) at any time through your account settings.",
      },
    ],
  };

  useEffect(() => {
    // Merge static structure with dynamic data if needed, or primarily use dynamic data
    if (institutionData?.FAQ && institutionData?.FAQ.length > 0) {
      setFaqDataState(institutionData.FAQ);
    }
  }, [institutionData?.FAQ]);

  const displayFaqs =
    faqDataState.length > 0 ? faqDataState : initialFaqs.items;

  return (
    <section className="bg-[#FFFFFF] py-14 font-inter">
      <div className="md:px-2 lg:px-3 mx-auto max-w-7xl">
        <h2 className="hidden md:block text-center text-[#03413A] text-[1.5rem] md:text-[2.5rem] font-bold pb-5 lg:mb-12">
          Frequently Asked Questions
        </h2>

        <div className="grid lg:grid-cols-[1fr_1.6fr] gap-5 justify-between items-start px-4 md:px-8">
          {/* LEFT SIDE */}
          <div className="space-y-10">
            <div>
              <h3 className="text-2xl font-inter font-[600] text-[#111111] mb-3">
                Need something else?
              </h3>

              <p className="text-[17px] text-[#6B6B6B] w-full lg:max-w-md leading-1 mb-6">
                If you don’t see your question here, our team is happy to help
                you choose the right plan or class for your lifestyle.
              </p>

              <a
                href="mailto:admin@happyprancer.com"
                className="inline-block bg-[#03413A] text-white px-4 py-2 rounded-full text-sm font-[500] tracking-wide hover:opacity-90 transition"
              >
                admin@happyprancer.com
              </a>
            </div>
            {/* Admin UI Hidden */}
          </div>

          {/* RIGHT FAQ LIST */}
          <div className="space-y-5">
            {displayFaqs.map((item, i) => {
              const isOpen = openIndex === i;
              const isSubFaq = isSubscriptionFaq(item.title);
              const content = isSubFaq
                ? getDynamicFaqSubscriptionText(
                    item.content,
                    indianPricing,
                    intlPricing
                  )
                : item.content;

              return (
                <div
                  key={i}
                  className={`rounded-xl bg-white
    ${
      isOpen
        ? "border-l-4 border-t border-r border-b border-[#114E3B]"
        : "border border-[#E3E3E3]"
    }`}
                >
                  <div className="w-full flex items-center justify-between px-3 py-2 text-left">
                    <button
                      onClick={() => setOpenIndex(isOpen ? -1 : i)}
                      className="flex-1 flex items-center justify-between text-left"
                    >
                      <span className="text-[18px] font-inter font-medium text-[#114E3B]">
                        {item.title}
                      </span>
                      <span className="text-[22px] font-light text-[#03413A]">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                  </div>

                  <div
                    className={`px-3 overflow-hidden transition-all duration-500 ease-in-out
    ${isOpen ? "max-h-40 opacity-100 pb-6" : "max-h-0 opacity-0"}
  `}
                  >
                    <p className="text-[15px] font-[400] text-[#666666] leading-relaxed">
                      {renderFaqContent(content)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
