// ConfirmDeleteModal.jsx
import React from "react";
import { Modal, Button } from "flowbite-react";

const ConfirmDeleteModal = ({ showModal, setShowModal, onConfirm, onCancel }) => {
  return (
    <Modal show={showModal} onClose={() => setShowModal(false)} size="md">
      <Modal.Body>
        <div className="text-center">
          <h3 className="mb-5 text-lg font-normal text-gray-500">
            Are you sure you want to delete this user?
          </h3>
          <div className="flex justify-center gap-4">
            <Button className="bg-primaryColor hover:bg-primaryColor/90" onClick={onConfirm}>
              Yes, delete
            </Button>
            <Button color="gray" onClick={onCancel}>
              No, cancel
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ConfirmDeleteModal;
