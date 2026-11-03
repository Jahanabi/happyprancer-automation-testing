import { Button } from "flowbite-react";
import React from "react";

const UpdateRecordingModal = ({
  showUpdateModal,
  setShowUpdateModal,
  recordingLink,
  setRecordingLink,
  onRecordingUpdate,
  selectedClassId,
  institutionData,
}) => (
  showUpdateModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] max-w-[90%]">
        <h3 className="text-lg font-semibold mb-4">Update Recording Link</h3>
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
            <Button
              color="gray"
              onClick={() => {
                setShowUpdateModal(false);
                setSelectedClassId(null);
                setRecordingLink("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              style={{
                backgroundColor: institutionData.LightPrimaryColor,
              }}
            >
              Update
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
);

export default UpdateRecordingModal;