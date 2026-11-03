import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import Context from "../../../../Context/Context";
import InstitutionContext from "../../../../Context/InstitutionContext";
import PaginationComponent from "../../../../common/Pagination";
import { toast } from "react-toastify";
// import { API } from "../../../../Context/ContextProvider";

const InstructorListMobile = ({ instructorList = [] }) => {
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const filteredInstructorList = instructorList;
  const navigate = useNavigate();
  const {
    getInstructorList,
    getInstructorAttendance,
    instructorCashout,
    updateInstructor,
  } = useContext(Context);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    emailId: "",
    position: "",
    paymentDate: "",
    currency: "INR",
    // per-class fields for mobile edit modal
    perClassAmount: "",
    perClassCurrency: "INR",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 4;
  // attendance state for mobile: map of instructorId -> { total, itemsLoaded, loading }
  const [attendanceState, setAttendanceState] = useState({});
  const inFlightFetchRef = useRef(new Set());

  const parseInstructorAttendanceToClasses = useCallback(
    (attendanceItems = [], instructor) => {
      const classes = [];
      attendanceItems.forEach((item) => {
        const list = item.classTaken || item.classTakenList || [];
        (Array.isArray(list) ? list : [list]).forEach((ct) => {
          if (!ct) return;

          // Support both legacy string entries and modern object entries
          let classType = "";
          let ms = null;
          let classId = null;

          if (typeof ct === "string") {
            const m = ct.match(/^(.*?):\s*(\d+)$/);
            if (!m) return;
            classType = m[1];
            ms = Number(m[2]);
          } else if (typeof ct === "object") {
            classType = ct.classType || ct.classTypeName || "";
            ms = Number(ct.timestampMs || ct.timestamp || ct.ts || 0);
            classId = ct.classId || ct.id || null;
            if (!ms && item && item.date) {
              const dnum = Number(item.date);
              ms = dnum > 1e12 ? dnum : dnum > 1e9 ? dnum * 1000 : dnum;
            }
          } else {
            return;
          }

          if (!ms) return;
          if (ms < 1e12) ms = ms * 1000;

          classes.push({
            classId:
              classId ||
              `${
                instructor?.instructorId || item.cognitoId
              }-${ms}-${classType}`,
            classType,
            date: ms,
            instructorNames:
              instructor?.name || instructor?.instructorNames || "",
            zoomLink: item.zoomLink || "",
            raw: item,
          });
        });
      });
      classes.sort((a, b) => a.date - b.date);
      return classes;
    },
    [],
  );
  // Payment related states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedInstructors = filteredInstructorList.slice(
    startIndex,
    endIndex,
  );

  // Batch fetch attendance for visible instructors on mobile
  const fetchAttendanceForInstructors = async (ids = []) => {
    if (!ids || ids.length === 0) return;
    const month = new Date().getUTCMonth() + 1;
    const year = new Date().getUTCFullYear();

    // mark loading for ids
    setAttendanceState((s) => {
      const next = { ...s };
      ids.forEach((id) => {
        next[id] = { ...(next[id] || {}), loading: true };
        inFlightFetchRef.current.add(id);
      });
      return next;
    });

    try {
      const r = await getInstructorAttendance(InstitutionData.InstitutionId, {
        cognitoIds: JSON.stringify(ids),
        month,
        year,
      });

      const results = r && r.results ? r.results : [];

      // map results by cognitoId
      const byId = {};
      results.forEach((res) => {
        const id =
          res.cognitoId ||
          (res.instructor && res.instructor.instructorId) ||
          res.instructorId;
        const attendanceItems =
          res.attendance || res.attendancePaged || res.attendanceByDay || [];
        const parsed = parseInstructorAttendanceToClasses(
          attendanceItems,
          res.instructor || { instructorId: id, name: res.name },
        );
        byId[id] = parsed;
      });

      // update attendanceState for requested ids
      setAttendanceState((s) => {
        const next = { ...s };
        ids.forEach((id) => {
          const parsed = byId[id] || [];
          next[id] = {
            total: parsed.length,
            itemsLoaded: true,
            loading: false,
          };
          inFlightFetchRef.current.delete(id);
        });
        return next;
      });
    } catch (err) {
      console.error("Failed to fetch mobile attendance batch:", err);
      // clear loading for ids

      setAttendanceState((s) => {
        const next = { ...s };
        ids.forEach((id) => {
          next[id] = { ...(next[id] || {}), loading: false };
          inFlightFetchRef.current.delete(id);
        });
        return next;
      });
    }
  };

  // auto-fetch when paginatedInstructors changes
  useEffect(() => {
    const idsToFetch = paginatedInstructors
      .map((inst) => inst.instructorId)
      .filter((id) => {
        if (!id) return false;
        const state = attendanceState[id];
        return (
          !(state && state.itemsLoaded) && !inFlightFetchRef.current.has(id)
        );
      });
    if (idsToFetch.length > 0) {
      fetchAttendanceForInstructors(idsToFetch);
    }
  }, [paginatedInstructors]);

  const handleEditClick = (instructor) => {
    setSelectedInstructor(instructor);
    setEditForm({
      name: instructor.name,
      emailId: instructor.emailId,
      position: instructor.position,
      image: instructor.image || "",
      perClassAmount:
        typeof instructor.perClassAmount === "number" &&
        instructor.perClassAmount > 0
          ? (instructor.perClassAmount / 100).toFixed(2)
          : "",
      perClassCurrency: instructor.perClassCurrency || "INR",
    });
    setShowEditModal(true);
  };

  // Payment handler functions
  const handlePaymentClick = (instructor) => {
    setSelectedInstructor(instructor);
    setPaymentAmount("");
    setEditForm((prev) => ({
      ...prev,
      paymentDate: "",
      currency: "INR",
    }));
    setShowPaymentModal(true);
  };

  const handlePaymentChange = (e) => {
    const value = e.target.value;
    const maxAmount = (selectedInstructor?.bonus ?? 0) / 100;
    if (
      value === "" ||
      (!isNaN(value) && Number(value) >= 0 && Number(value) <= maxAmount)
    ) {
      setPaymentAmount(value);
    } else {
      toast.error(`Amount cannot exceed ₹${maxAmount.toFixed(2)}`);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!paymentAmount || isNaN(paymentAmount)) {
      return toast.error("Enter a valid amount");
    }
    try {
      setIsSubmitting(true);
      const amt = parseFloat(paymentAmount);

      if (amt <= 0) {
        return toast.error("Enter a valid amount");
      }
      if (!editForm.paymentDate) {
        return toast.error("Payment date cannot be empty");
      }
      const epochPaymentDate = new Date(editForm.paymentDate).getTime();
      if (epochPaymentDate > Date.now()) {
        return toast.error("Payment date cannot be in the future");
      }
      if (editForm.paymentDate > new Date().toISOString().split("T")[0]) {
        return toast.error("Payment date cannot be in the future");
      }
      if (editForm.transactionId?.trim() === "") {
        return toast.error("Transaction ID cannot be empty");
      }

      // Record payment
      await instructorCashout(InstitutionData.InstitutionId, {
        instructorId: selectedInstructor.instructorId,
        amount: amt,
        currency: editForm.currency || "INR",
        paymentDate: epochPaymentDate,
        transactionId: editForm.transactionId,
      });
      // Update local list
      await getInstructorList();
      toast.success("Payment recorded");
      setShowPaymentModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // convert perClassAmount to paise (minor units) when provided
      const perClassAmountPaise =
        editForm.perClassAmount !== undefined && editForm.perClassAmount !== ""
          ? Math.round(parseFloat(editForm.perClassAmount) * 100)
          : null;

      const bodyToSend = {
        instructorId: selectedInstructor.instructorId,
        ...editForm,
        image: editForm.image || selectedInstructor.image || "",
        perClassAmount: perClassAmountPaise,
        perClassCurrency:
          editForm.perClassCurrency || editForm.currency || "INR",
      };

      const response = await updateInstructor(
        InstitutionData.InstitutionId,
        selectedInstructor.instructorId,
        bodyToSend,
      );

      if (response) {
        toast.success("Instructor updated successfully!");
        setShowEditModal(false);
        await getInstructorList(); // Refresh the list
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update instructor");
    }
  };

  // Get initials for profile pictures
  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "";
    const initials = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
    return initials;
  };

  const getColor = () => {
    return InstitutionData.PrimaryColor;
  };

  return (
    <div className="flex flex-col w-full">
      {/* Instructor Cards */}
      <div className="w-[99vw] px-4 space-y-3">
        {paginatedInstructors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No instructors found
          </div>
        ) : (
          paginatedInstructors.map((instructor) => (
            <div
              key={instructor.instructorId}
              className="w-full bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Profile Picture */}
                  {instructor.image ? (
                    <img
                      src={instructor.image}
                      alt={instructor.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{
                        backgroundColor: getColor(),
                      }}>
                      {getInitials(instructor.name)}
                    </div>
                  )}

                  {/* Instructor Info */}
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {instructor.name}
                    </h4>
                    <div className="text-sm text-gray-500">
                      <div>{instructor.emailId}</div>
                      <div>{instructor.position}</div>
                    </div>
                    <div className="mt-1 text-sm flex items-center gap-4">
                      <div>
                        <span className="font-medium">Bonus:</span> ₹
                        {((instructor.bonus ?? 0) / 100).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {attendanceState[instructor.instructorId]?.loading ? (
                          <span className="text-xs text-gray-400">
                            Loading classes...
                          </span>
                        ) : (
                          <span className="text-xs">
                            Classes this month:{" "}
                            {attendanceState[instructor.instructorId]?.total ??
                              0}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleEditClick(instructor)}
                    className="p-2 text-gray-600 hover:text-gray-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                      />
                    </svg>
                  </button>
                  {parseFloat(instructor?.bonus) / 100 > 0 && (
                    <button
                      onClick={() => handlePaymentClick(instructor)}
                      className="p-2 text-gray-600 hover:text-gray-800">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                        />
                      </svg>
                    </button>
                  )}
                  {/* View Calendar - mobile: navigates to calendar page for this instructor */}
                  <button
                    onClick={() =>
                      navigate(
                        `/instructor-calendar/${instructor.instructorId}`,
                        {
                          state: { instructor },
                        },
                      )
                    }
                    className="p-2 text-gray-600 hover:text-gray-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      className="w-5 h-5">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination - Show only if there are more than itemsPerPage instructors */}
      {filteredInstructorList.length > itemsPerPage && (
        <div className="mt-4 px-4">
          <PaginationComponent
            showIcons={true}
            data={filteredInstructorList}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
            hideResultsText={true}
          />
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Instructor</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="emailId"
                  value={editForm.emailId}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={editForm.position}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* Per-class pricing fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Per-class Currency
                  </label>
                  <select
                    name="perClassCurrency"
                    value={editForm.perClassCurrency || "INR"}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="INR">₹ INR</option>
                    <option value="USD">$ USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Per-class Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500 text-sm">
                      {editForm.perClassCurrency === "INR" ||
                      editForm.perClassCurrency === undefined
                        ? "₹"
                        : "$"}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="perClassAmount"
                      value={editForm.perClassAmount}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md"
                  onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-md"
                  style={{
                    backgroundColor: InstitutionData.PrimaryColor,
                  }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInstructor && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Add Payment to {selectedInstructor.name}
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID
                </label>
                <input
                  type="text"
                  name="transactionId"
                  value={editForm.transactionId || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter transaction ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={((selectedInstructor?.bonus ?? 0) / 100).toFixed(2)}
                  value={paymentAmount}
                  onChange={handlePaymentChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter payment amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of payment
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={editForm.paymentDate || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  name="currency"
                  value={editForm.currency || "INR"}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md disabled:opacity-50"
                  onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !paymentAmount ||
                    isNaN(paymentAmount) ||
                    Number(paymentAmount) >
                      (selectedInstructor?.bonus ?? 0) / 100
                  }
                  className="px-4 py-2 text-white rounded-md relative disabled:opacity-50"
                  style={{
                    backgroundColor: InstitutionData.PrimaryColor,
                  }}>
                  {isSubmitting ? (
                    <>
                      <span className="opacity-0">Submit</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorListMobile;
