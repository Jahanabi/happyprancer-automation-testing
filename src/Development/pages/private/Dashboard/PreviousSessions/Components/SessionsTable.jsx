import { Table, Button } from "flowbite-react";
import React from "react";
import DateFormatter from "../../../../../common/utils/DateFormatter";
import formatTime from "../../../../../common/utils/format-time";

const SessionsTable = ({
  currentClasses,
  institutionData,
  handleUpdateClick,
  handleAttendanceClick,
  userType,
}) => (
  <Table hoverable striped>
    <Table.Head>
      <Table.HeadCell className="font-semibold">Instructor</Table.HeadCell>
      <Table.HeadCell className="font-semibold">Date</Table.HeadCell>
      <Table.HeadCell className="font-semibold">Time</Table.HeadCell>
      <Table.HeadCell className="font-semibold">Recording Link</Table.HeadCell>
      {(userType === "admin" || userType === "instructor") && (
        <Table.HeadCell className="text-center w-[100px]">
          Action
        </Table.HeadCell>
      )}
    </Table.Head>
    <Table.Body className="divide-y">
      {currentClasses.map((clas) => (
        <Table.Row
          key={clas.classId}
          className="bg-white hover:bg-gray-50 transition-colors duration-200"
        >
          <Table.Cell className="text-gray-700 font-semibold">
            {clas.instructorNames}
          </Table.Cell>
          <Table.Cell className="text-gray-700 font-semibold">
            <DateFormatter epochDate={clas.date} />
          </Table.Cell>
          <Table.Cell className="text-gray-700 font-semibold">
            {formatTime(clas.date)}
          </Table.Cell>
          <Table.Cell className="text-gray-700 font-semibold">
            <div className="flex items-center gap-2 w-fit">
              {clas.recordingLink ? (
                <>
                  <Button
                    href={clas.recordingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="xs"
                    style={{
                      backgroundColor: institutionData.LightPrimaryColor,
                    }}
                    className="flex items-center justify-center gap-4"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    View Recording
                  </Button>
                  {(userType === "admin" || userType === "instructor") && (
                    <button
                      onClick={() =>
                        handleUpdateClick(clas.classId, clas.recordingLink)
                      }
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {userType === "admin" || userType === "instructor" ? (
                    <Button
                      onClick={() => handleUpdateClick(clas.classId, "")}
                      size="xs"
                      style={{
                        backgroundColor: "transparent",
                        border: "1px solid #000",
                      }}
                      className="flex items-center gap-2 text-black"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Add Recording
                    </Button>
                  ) : (
                    <p className="ml-2 text-gray-500">No Recording</p>
                  )}
                </>
              )}
            </div>
          </Table.Cell>
          {(userType === "admin" || userType === "instructor") && (
            <Table.Cell className="text-gray-700 font-semibold">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => handleAttendanceClick(clas.classId)}
                  size="xs"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #000",
                  }}
                  className="flex items-center gap-3 text-black"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Mark Attendance
                </Button>
              </div>
            </Table.Cell>
          )}
        </Table.Row>
      ))}
    </Table.Body>
  </Table>
);

export default SessionsTable;
