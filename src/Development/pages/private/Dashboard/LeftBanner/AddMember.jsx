import React, { useState, useContext } from "react";
import { Modal, Button } from "flowbite-react";
import { FaUserPlus, FaTimes } from "react-icons/fa";
// import { API } from "../../../../Context/ContextProvider";
import { toast } from "react-toastify";
import InstitutionContext from "../../../../Context/InstitutionContext";
import Context from "../../../../Context/Context";

const AddMember = ({ isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const UserCtx = useContext(Context);
  const { addMember } = useContext(Context);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    relation: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Add your API call here to add a new member
      const response = await addMember({
          institutionId: InstitutionData.InstitutionId,
          userName: formData.name,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phone,
          cognitoId: UserCtx.userData?.cognitoId,
          relation: formData.relation,
      });

      toast.success("Member added successfully!");
      onClose();
      setFormData({
        name: "",
        email: "",
        phone: "",
        relation: "",
        password: "",
      });

      // Optionally reload user list
      if (UserCtx.getUserList) {
        UserCtx.getUserList();
      }
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to add member. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Add Member Modal */}
      <Modal show={isOpen} onClose={onClose} size="xl" position="center">
        <Modal.Header>
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: `${InstitutionData.PrimaryColor}15`,
                color: InstitutionData.PrimaryColor,
              }}>
              <FaUserPlus size={20} />
            </div>
            <span className="text-xl font-bold text-gray-800">
              Add New Member
            </span>
          </div>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Row: Name and Email */}
            <div className="grid grid-cols-2 gap-4">
              {/* Name Field */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{
                    focusRing: InstitutionData.PrimaryColor,
                  }}
                  placeholder="Enter full name"
                  required
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>

            {/* Second Row: Phone and Relation */}
            <div className="grid grid-cols-2 gap-4">
              {/* Phone Field */}
              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              {/* Relation Field */}
              <div className="space-y-2">
                <label
                  htmlFor="relation"
                  className="block text-sm font-medium text-gray-700">
                  Relation <span className="text-red-500">*</span>
                </label>
                <input
                  id="relation"
                  name="relation"
                  type="text"
                  value={formData.relation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  placeholder="e.g., Parent, Sibling"
                  required
                />
              </div>
            </div>

            {/* Third Row: Password (Full Width) */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="Enter password"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                color="light"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: InstitutionData.PrimaryColor,
                }}
                className="rounded text-white">
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Adding...</span>
                  </div>
                ) : (
                  "Add Member"
                )}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default AddMember;
