import React, { useState, useContext } from "react";
import { Modal } from "flowbite-react"; // Import Flowbite Modal
import BirthdayCard from "./BirthdayCard"; // Your BirthdayCard component
import Context from "../../../../Context/Context";

const BirthdayModal = () => {
  const UserCtx = useContext(Context).userData;
  const [openModal, setOpenModal] = useState(UserCtx?.showBirthdayModal?.showCard);

  const handleClose = () => {
    setOpenModal(false);
    // Window refresh once
    window.location.reload();
  };
  return (
    <>
      {/* Flowbite Modal */}
      <Modal
        show={openModal}
        onClose={handleClose}
        size="xl"
        position="center"
      >
        <Modal.Header>🎉Wishing You Birthday 🎂</Modal.Header>
        <Modal.Body>
          {/* Display the BirthdayCard in the modal */}
          <BirthdayCard userName={UserCtx.userName}/>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleClose}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default BirthdayModal;
