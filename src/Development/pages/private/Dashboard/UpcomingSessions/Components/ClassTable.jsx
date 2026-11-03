import React, { useContext, useState } from "react";
import { Table, Button } from "flowbite-react";
import { FaEdit, FaEye } from "react-icons/fa";
import DateFormatter from "../../../../../common/utils/DateFormatter";
import formatTime from "../../../../../common/utils/format-time";
import { convertEpochToTime } from "../../../../../utils/helpers";
import Context from "../../../../../Context/Context";
import InstitutionContext from "../../../../../Context/InstitutionContext";
import Skeleton from "react-loading-skeleton";

const ClassTable = ({
  classes,
  userType,
  instructorList,
  getInstructor,
  onClassUpdated,
  markAttendance,
  handleAttendanceClick,
  attendanceStatus,
  primaryColor,
  onAction,
  userCountryCode,
}) => {
  const [editingTime, setEditingTime] = useState({});
  const [isFocused, setIsFocused] = useState(false);
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const Ctx = useContext(Context);
  const { loadingUpcoming } = useContext(Context);

  const canInstructorEditClass = (clas) => {
    if (userType !== "instructor") {
      return true;
    }

    const currentInstructorId = Ctx.userData?.cognitoId;
    const currentEmail = Ctx.userData?.emailId?.toLowerCase?.();
    const classInstructorId = clas?.instructorId;
    const classInstructorEmail =
      clas?.instructorEmailId?.toLowerCase?.() ||
      clas?.instructorEmail?.toLowerCase?.();

    return Boolean(
      (currentInstructorId && classInstructorId === currentInstructorId) ||
      (currentEmail && classInstructorEmail === currentEmail),
    );
  };

  const getDate = (epochTime) => {
    const date = new Date(epochTime);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${year}-${month < 10 ? "0" + month : month}-${
      day < 10 ? "0" + day : day
    }`;
  };

  const getTime = (epochTime) => {
    const date = new Date(epochTime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours < 10 ? "0" + hours : hours}:${
      minutes < 10 ? "0" + minutes : minutes
    }`;
  };

  const handleTimeChange = (e, classId) => {
    setEditingTime({ ...editingTime, [classId]: e.target.value });
  };

  const handleTimeBlur = (
    classId,
    instructorNames,
    classType,
    instructorId,
    date,
    newTime,
  ) => {
    if (newTime && newTime !== getTime(date)) {
      const newDate = new Date(`${getDate(date)}T${newTime}`).getTime();
      onClassUpdated(
        classId,
        instructorNames,
        classType,
        instructorId,
        newDate,
      );
    }
    setEditingTime((prev) => {
      const updated = { ...prev };
      delete updated[classId];
      return updated;
    });
  };

  return (
    <div data-tour="classes">
      <Table hoverable striped>
        <Table.Head>
          <Table.HeadCell className="text-center">Date</Table.HeadCell>
          <Table.HeadCell className="text-center">Instructor</Table.HeadCell>
          <Table.HeadCell className="text-center">Description</Table.HeadCell>
          <Table.HeadCell className="text-center">Time</Table.HeadCell>
          <Table.HeadCell className="text-center">Join</Table.HeadCell>
          {(userType === "admin" || userType === "instructor") && (
            <Table.HeadCell className="text-center">Action</Table.HeadCell>
          )}
        </Table.Head>

        <Table.Body className="divide-y">
          {loadingUpcoming
            ? Array.from({ length: 5 }).map((_, idx) => (
                <Table.Row
                  key={idx}
                  className="animate-pulse bg-gray-50 hover:bg-gray-100">
                  {/* Date */}
                  <Table.Cell className="text-center">
                    <Skeleton className="h-5 w-20 mx-auto" />
                  </Table.Cell>

                  {/* Instructor */}
                  <Table.Cell className="text-center">
                    <Skeleton className="h-5 w-24 mx-auto" />
                  </Table.Cell>

                  {/* Description */}
                  <Table.Cell className="text-center">
                    <Skeleton className="h-5 w-28 mx-auto" />
                  </Table.Cell>

                  {/* Time */}
                  <Table.Cell className="text-center">
                    <Skeleton className="h-5 w-16 mx-auto" />
                  </Table.Cell>

                  {/* Join Button */}
                  <Table.Cell className="text-center">
                    <Skeleton className="h-8 w-24 mx-auto rounded-md" />
                  </Table.Cell>

                  {/* Action (only for admin/instructor) */}
                  {(userType === "admin" || userType === "instructor") && (
                    <Table.Cell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </Table.Cell>
                  )}
                </Table.Row>
              ))
            : classes.map((clas) => (
                <Table.Row
                  key={clas.classId}
                  className="bg-white hover:bg-gray-50 transition-colors duration-200">
                  {/* Date */}
                  <Table.Cell className="text-gray-700 text-sm font-semibold text-center">
                    <DateFormatter epochDate={clas.date} />
                  </Table.Cell>

                  {/* Instructor Name */}
                  <Table.Cell className="text-gray-700 text-sm font-semibold text-center">
                    {clas.instructorNames}
                  </Table.Cell>

                  {/* Description */}
                  <Table.Cell className="text-gray-700 font-semibold text-center md:table-cell w-32 lg:w-48">
                    <div className="w-full flex justify-center">
                      <div className="flex items-center justify-center gap-4 w-28 text-gray-700 rounded-lg">
                        {clas.classType}
                      </div>
                    </div>
                  </Table.Cell>

                  {/* Time */}
                  <Table.Cell className="text-gray-700 font-semibold text-center">
                    <div className="flex items-center justify-center">
                      {convertEpochToTime(clas.date, userCountryCode)}
                    </div>
                  </Table.Cell>

                  {/* Attendance Button */}
                  <Table.Cell className="text-gray-700 font-semibold text-center">
                    <div className="flex items-center justify-center w-full">
                      {clas.zoomLink ? (
                        <Button
                          onClick={() => {
                            if (Ctx.userData.userType === "member") {
                              if (clas.zoomLink) {
                                const meetingNumberRegex =
                                  /(?:https?:\/\/)?(?:www\.)?zoom\.us\/j\/(\d+)/;
                                const meetingNumberMatch =
                                  clas.zoomLink.match(meetingNumberRegex);
                                const meetingNumber = meetingNumberMatch
                                  ? meetingNumberMatch[1]
                                  : "";
                                if (meetingNumberMatch) {
                                  const passwordRegex = /[?&]pwd=([^&]+)/;
                                  const passwordMatch =
                                    clas.zoomLink.match(passwordRegex);
                                  const password = passwordMatch
                                    ? passwordMatch[1]
                                    : "";

                                  window.open(
                                    `https://live.awsaiapp.com/?institution=${InstitutionData.InstitutionId}&cognitoId=${Ctx.userData.cognitoId}&instructorId=${clas.instructorId}&classId=${clas.classId}&meetingNumber=${meetingNumber}&password=${password}`,
                                    "_blank",
                                  );
                                } else {
                                  window.open(
                                    clas.zoomLink,
                                    "_blank",
                                    "noreferrer",
                                  );
                                }
                              }
                            } else {
                              window.open(clas.zoomLink, "_blank");
                            }
                            markAttendance(clas.classId);
                          }}
                          size="xs"
                          style={{ backgroundColor: "transparent" }}
                          className="flex items-center gap-2 text-black w-full justify-center">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          {attendanceStatus[clas.classId] === "Joined"
                            ? "Joined"
                            : "Join"}
                        </Button>
                      ) : (
                        <span className="text-gray-500 text-sm italic">
                          No link available
                        </span>
                      )}
                    </div>
                  </Table.Cell>

                  {/* Action Buttons */}
                  {(userType === "admin" || userType === "instructor") && (
                    <Table.Cell className="text-gray-700 font-semibold text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          title="View"
                          onClick={() => handleAttendanceClick(clas.classId)}
                          className="p-2 hover:bg-gray-100 rounded">
                          <FaEye size={16} />
                        </button>

                        {canInstructorEditClass(clas) && (
                          <button
                            title="Edit"
                            onClick={() => onAction(clas, "edit")}
                            className="p-2 hover:bg-gray-100 rounded">
                            <FaEdit size={16} />
                          </button>
                        )}
                      </div>
                    </Table.Cell>
                  )}
                </Table.Row>
              ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default ClassTable;
