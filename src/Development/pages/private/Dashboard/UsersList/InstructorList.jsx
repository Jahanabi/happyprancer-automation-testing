import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import Context from "../../../../Context/Context";
import { useNavigate } from "react-router-dom";
import { Table, Modal, Pagination } from "flowbite-react";
import { Avatar } from "flowbite-react";
import InstitutionContext from "../../../../Context/InstitutionContext";
import { Edit, Eye } from "lucide-react";
import { toast } from "react-toastify";
import { BsCashStack } from "react-icons/bs";
// import { API } from "../../../../Context/ContextProvider";
import Calendar from "../../../../common/Calendar";
import { deduplicateUserList } from "../../../../utils/userDeduplication";

function InstructorList({ instructorList, getInstructorList }) {
  console.log("InstructorList received:", instructorList);
  const InstitutionData = useContext(InstitutionContext).institutionData;

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    emailId: "",
    position: "",
    paymentDate: "",
    currency: "INR",
    // per-class fields for instructor pricing (displayed in major units)
    perClassAmount: "",
    perClassCurrency: "INR",
    instructorStatus: "Active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedInstructor, setPaginatedInstructor] = useState([]);
  const [instructorStatus, setInstructorStatus] = useState("All");

  const itemsPerPage = 5;

  const Ctx = useContext(Context);
  const { userList, updateInstructor, instructorCashout, getInstructorAttendance } = Ctx;
  const navigate = useNavigate();

  useEffect(() => {
    const canonicalMembers = deduplicateUserList(userList || []);
    const canonicalInstructors = deduplicateUserList(instructorList || []);

    if (canonicalMembers.length && canonicalInstructors.length) {
      const updatedInstructors = countInstructorReferrals(
        canonicalMembers,
        canonicalInstructors
      );
      setPaginatedInstructor(updatedInstructors);
    } else {
      setPaginatedInstructor(canonicalInstructors);
    }
  }, [instructorList, userList]);

  function countInstructorReferrals(userList, instructors) {
    // Log the raw data for debugging
    console.log("UserList sample:", userList.slice(0, 2));
    console.log("InstructorList sample:", instructors.slice(0, 2));

    return instructors.map((instructor) => {
      // Try different possible property names for referral codes
      const instructorCode =
        instructor.referral_code ||
        instructor.referralCode ||
        instructor.referralId ||
        instructor.instructorId;

      const referralCount = userList.reduce((count, user) => {
        const userCode =
          user.referred_code ||
          user.referredCode ||
          user.referral_code ||
          user.instructorId;

        // Check if codes match and handle undefined cases
        const isMatch =
          userCode && instructorCode && userCode === instructorCode;
        return count + (isMatch ? 1 : 0);
      }, 0);

      console.log(
        `${instructor.name}: InstructorCode=${instructorCode}, Count=${referralCount}`
      );

      return {
        ...instructor,
        referralCount: referralCount,
      };
    });
  }

  const filteredInstructorList = paginatedInstructor.filter((instructor) => {
    // "All" shows every instructor
    if (instructorStatus === "All") {
      return true;
    }

    // Treat instructors without a status as Active
    const status = instructor.instructorStatus || "Active";

    return status.toLowerCase() === instructorStatus.toLowerCase();
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedInstructors = filteredInstructorList.slice(
      startIndex,
      endIndex,
  );

  const handleEditClick = (instructor) => {
    setSelectedInstructor(instructor);
    setEditForm({
      name: instructor.name,
      emailId: instructor.emailId,
      position: instructor.position,
      image: instructor.image || "",
      // Convert stored paise (if present) to major unit string for editing
      perClassAmount:
        typeof instructor.perClassAmount === "number" &&
        instructor.perClassAmount > 0
          ? (instructor.perClassAmount / 100).toFixed(2)
          : "",
      perClassCurrency: instructor.perClassCurrency || "INR",
      instructorStatus: instructor.instructorStatus || "Active",
    });
    setShowEditModal(true);
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
      // Convert perClassAmount from major units (string) to paise (integer)
      const perClassAmountPaise =
        editForm.perClassAmount !== undefined && editForm.perClassAmount !== ""
          ? Math.round(parseFloat(editForm.perClassAmount) * 100)
          : null;

      const bodyToSend = {
        instructorId: selectedInstructor.instructorId,
        // spread other editable fields but ensure perClassAmount is sent as paise
        ...editForm,
        image: editForm.image || selectedInstructor.image || "",
        perClassAmount: perClassAmountPaise,
        perClassCurrency:
          editForm.perClassCurrency || editForm.currency || "INR",
        instructorStatus: editForm.instructorStatus || "Active",
      };

      const response = await updateInstructor(InstitutionData.InstitutionId, selectedInstructor.instructorId, bodyToSend);

      if (response) {
        toast.success("Instructor updated successfully!");
        setShowEditModal(false);
        await getInstructorList();
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update instructor");
    }
  };

  const handlePaymentClick = (instructor) => {
    setSelectedInstructor(instructor);
    setPaymentAmount("");
    const defaultCurrency =
      instructor?.country?.toLowerCase() === "india" ||
      instructor?.phoneNumber?.startsWith("+91")
        ? "INR"
        : "USD";

    setEditForm((prev) => ({
      ...prev,
      paymentDate: "",
      currency: defaultCurrency,
      transactionId: "",
    }));

    setShowPaymentModal(true);
  };

  // Submit payment and deduct from bonus
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    console.log(e);
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
      if (editForm.transactionId.trim() === "") {
        return toast.error("Transaction ID cannot be empty");
      }

      const epochPaymentDate = new Date(editForm.paymentDate).getTime();
      if (epochPaymentDate > Date.now()) {
        return toast.error("Payment date cannot be in the future");
      }

      // 1) record payment
      await instructorCashout(InstitutionData.InstitutionId, {
          instructorId: selectedInstructor.instructorId,
          amount: amt,
          currency: editForm.currency || "INR",
          paymentDate: epochPaymentDate,
          transactionId: editForm.transactionId,
      });
      // 2) update local list
      await getInstructorList(); // refresh the full list
      toast.success("Payment recorded");
      setShowPaymentModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
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

  // (Calendar is now shown on its own page; navigation replaces the modal.)
  // per-instructor paginated monthly attendance state
  // shape: { [instructorId]: { items: [], page: 1, pageSize: 5, totalPages: 1, total: 0, loading: false, month, year } }
  const [attendanceState, setAttendanceState] = useState({});
  // track in-flight batch fetches so we don't fire duplicate requests
  const inFlightFetchRef = useRef(new Set());

  // Batch fetch attendance for multiple instructors in one request
  const fetchAttendanceForInstructors = async (
    instructorIds = [],
    page = 1,
    pageSize = 5,
    month = new Date().getUTCMonth() + 1,
    year = new Date().getUTCFullYear()
  ) => {
    if (!instructorIds || instructorIds.length === 0) return;

    // prepare keys for in-flight tracking
    const fetchKeys = instructorIds.map(
      (id) => `${id}-${month}-${year}-p${page}`
    );

    // add to in-flight set
    fetchKeys.forEach((k) => inFlightFetchRef.current.add(k));

    // mark all as loading
    setAttendanceState((s) => {
      const next = { ...s };
      instructorIds.forEach((id) => {
        next[id] = { ...(next[id] || {}), loading: true };
      });
      return next;
    });

    try {
      const res = await getInstructorAttendance(InstitutionData.InstitutionId, {
          cognitoIds: JSON.stringify(instructorIds),
          month,
          year,
          page,
          pageSize,
      });

      const results = res && res.results ? res.results : [];

      // build a new attendance state map for the returned instructors
      setAttendanceState((s) => {
        const next = { ...s };
        // results may be an array of objects with cognitoId and attendance fields
        results.forEach((r) => {
          const instId = r.cognitoId || r.instructorId;
          const first = r || {};
          const items =
            first.attendancePaged ||
            first.attendance ||
            first.attendanceByDay ||
            [];
          const total =
            res.total ||
            first.total ||
            (Array.isArray(items) ? items.length : 0);
          const totalPages =
            res.totalPages ||
            first.totalPages ||
            Math.max(1, Math.ceil(total / pageSize));

          if (instId) {
            next[instId] = {
              items: Array.isArray(items) ? items : [],
              page,
              pageSize,
              total,
              totalPages,
              loading: false,
              itemsLoaded: true,
              month,
              year,
            };
          }
        });

        // For any requested id not present in results, mark as loaded empty
        instructorIds.forEach((id) => {
          if (!next[id] || !next[id].itemsLoaded) {
            next[id] = {
              ...(next[id] || {}),
              items: [],
              page,
              pageSize,
              total: 0,
              totalPages: 1,
              loading: false,
              itemsLoaded: true,
              month,
              year,
            };
          }
        });

        return next;
      });
    } catch (err) {
      console.error("Failed to batch fetch instructor attendance:", err);
      // clear loading flags on error
      setAttendanceState((s) => {
        const next = { ...s };
        instructorIds.forEach((id) => {
          next[id] = { ...(next[id] || {}), loading: false };
        });
        return next;
      });
    } finally {
      // remove in-flight markers
      fetchKeys.forEach((k) => inFlightFetchRef.current.delete(k));
    }
  };

  // Auto-load attendance for instructors visible on the current table page (batch request)
  useEffect(() => {
    const month = new Date().getUTCMonth() + 1;
    const year = new Date().getUTCFullYear();
    const idsToFetch = paginatedInstructors
      .map((inst) => inst.instructorId)
      .filter((id) => {
        const state = attendanceState[id];
        const key = `${id}-${month}-${year}-p1`;
        // skip if already loaded or currently being fetched
        return (
          (!state || !state.itemsLoaded) && !inFlightFetchRef.current.has(key)
        );
      });

    if (idsToFetch.length > 0) {
      // fire-and-forget batch fetch
      fetchAttendanceForInstructors(idsToFetch, 1, 5, month, year);
    }
  }, [paginatedInstructors]);

  const parseInstructorAttendanceToClasses = useCallback(
    (attendanceItems = [], instructor) => {
      const classes = [];
      attendanceItems.forEach((item) => {
        // item.classTaken is expected to be a list of strings like "Yoga: 1763317800000"
        const list = item.classTaken || item.classTakenList || [];
        (Array.isArray(list) ? list : [list]).forEach((ct) => {
          if (!ct) return;

          // Accept both legacy string entries and modern object entries
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
          // normalize to milliseconds
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
      // sort by date
      classes.sort((a, b) => a.date - b.date);
      return classes;
    },
    []
  );

  // Summarize classes from attendance items: return a short string like "Yoga (2), Bworkz (1)"
  const summarizeClasses = useCallback((attendanceItems = []) => {
    if (!Array.isArray(attendanceItems) || attendanceItems.length === 0)
      return "No classes";
    const counts = {};
    attendanceItems.forEach((item) => {
      const list = item.classTaken || item.classTakenList || [];
      (Array.isArray(list) ? list : [list]).forEach((ct) => {
        if (!ct) return;
        let classType = "";
        if (typeof ct === "string") {
          const m = ct.match(/^(.*?):\s*(\d+)$/);
          if (!m) return;
          classType = m[1].trim();
        } else if (typeof ct === "object") {
          classType = (ct.classType || ct.classTypeName || "")
            .toString()
            .trim();
          // If classType missing but item has date, still count it under empty string
        } else {
          return;
        }
        counts[classType] = (counts[classType] || 0) + 1;
      });
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return "No classes";
    // sort by count desc
    entries.sort((a, b) => b[1] - a[1]);
    // build display string, show up to 3 types then +N more
    const parts = entries.slice(0, 3).map(([type, cnt]) => `${type} (${cnt})`);
    if (entries.length > 3) parts.push(`+${entries.length - 3} more`);
    return parts.join(", ");
  }, []);

  // Navigate to calendar page for instructor instead of opening a modal
  const handleViewInstructor = (instructor) => {
    const path = `/instructor-calendar/${instructor.instructorId}`;
    try {
      navigate(path, { state: { instructor } });
    } catch (err) {
      console.error("Failed to navigate to instructor calendar", err);
      toast.error("Failed to open instructor calendar");
    }
  };

  // fetch paginated monthly attendance for a particular instructor (used in table cell)
  const fetchInstructorAttendancePage = async (
    instructorId,
    page = 1,
    pageSize = 5,
    month = new Date().getUTCMonth() + 1,
    year = new Date().getUTCFullYear()
  ) => {
    setAttendanceState((s) => ({
      ...s,
      [instructorId]: { ...(s[instructorId] || {}), loading: true },
    }));
    try {
      const res = await getInstructorAttendance(InstitutionData.InstitutionId, {
          cognitoIds: JSON.stringify([instructorId]),
          month,
          year,
          page,
          pageSize,
      });

      const results = res && res.results ? res.results : [];
      const first = results[0] || {};

      // Try to find paginated fields in response; be defensive about structure
      const items =
        first.attendancePaged ||
        first.attendance ||
        first.attendanceByDay ||
        [];
      const total =
        res.total || first.total || (Array.isArray(items) ? items.length : 0);
      const totalPages =
        res.totalPages ||
        first.totalPages ||
        Math.max(1, Math.ceil(total / pageSize));

      setAttendanceState((s) => ({
        ...s,
        [instructorId]: {
          items: Array.isArray(items) ? items : [],
          page,
          pageSize,
          total,
          totalPages,
          loading: false,
          itemsLoaded: true,
          month,
          year,
        },
      }));
    } catch (err) {
      console.error("Failed to fetch paged instructor attendance:", err);
      setAttendanceState((s) => ({
        ...s,
        [instructorId]: { ...(s[instructorId] || {}), loading: false },
      }));
    }
  };

  // Calendar interactions moved to calendar page; no in-component view-change handler required.

  // Rest of the component (Table, Pagination, Modal) remains the same
  return (
    <div className="w-full p-4">
      <div className="w-full overflow-x-auto">
        <Table hoverable striped>
          <Table.Head>
            <Table.HeadCell className="font-semibold pl-20">
              Name
            </Table.HeadCell>
            <Table.HeadCell className="font-semibold pl-7">
              Email
            </Table.HeadCell>
            <Table.HeadCell className="font-semibold">Position</Table.HeadCell>
            <Table.HeadCell className="font-semibold pl-10">
              Bonus
            </Table.HeadCell>
            <Table.HeadCell className="font-semibold pl-10">
              ReferralCount
            </Table.HeadCell>
            <Table.HeadCell className="font-semibold pl-10">
              Monthly Attendance
            </Table.HeadCell>
            <Table.HeadCell className="font-semibold pl-10">
              Action
            </Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {paginatedInstructors.map((instructor) => {
              const instState = attendanceState[instructor.instructorId] || {
                items: [],
                page: 1,
                pageSize: 5,
                totalPages: 1,
                total: 0,
                loading: false,
              };
              return (
                <Table.Row key={instructor.instructorId} className="border-b">
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <Avatar
                        img={instructor.image}
                        alt={instructor.name}
                        rounded
                        size="md"
                        className="w-12 h-12"
                      />
                      <div className="font-medium text-gray-700">
                        {instructor.name}
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="text-gray-700 font-semibold">
                    {instructor.emailId}
                  </Table.Cell>
                  <Table.Cell className="text-gray-700 font-semibold">
                    {instructor.position}
                  </Table.Cell>
                  <Table.Cell className="text-gray-700 font-semibold text-center">
                    <div className="flex justify-center items-center ">
                      <span className="mr-1">
                        {instructor?.country?.toLowerCase() === "india" ||
                        instructor?.phoneNumber?.startsWith("+91")
                          ? "₹"
                          : "$"}
                      </span>
                      {((instructor.bonus ?? 0) / 100)?.toFixed(2)}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="text-gray-700 font-semibold text-center">
                    {instructor.referralCount || 0}
                  </Table.Cell>
                  <Table.Cell className="text-gray-700 text-sm">
                    {instState.loading ? (
                      <div className="text-xs text-gray-500">Loading...</div>
                    ) : instState.itemsLoaded ? (
                      // Show only the number of classes (e.g. "2 class")
                      <div className="text-xs text-gray-700">
                        {(() => {
                          // Always compute class occurrences from the attendance items so this
                          // reflects the same breakdown the Calendar displays. Some backends
                          // return `total` as days; to avoid mixing semantics we compute
                          // occurrences client-side from classTaken entries.
                          const classCount = parseInstructorAttendanceToClasses(
                            instState.items,
                            instructor,
                          ).length;
                          return `${classCount} class${
                            classCount === 1 ? "" : "es"
                          }`;
                        })()}
                      </div>
                    ) : (
                      <div>
                        <button
                          className="text-xs px-2 py-1 bg-blue-100 rounded"
                          onClick={() =>
                            fetchInstructorAttendancePage(
                              instructor.instructorId,
                              1,
                              5,
                              new Date().getUTCMonth() + 1,
                              new Date().getUTCFullYear(),
                            )
                          }>
                          Load
                        </button>
                      </div>
                    )}
                  </Table.Cell>
                  <Table.Cell className="text">
                    <div className="flex flex-row justify-center items-center gap-2">
                      <button
                        onClick={() => handleEditClick(instructor)}
                        title="Edit"
                        aria-label={`Edit ${instructor.name}`}
                        className="p-2 rounded-md text-white"
                        style={{
                          backgroundColor: InstitutionData.LightPrimaryColor,
                        }}>
                        <Edit height={18} />
                      </button>
                      <button
                        onClick={() => handleViewInstructor(instructor)}
                        title="View Calendar"
                        aria-label={`View ${instructor.name}`}
                        className="p-2 rounded-md text-white"
                        style={{
                          backgroundColor: InstitutionData.LightPrimaryColor,
                        }}>
                        <Eye height={18} />
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>

        {/* Calendar is now shown on its own page route: /instructor-calendar/:id */}

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Showing {filteredInstructorList.length === 0 ? 0 : startIndex + 1} to{" "}
            {Math.min(endIndex, filteredInstructorList.length)} of{" "}
            {filteredInstructorList.length} results
          </div>
          <div className="flex overflow-x-auto sm:justify-end">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.max(
                  1,
                  Math.ceil(filteredInstructorList.length / itemsPerPage),
              )}
              onPageChange={(value) => setCurrentPage(value)}
              showIcons
              layout="pagination"
              className="text-gray-500 font-medium"
            />
          </div>
        </div>

        <Modal show={showEditModal} onClose={() => setShowEditModal(false)}>
          <Modal.Header>Edit Instructor</Modal.Header>
          <Modal.Body>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primaryColor focus:ring-primaryColor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="emailId"
                  value={editForm.emailId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primaryColor focus:ring-primaryColor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={editForm.position}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primaryColor focus:ring-primaryColor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                    name="instructorStatus"
                    value={editForm.instructorStatus || "Active"}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primaryColor focus:ring-primaryColor">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              {/* Per-class pricing fields (side-by-side on sm+ screens) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Per-class Currency
                  </label>
                  <select
                    name="perClassCurrency"
                    value={editForm.perClassCurrency || "INR"}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primaryColor focus:ring-primaryColor">
                    <option value="INR">₹ INR</option>
                    <option value="USD">$ USD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Per-class Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primaryColor focus:ring-primaryColor pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white rounded-md"
                  style={{ backgroundColor: InstitutionData.PrimaryColor }}>
                  Save Changes
                </button>
              </div>
            </form>
          </Modal.Body>
        </Modal>

        {/* PAYMENT MODAL */}
        <Modal
          show={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          size="3xl"
          popup
          className="backdrop-blur-sm !z-[100]">
          {selectedInstructor && (
            <>
              <Modal.Header className="backdrop-blur-lg mt-2 border-b px-3 py-2 mb-3">
                Add Payment to {selectedInstructor.name}
              </Modal.Header>
              <Modal.Body>
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    {/* Transaction Id */}
                    <label className="block text-sm font-medium text-gray-700">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      name="transactionId"
                      value={editForm.transactionId || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primaryColor focus:ring-primaryColor"
                      placeholder="Enter transaction ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      // use optional chaining & default to 0 if null
                      max={((selectedInstructor?.bonus ?? 0) / 100).toFixed(2)}
                      value={paymentAmount}
                      onChange={handlePaymentChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primaryColor focus:ring-primaryColor"
                      placeholder="Enter payment amount"
                    />
                  </div>
                  {/* Payment Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date of payment
                    </label>
                    <input
                      type="date"
                      name="paymentDate"
                      value={editForm.paymentDate || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primaryColor focus:ring-primaryColor"
                      placeholder="Select payment date"
                    />
                  </div>
                  {/* Transaction Id */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Currency
                    </label>
                    <select
                      name="currency"
                      value={editForm.currency || "INR"}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primaryColor focus:ring-primaryColor">
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-4 mt-4">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
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
                      className="px-4 py-2 text-sm font-medium text-white rounded-md relative disabled:opacity-50"
                      style={{ backgroundColor: InstitutionData.PrimaryColor }}>
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
              </Modal.Body>
            </>
          )}
        </Modal>
      </div>
    </div>
  );
}

export default InstructorList;