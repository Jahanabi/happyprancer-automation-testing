import React, { useContext, useEffect, useState } from "react";
import NavBar from "../../../components/Header";
import Footer from "../../../components/Footer";
// import { API } from "../../../Context/ContextProvider";
import Context from "../../../Context/Context";
import InstitutionContext from "../../../Context/InstitutionContext";
import { toast } from "react-toastify";
import { FaUserEdit } from "react-icons/fa";
import InstructorCard from "./InstructorCard";
import InstructorModal from "./InstructorModal";
import InstructorSkeleton from "./InstructorSkeleton";
import { deduplicateUserList } from "../../../utils/userDeduplication";

const Instructor = () => {
  const [instructorList, setInstructorList] = useState([]);
  const { getGenericInstructorList, instructorList: contextInstructorList } = useContext(Context);
  const UserCtx = useContext(Context);
  const Loader = useContext(Context).util;
  const [loaderInitialized, setLoaderInitialized] = useState(false);
  const isAdmin = UserCtx.userData.userType === "admin";
  const [isLoading, setIsLoading] = useState(true);

  const [modalShow, setModalShow] = useState(false);
  const [alert, setAlert] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  const { institutionData } = useContext(InstitutionContext);
  const InstitutionData = useContext(InstitutionContext).institutionData;

  // Static Data from newdesign/src/utils/data.json
  const pageData = {
    badge: "OUR INSTRUCTORS",
    title: "Meet the Experts Behind Your Transformation",
    subtitle: "Meet our dance-fitness and yoga instructors bringing energy, expertise, and passion to every class",
    highlights: [
      { icon: "🏆", text: "Dance-Fitness & Yoga Instruction" },
      { icon: "⭐", text: "Diverse Teaching Experience" },
      { icon: "🌍", text: "Multiple Dance & Fitness Styles" }
    ],
    certifications: {
      title: "Teaching & Fitness Excellence",
      description: "Our instructors bring diverse experience and training across yoga, dance, and fitness disciplines to every HappyPrancer class.",
      icons: ["🏆", "🧘", "💪", "✅"]
    }
  };

  useEffect(() => {
    const fetchInstructorList = async () => {
      setIsLoading(true);
      try {
        const response = await getGenericInstructorList(
          institutionData.InstitutionId,
        );

        console.log("Fetched instructors:", response.length);
        const filteredInstructors = deduplicateUserList(
          response.filter(
            (instructor) => instructor.instructorId !== "id-for-canceled-class",
          )
        );

        const sortedInstructors = filteredInstructors.sort((a, b) => {
          if (
            a.position === "Master Instructor" &&
            b.position !== "Master Instructor"
          )
            return -1;
          if (
            a.position !== "Master Instructor" &&
            b.position === "Master Instructor"
          )
            return 1;
          return 0;
        });

        setInstructorList(sortedInstructors);
      } catch (error) {
        console.error("Error fetching instructors:", error);
      } finally {
        Loader.setLoader(false);
        setIsLoading(false);
      }
    };

    const cachedInstructorList = localStorage.getItem(
      `instructorList_${institutionData.InstitutionId}`,
    );
    if (cachedInstructorList) {
      const { data, timestamp } = JSON.parse(cachedInstructorList);
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        setInstructorList(data);
        setIsLoading(false);
      } else {
        fetchInstructorList();
      }
    } else {
      fetchInstructorList();
    }
  }, [loaderInitialized, institutionData.InstitutionId]);

  const refreshInstructorList = () => {
    localStorage.removeItem(`instructorList_${institutionData.InstitutionId}`);
    setLoaderInitialized((prev) => !prev);
  };

  const handleEditInstructor = (instructor) => {
    setSelectedInstructor(instructor);
    setIsUpdating(true);
    setModalShow(true);
  };

  const handleDeleteInstructor = (instructor) => {
    setSelectedInstructor(instructor);
    setAlert(true);
  };

  const handleAddNewInstructor = () => {
    setSelectedInstructor(null);
    setIsUpdating(false);
    setModalShow(true);
  };

  const onCloseModal = () => {
    setModalShow(false);
    setIsUpdating(false);
    setSelectedInstructor(null);
  };

  console.log("Instructor List",instructorList)
  return (
      <>
        <NavBar />

        <InstructorModal
            show={modalShow}
            alert={alert}
            isUpdating={isUpdating}
            selectedInstructor={selectedInstructor}
            institutionData={institutionData}
            InstitutionData={InstitutionData}
            instructorList={instructorList}
            onClose={onCloseModal}
            onCloseAlert={() => setAlert(false)}
            onSuccess={refreshInstructorList}
            setLoaderInitialized={setLoaderInitialized}
        />

        <section className="bg-[#E8FFFC] pt-16 pb-24 font-poppins overflow-hidden">
          <div className="max-w-[1440px] mx-auto px-6 relative">

            {/* Admin Add Button */}
            {/* {isAdmin && (
            <div className="absolute top-0 right-6 z-10">
              <button
                onClick={handleAddNewInstructor}
                className="flex items-center gap-2 bg-[#225C59] text-white px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-[#1a4744] transition-all transform hover:scale-105 active:scale-95"
              >
                <FaUserEdit size={18} />
                <span>Add Instructor</span>
              </button>
            </div>
          )} */}

            {/* BADGE */}
            <div className="flex justify-center mb-6">
            <span className="px-4 py-2 bg-[#225C59]/5 border-[1.6px] font-bold font-poppins border-[#225C5966] rounded-full text-xs  text-[#225C59] uppercase">
              {pageData.badge}
            </span>
            </div>

            {/* TITLE & SUBTITLE */}
            <div className="text-center max-w-4xl mx-auto mb-10">
              <h1 className="text-3xl  sm:text-4xl lg:text-5xl font-[750] text-[#1A1A1A] mb-4">
                {pageData.title}
              </h1>
              <p className="text-[#666666] text-lg lg:text-xl leading-relaxed">
                {pageData.subtitle}
              </p>
            </div>

            <div className="justify-center hidden lg:block">
              <span className="h-1 w-56 rounded-full mb-8 bg-gradient-to-b from-[#225C59] to-[#3A7B77]"></span>
            </div>

            {/* HIGHLIGHTS */}
            <div className="flex  flex-wrap justify-center gap-4 mb-16">
              {pageData.highlights.map((item, i) => (
                  <div
                      key={i}
                      className="flex bg-[#d6f1eb] items-center  font-['Poppins'] bg-[#225C59]/8 px-4 py-2 rounded-full text-sm font-bold text-[#225C59]"
                  >
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
              ))}
            </div>

            {/* INSTRUCTORS GRID */}
            <h2 className="sr-only">Our Instructors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {isLoading ? (
                  // Skeleton Loader
                  Array.from({ length: 5 }).map((_, i) => (
                      <InstructorSkeleton key={i} />
                  ))
              ) : (
                  instructorList.map((instructor, i) => {
                    return (
                        instructor.name !== "cancelled" && (
                            <InstructorCard
                                key={i}
                                instructor={instructor}
                                isAdmin={isAdmin}
                                institutionData={institutionData}
                                onEdit={handleEditInstructor}
                                onDelete={handleDeleteInstructor}
                            />
                        )
                    );
                  })
              )}
            </div>

            {/* CERTIFICATIONS */}
            <div className="mt-12 sm:mt-16 lg:mt-20 bg-gradient-to-b from-[#F0F9F8] to-white rounded-xl lg:rounded-2xl px-6 sm:px-10 lg:pl-16 lg:pr-20 py-8 sm:py-10 border border-black/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-12">
              <div className="w-full lg:max-w-3xl">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-['Poppins'] font-bold text-[#225C59] mb-2">
                  {pageData.certifications.title}
                </h2>
                <p className="text-sm sm:text-base text-[#666666] font-['Inter'] pr-0 lg:pr-12">
                  {pageData.certifications.description}
                </p>
              </div>

              <div className="w-full lg:w-auto flex justify-start lg:justify-end gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                {pageData.certifications.icons.map((icon, i) => (
                    <div
                        key={i}
                        className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white rounded-md lg:rounded-lg flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl text-[#1A1A1A] border border-[#BBBBBB] shrink-0"
                    >
                      {icon}
                    </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        <Footer />
      </>
  );
};

export default Instructor;