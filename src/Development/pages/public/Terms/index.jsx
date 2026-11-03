import React, { useContext } from "react";
import NavBar from "../../../components/Header";
import Footer from "../../../components/Footer";
import InstitutionContext from "../../../Context/InstitutionContext";
import institutionJson from "../../../../Operation/institutionData.json";

const Terms = () => {
  const InstitutionData = useContext(InstitutionContext)?.institutionData;
  const termsList =
    InstitutionData?.TermsData?.length > 0
      ? InstitutionData.TermsData
      : institutionJson.TermsData || [];

  return (
    <>
      <NavBar />
      <div
        className={` text-justify bg-[#E8FFFC] flex flex-col items-center pt-6 w-full pb-[5rem]`}
      >
        <div
          className={`flex flex-col items-center  mt-[2rem] p-0  w-[90vw] max-w-[80rem]`}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-[#03413A] mb-4 text-center">
            Terms of Service
          </h1>
          {termsList.map((item, index) => (
            <div key={index} className="w-full">
              <h2
                className={`text-[1.2rem] text-left mt-8 font-bold w-full sm:ml-0 ml-5`}
              >
                {item.title}
              </h2>

              {item.content && (
                <p className={`mt-8 sm:ml-0 ml-5 mr-5`}>{item.content}</p>
              )}
              {item.additionalContent1 && (
                <p className={`mt-2`}>{item.additionalContent1}</p>
              )}
              {item.additionalContent2 && (
                <p className={`mt-2`}>{item.additionalContent2}</p>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Terms;
