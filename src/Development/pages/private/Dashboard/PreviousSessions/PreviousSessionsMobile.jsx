import React, { useContext, useState } from "react";
import Context from "../../../../Context/Context";
import InstitutionContext from "../../../../Context/InstitutionContext";
import PaginationComponent from "../../../../common/Pagination";
import AttendanceModal from "../../../../common/AttendanceModal";
// import { API } from "../../../../Context/ContextProvider";
import { toast } from "react-toastify";
import { convertEpochToTime } from "../../../../utils/helpers";
import ClassModal from "../UpcomingSessions/Components/CreateEditClassModal";
import Skeleton from "react-loading-skeleton";

const PreviousSessionsMobile = ({ userCountryCode }) => {
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const Ctx = useContext(Context);
  const UtilCtx = useContext(Context).util;
  const { loadingPrevious, updateScheduleRecording } = useContext(Context);

  // Modal states
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedClassForAttendance, setSelectedClassForAttendance] =
    useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [recordingLink, setRecordingLink] = useState("");

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClassForEdit, setSelectedClassForEdit] = useState(null);

  // Filter states
  const [classTypeFilter, setClassTypeFilter] = useState("");
  const [instructorTypeFilter, setInstructorTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const canInstructorEditClass = (classData) => {
    if (Ctx.userData.userType !== "instructor") {
      return true;
    }

    const currentInstructorId = Ctx.userData?.cognitoId;
    const currentEmail = Ctx.userData?.emailId?.toLowerCase?.();
    const classInstructorId = classData?.instructorId;
    const classInstructorEmail =
      classData?.instructorEmailId?.toLowerCase?.() ||
      classData?.instructorEmail?.toLowerCase?.();

    return Boolean(
      (currentInstructorId && classInstructorId === currentInstructorId) ||
      (currentEmail && classInstructorEmail === currentEmail),
    );
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Sort and filter classes
  const sortedPreviousClasses = Ctx.previousClasses.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const filteredClasses = sortedPreviousClasses
    .filter((clas) => {
      if (instructorTypeFilter === "") return true;
      return clas.instructorNames === instructorTypeFilter;
    })
    .filter((clas) => {
      if (classTypeFilter === "") return true;
      return clas.classType === classTypeFilter;
    });

  const classTypes = Array.from(
    new Set(sortedPreviousClasses.map((clas) => clas.classType)),
  );

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClasses = filteredClasses.slice(startIndex, endIndex);

  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  // Defensive check for classes
  const safeClasses = Array.isArray(currentClasses) ? currentClasses : [];

  const getDate = (epochTime) => {
    const date = new Date(epochTime);
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Handle view attendance click
  const handleViewAttendance = (classId) => {
    setSelectedClassForAttendance(classId);
    setShowAttendanceModal(true);
  };

  // Handle recording update
  const handleUpdateRecording = (classId, currentLink) => {
    setSelectedClassId(classId);
    setRecordingLink(currentLink || "");
    setShowUpdateModal(true);
  };

  // Handle edit class click
  const handleEditClass = (classData) => {
    setSelectedClassForEdit(classData);
    setShowEditModal(true);
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowEditModal(false);
    setSelectedClassForEdit(null);
  };

  const onRecordingUpdate = async (e) => {
    e.preventDefault();
    UtilCtx.setLoader(true);

    try {
      if (!selectedClassId || !recordingLink) {
        toast.error("Invalid Details");
        UtilCtx.setLoader(false);
        return;
      }

      await updateScheduleRecording(InstitutionData.InstitutionId, {
        classId: selectedClassId,
        recordingLink: recordingLink,
      });

      toast.success("Recording Link Updated Successfully");

      const updatedClasses = Ctx.previousClasses.map((clas) => {
        if (clas.classId === selectedClassId) {
          return {
            ...clas,
            recordingLink: recordingLink,
          };
        }
        return clas;
      });

      Ctx.setPreviousClasses(updatedClasses);
      setSelectedClassId(null);
      setRecordingLink("");
      setShowUpdateModal(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      UtilCtx.setLoader(false);
    }
  };

  return (
    <div className="flex flex-col w-full inter mt-16">
      {/* Header section */}
      <div className="w-[99vw] px-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800">
            Previous Sessions
          </h3>
          <button
            className="bg-white text-gray-700 border border-gray-300 rounded-md px-3 py-1 text-sm font-medium"
            onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
      </div>

      {/* Filters section */}
      {showFilters && (
        <div className="w-[99vw] px-4 mb-4">
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructor
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                value={instructorTypeFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setInstructorTypeFilter(e.target.value);
                }}>
                <option value="">All</option>
                {Array.from(
                  new Set(
                    Ctx.previousClasses.map((clas) => clas.instructorNames),
                  ),
                ).map((instructorNames) => (
                  <option key={instructorNames} value={instructorNames}>
                    {instructorNames}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Type
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                value={classTypeFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setClassTypeFilter(e.target.value);
                }}>
                <option value="">All</option>
                {classTypes.map((classType) => (
                  <option key={classType} value={classType}>
                    {classType}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Session cards */}
      <div className="w-[99vw] px-4 space-y-4">
        {loadingPrevious
          ? Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="w-full bg-white rounded-lg p-3 border border-gray-100 animate-pulse">
                {/* Header (Instructor + class type + actions) */}
                <div className="flex justify-between items-center">
                  <Skeleton height={20} width={120} />
                  <div className="flex gap-2">
                    <Skeleton circle height={24} width={24} />
                    <Skeleton circle height={24} width={24} />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex flex-col mt-3 text-gray-500 text-sm">
                  <div className="flex items-center gap-2">
                    <Skeleton height={14} width={80} />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Skeleton height={14} width={60} />
                  </div>
                </div>

                {/* Recording Section */}
                <div className="mt-3 flex justify-between items-center">
                  <Skeleton height={20} width={100} />
                  <Skeleton height={24} width={80} />
                </div>
              </div>
            ))
          : safeClasses.map((session) => (
              <div
                key={session.classId}
                className="w-full bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex justify-between">
                  <div className="w-full">
                    <div className="w-full flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-800">
                        {session.instructorNames.split(" ")[0]} |{" "}
                        {session.classType}
                      </h4>
                      <div className="flex gap-2 items-center justify-center">
                        {/* Edit Icon - Only show for admin/instructor */}
                        {(Ctx.userData.userType === "admin" ||
                          (Ctx.userData.userType === "instructor" &&
                            canInstructorEditClass(session))) && (
                          <button
                            onClick={() => handleEditClass(session)}
                            className="text-gray-600 hover:text-gray-800 p-1"
                            aria-label="Edit class">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                        )}

                        {/* Attendance Button */}
                        {(Ctx.userData.userType === "admin" ||
                          Ctx.userData.userType === "instructor") && (
                          <div>
                            <button
                              className="text-gray-600 mt-1 text-sm font-medium"
                              onClick={() =>
                                handleViewAttendance(session.classId)
                              }>
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 14 14"
                                stroke="currentColor"
                                strokeWidth={1.5}
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                  d="M5 6C6.24264 6 7.25 4.99264 7.25 3.75C7.25 2.50736 6.24264 1.5 5 1.5C3.75736 1.5 2.75 2.50736 2.75 3.75C2.75 4.99264 3.75736 6 5 6Z"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                />
                                <path
                                  d="M9.5 13.5H0.5V12.5C0.5 11.3065 0.974106 10.1619 1.81802 9.31802C2.66193 8.47411 3.80653 8 5 8C6.19347 8 7.33807 8.47411 8.18198 9.31802C9.02589 10.1619 9.5 11.3065 9.5 12.5V13.5Z"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                />
                                <path
                                  d="M9 1.5C9.59674 1.5 10.169 1.73705 10.591 2.15901C11.0129 2.58097 11.25 3.15326 11.25 3.75C11.25 4.34674 11.0129 4.91903 10.591 5.34099C10.169 5.76295 9.59674 6 9 6"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                />
                                <path
                                  d="M10.6 8.18994C11.4518 8.51399 12.1852 9.08905 12.703 9.83903C13.2209 10.589 13.4988 11.4786 13.5 12.3899V13.4999H12"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col mt-3 text-gray-500 text-sm">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span>{getDate(session.date)}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>
                          {convertEpochToTime(
                            session.startTimeEst || session.date,
                            userCountryCode,
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Recording Section */}
                    <div className="mt-3">
                      {session.recordingLink ? (
                        <div className="flex items-center justify-between">
                          <button
                            className="text-lightPrimaryColor text-sm font-medium flex items-center"
                            onClick={() =>
                              window.open(session.recordingLink, "_blank")
                            }>
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            View Recording
                          </button>
                          {(Ctx.userData.userType === "admin" ||
                            (Ctx.userData.userType === "instructor" &&
                              canInstructorEditClass(session))) && (
                            <button
                              className="text-gray-600 text-sm"
                              onClick={() =>
                                handleUpdateRecording(
                                  session.classId,
                                  session.recordingLink,
                                )
                              }>
                              Edit
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-sm">
                            No Recording
                          </span>
                          {(Ctx.userData.userType === "admin" ||
                            (Ctx.userData.userType === "instructor" &&
                              canInstructorEditClass(session))) && (
                            <button
                              className="text-white p-2 bg-primaryColor text-xs font-medium rounded-md"
                              onClick={() =>
                                handleUpdateRecording(session.classId, "")
                              }>
                              Add Recording
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Pagination */}
      {filteredClasses?.length > itemsPerPage && (
        <PaginationComponent
          showIcons={true}
          data={filteredClasses}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={onPageChange}
          hideResultsText={true}
        />
      )}

      {/* Update Recording Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Update Recording Link
            </h3>
            <form onSubmit={onRecordingUpdate} className="space-y-4">
              <div>
                <input
                  type="url"
                  placeholder="Enter recording link"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={recordingLink}
                  onChange={(e) => setRecordingLink(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedClassId(null);
                    setRecordingLink("");
                  }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primaryColor text-white rounded-md">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && (
        <ClassModal
          isOpen={showEditModal}
          onClose={handleEditModalClose}
          institutionData={InstitutionData}
          classTypeNameArray={Ctx.classTypeNameArray || []}
          instructorList={Ctx.instructorList || []}
          userData={Ctx.userData}
          setUpcomingClasses={Ctx.setPreviousClasses} // Use setPreviousClasses to update the list
          upcomingClasses={Ctx.previousClasses}
          util={UtilCtx}
          classData={selectedClassForEdit} // Pass the selected class data for editing
        />
      )}

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => {
          setShowAttendanceModal(false);
          setSelectedClassForAttendance(null);
        }}
        classId={selectedClassForAttendance}
        institutionId={InstitutionData.InstitutionId}
      />
    </div>
  );
};

export default PreviousSessionsMobile;
