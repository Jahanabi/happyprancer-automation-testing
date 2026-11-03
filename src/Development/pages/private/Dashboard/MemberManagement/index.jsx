import React, { useState, useContext, useEffect } from "react";
import { Modal, Button } from "flowbite-react";
import { FaUserPlus, FaTrash, FaEdit, FaSearch, FaUsers } from "react-icons/fa";
// import { API } from "../../../../Context/ContextProvider";
import { toast } from "react-toastify";
import InstitutionContext from "../../../../Context/InstitutionContext";
import Context from "../../../../Context/Context";
import { deduplicateUserList } from "../../../../utils/userDeduplication";

const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const InstitutionData = useContext(InstitutionContext).institutionData;
  const UserCtx = useContext(Context);
  const { getMembers, addMember, updateMember, deleteMember } =
    useContext(Context);

  // Determine if current user should be allowed to add members
  // Check if they've reached their member limit
  const memberLimit = UserCtx?.userData?.members || 0;
  const canAddMember = members.length < memberLimit;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    relation: "",
    password: "",
  });

  const getJoiningDateTimestamp = (joiningDate) => {
    const numeric = Number(joiningDate);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric < 1e12 ? numeric * 1000 : numeric;
    }

    const parsed = Date.parse(joiningDate);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const formatJoiningDate = (joiningDate) => {
    const timestamp = getJoiningDateTimestamp(joiningDate);
    if (!timestamp) return "N/A";

    return new Date(timestamp).toLocaleDateString();
  };

  // Fetch members on component mount
  useEffect(() => {
    fetchMembers();
  }, []);

  // Filter members based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(
        (member) =>
          member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.emailId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.relation?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredMembers(filtered);
    }
  }, [searchTerm, members]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const response = await getMembers({
        cognitoId: UserCtx.userData?.cognitoId,
      });

      const getJoiningDateTimestamp = (joiningDate) => {
        const numeric = Number(joiningDate);
        if (Number.isFinite(numeric) && numeric > 0) {
          return numeric < 1e12 ? numeric * 1000 : numeric;
        }

        const parsed = Date.parse(joiningDate);
        return Number.isNaN(parsed) ? 0 : parsed;
      };
      // Map backend response to frontend format
      const mappedMembers = (response.members || [])
        .map((member) => ({
          ...member,
          name: member.userName || member.name,
          email: member.emailId || member.email,
          phone: member.phoneNumber || member.phone,
          memberId: member.cognitoId || member.memberId,
          joinedDateDisplay: formatJoiningDate(member.joiningDate),
        }))
        .sort(
          (a, b) =>
            getJoiningDateTimestamp(b?.joiningDate) -
            getJoiningDateTimestamp(a?.joiningDate),
        );

        const deduplicated = deduplicateUserList(mappedMembers);
        setMembers(deduplicated);
        setFilteredMembers(deduplicated);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
      setMembers([]);
      setFilteredMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Phone validation: must start with + and country code
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      toast.error("Please include country code. Example: +91 90000 00000");
      setIsSubmitting(false);
      return;
    }

    // Duplicate phone number check
    const normalizedNewPhone = formData.phone.replace(/\D/g, "");
    const isDuplicate = members.some(
      (member) =>
        member.phone && member.phone.replace(/\D/g, "") === normalizedNewPhone,
    );
    if (isDuplicate) {
      toast.error(
        "This phone number is already used by another family member.",
      );
      setIsSubmitting(false);
      return;
    }

    try {
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
      setIsAddModalOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        relation: "",
        password: "",
      });

      // Refresh members list
      fetchMembers();

      // Optionally reload user list in context
      if (UserCtx.getUserList) {
        UserCtx.getUserList();
      }
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to add member. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };;

  const handleEditMember = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      toast.error("Please include country code. Example: +91 90000 00000");
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare the data to send with correct field names for the backend
      const updateData = {
        cognitoId: selectedMember.cognitoId || selectedMember.memberId,
        institution: InstitutionData.InstitutionId,
        oldEmail: selectedMember.email || selectedMember.emailId, // Original email for Cognito update check
        email: formData.email, // New email
        userName: formData.name,
        phoneNumber: formData.phone,
        relation: formData.relation,
      };

      // Only include password if it was changed (not empty)
      if (formData.password && formData.password.trim() !== "") {
        updateData.password = formData.password;
      }

      const response = await updateMember(updateData);

      toast.success("Member updated successfully!");
      setIsEditModalOpen(false);
      setSelectedMember(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        relation: "",
        password: "",
      });

      // Refresh members list
      fetchMembers();
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to update member. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async () => {
    setIsSubmitting(true);

    try {
      await deleteMember({
        institution: InstitutionData.InstitutionId,
        cognitoId: selectedMember.cognitoId || selectedMember.memberId,
        emailId: selectedMember.emailId || selectedMember.email,
      });

      toast.success("Member removed successfully!");
      setIsDeleteModalOpen(false);
      setSelectedMember(null);

      // Refresh members list
      fetchMembers();
    } catch (error) {
      console.error("Error deleting member:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to remove member. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name || "",
      email: member.email || "",
      phone: member.phone || "",
      relation: member.relation || "",
      password: "", // Don't pre-fill password for security
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  };

  return (
    <div className="w-full h-full p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Header Section */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2 sm:p-3 rounded-xl shadow-sm flex-shrink-0"
              style={{
                backgroundColor: `${InstitutionData.PrimaryColor}15`,
                color: InstitutionData.PrimaryColor,
              }}>
              <FaUsers size={24} className="sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 truncate">
                Member Management
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm">
                Manage your team members and their roles
              </p>
            </div>
          </div>
          <button
            onClick={() => canAddMember && setIsAddModalOpen(true)}
            disabled={!canAddMember}
            title={
              !canAddMember
                ? `Member limit reached (${memberLimit} maximum)`
                : "Add Member"
            }
            className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg font-medium text-white shadow-md transition-all duration-200 transform text-sm sm:text-base whitespace-nowrap ${
              canAddMember
                ? "hover:shadow-lg hover:-translate-y-0.5"
                : "opacity-50 cursor-not-allowed hover:shadow-none hover:translate-y-0"
            }`}
            style={{
              backgroundColor: InstitutionData.PrimaryColor,
            }}>
            <FaUserPlus size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>Add Member</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <FaSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{
              focusRing: InstitutionData.PrimaryColor,
            }}
          />
        </div>
      </div>

      {/* Members List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
              style={{
                borderColor: `${InstitutionData.PrimaryColor}40`,
              }}></div>
            <p className="text-gray-500">Loading members...</p>
          </div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm px-4">
          <FaUsers
            size={48}
            className="mx-auto mb-4 text-gray-300 sm:w-16 sm:h-16"
          />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
            {searchTerm ? "No members found" : "No members yet"}
          </h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6">
            {searchTerm
              ? "Try adjusting your search criteria"
              : "Get started by adding your first team member"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => canAddMember && setIsAddModalOpen(true)}
              disabled={!canAddMember}
              title={
                !canAddMember
                  ? `Member limit reached (${memberLimit} maximum)`
                  : "Add Your First Member"
              }
              className={`px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium text-white shadow-md transition-all text-sm sm:text-base ${
                canAddMember
                  ? "hover:shadow-lg"
                  : "opacity-50 cursor-not-allowed"
              }`}
              style={{
                backgroundColor: InstitutionData.PrimaryColor,
              }}>
              Add Your First Member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member, index) => (
            <div
              key={member.memberId || index}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-6 border border-gray-100">
              {/* Member Header */}
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  {member.imgUrl ? (
                    <img
                      src={member.imgUrl}
                      alt={member.name}
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center text-white font-semibold text-base sm:text-lg shadow-sm flex-shrink-0"
                      style={{
                        backgroundColor: InstitutionData.PrimaryColor,
                      }}>
                      {getInitials(member.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-base sm:text-lg truncate">
                      {member.name || "Unknown"}
                    </h3>
                    {member.relation && (
                      <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium capitalize border bg-blue-50 text-blue-700 border-blue-200 mt-1">
                        {member.relation}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Member Details */}
              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="truncate">{member.email || "No email"}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>{member.phone}</span>
                  </div>
                )}
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10m-11 8h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Joined: {member.joinedDateDisplay}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 sm:pt-4 border-t border-gray-100">
                <button
                  onClick={() => openEditModal(member)}
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors duration-200 font-medium text-xs sm:text-sm">
                  <FaEdit size={13} className="sm:w-3.5 sm:h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => openDeleteModal(member)}
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 font-medium text-xs sm:text-sm">
                  <FaTrash size={13} className="sm:w-3.5 sm:h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        show={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        size="lg"
        position="center"
        className="p-4">
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
          <form onSubmit={handleAddMember} className="space-y-4">
            {/* Name and Email in first row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Enter full name"
                  required
                />
              </div>

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

            {/* Phone and Relation in second row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="+91 90000 00000"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Include country code (e.g., +91 for India)
                </p>
              </div>

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
                  placeholder="e.g., Parent, Sibling, Guardian"
                  required
                />
              </div>
            </div>

            {/* Password spans full width */}
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

            <div className="flex justify-end gap-3 pt-4">
              <Button
                color="light"
                onClick={() => setIsAddModalOpen(false)}
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

      {/* Edit Member Modal */}
      <Modal
        show={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        size="xl"
        position="center">
        <Modal.Header>
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: `${InstitutionData.PrimaryColor}15`,
                color: InstitutionData.PrimaryColor,
              }}>
              <FaEdit size={20} />
            </div>
            <span className="text-xl font-bold text-gray-800">Edit Member</span>
          </div>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleEditMember} className="space-y-4">
            {/* Name and Email in first row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-email"
                  className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-email"
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

            {/* Phone and Relation in second row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="edit-phone"
                  className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  placeholder="+91 90000 00000"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Include country code (e.g., +91 for India)
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-relation"
                  className="block text-sm font-medium text-gray-700">
                  Relation <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-relation"
                  name="relation"
                  type="text"
                  value={formData.relation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  placeholder="e.g., Parent, Sibling, Guardian"
                  required
                />
              </div>
            </div>

            {/* Password spans full width */}
            <div className="space-y-2">
              <label
                htmlFor="edit-password"
                className="block text-sm font-medium text-gray-700">
                Password{" "}
                <span className="text-gray-500">
                  (Leave empty to keep current)
                </span>
              </label>
              <input
                id="edit-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="Enter new password"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                color="light"
                onClick={() => setIsEditModalOpen(false)}
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
                    <span>Updating...</span>
                  </div>
                ) : (
                  "Update Member"
                )}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        size="md"
        position="center">
        <Modal.Header>
          <span className="text-xl font-bold text-gray-800">Remove Member</span>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center py-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <FaTrash className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Are you sure?
            </h3>
            <p className="text-gray-500 mb-4">
              Do you want to remove{" "}
              <span className="font-semibold">{selectedMember?.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                color="light"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSubmitting}
                className="rounded">
                Cancel
              </Button>
              <Button
                onClick={handleDeleteMember}
                disabled={isSubmitting}
                className="rounded bg-red-600 hover:bg-red-700 text-white">
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Removing...</span>
                  </div>
                ) : (
                  "Remove Member"
                )}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default MemberManagement;
