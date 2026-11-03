import React, { useContext } from "react";
import NavBar from "../../../components/Header";
import Footer from "../../../components/Footer";
import MacyVideosSidebar from "../../../components/Macy/MacyVideosSidebar";
import InstitutionContext from "../../../Context/InstitutionContext";

const MacyClasses = () => {
  const institutionData = useContext(InstitutionContext).institutionData;
  const bucket = process.env.REACT_APP_VIDEO_BUCKET || institutionData?.VideoBucket;
  console.log("Using bucket:", bucket);

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-[#E8FFFC] p-6">
        <div className="max-w-[1200px] mx-auto">
          <h1 className="text-3xl font-bold mb-6">Yoga Classes</h1>
          <MacyVideosSidebar prefix={`happyprancer/videos/macy-videos/`} bucket={bucket} />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MacyClasses;
