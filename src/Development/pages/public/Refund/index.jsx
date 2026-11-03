import React, { useContext } from "react";
import NavBar from "../../../components/Header";
import Footer from "../../../components/Footer";
import "./Refund.css";
import InstitutionContext from "../../../Context/InstitutionContext";
import {
  useMonthlySubscriptionPricing,
  isSubscriptionRefundHeading,
  getDynamicRefundSubscriptionText,
} from "../../../utils/subscriptionPricing";

const Terms = () => {
  const InstitutionData = useContext(InstitutionContext)?.institutionData;
  const { indianPricing, intlPricing } = useMonthlySubscriptionPricing();

  const refundList = InstitutionData?.Refund || [];

  return (
    <>
      <NavBar />
      <div className={`flex flex-col bg-[#E8FFFC] items-center pt-6 w-full pb-[5rem]`}>
        <div
          className={` text-justify flex flex-col items-center  w-100 h-100 p-0 overflow-x-hidden w-[90vw] max-w-[80rem]`}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-[#03413A] mb-4 text-center">
            Cancellation & Refund Policy
          </h1>
          {InstitutionData?.src_pages_Refund__Heading_2 && (
            <h2
              className={`text-[1.2rem] max450:text-[1rem] text-left font-bold w-full sm:ml-0 ml-5 `}
            >
              {InstitutionData?.src_pages_Refund__Heading_2}
            </h2>
          )}
          <p className={`mt-8 sm:ml-0 ml-5 mr-5`}>
            {InstitutionData?.src_pages_Refund__Content_2}
          </p>
          {refundList.map((refund, index) => {
            const isSubFee = isSubscriptionRefundHeading(refund.heading);
            const content = isSubFee
              ? getDynamicRefundSubscriptionText(
                  refund.content,
                  indianPricing,
                  intlPricing
                )
              : refund.content;

            return (
              <React.Fragment key={index}>
                <h2
                  className={`text-[1.2rem] max450:text-[1rem] text-left mt-8 font-bold w-full sm:ml-0 ml-5 `}
                >
                  {refund.heading}
                </h2>
                <ul>
                  {content.split("\n\n").map((para, pIndex) => (
                    <li key={pIndex}>{para}</li>
                  ))}
                </ul>
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Terms;
