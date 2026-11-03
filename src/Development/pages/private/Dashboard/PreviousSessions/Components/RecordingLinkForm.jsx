import React from "react";
import { Button2 } from "../../../../../common/Inputs";

const RecordingLinkForm = ({
  recordingLink,
  setRecordingLink,
  onRecordingUpdate,
  institutionData,
  classId,
}) => (
  <form className={`flex gap-6 w-[88%] Sansita`}>
    <input
      placeholder="Recording Link"
      className={`text-[#0008] sans-sarif px-4 py-1 rounded-lg w-[85%]`}
      style={{
        backgroundColor: institutionData.LightestPrimaryColor,
      }}
      value={recordingLink}
      onChange={(e) => setRecordingLink(e.target.value)}
    />
    <Button2 fn={onRecordingUpdate} data="Update" w="6rem" />
  </form>
);

export default RecordingLinkForm;