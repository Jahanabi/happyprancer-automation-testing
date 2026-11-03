import { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
// import { API } from "../../../../Context/ContextProvider";
import { PaginatedTable } from "../../../../common/DataDisplay";
import { Spinner } from "flowbite-react";
import Context from "../../../../Context/Context";
import InstitutionContext from "../../../../Context/InstitutionContext";
import {
  CreditCard,
  CalendarDays,
  User,
  ChevronDown,
  Eye,
  Mail,
  X,
  CheckCircle,
  Download,
} from "lucide-react";
import { toast } from "react-toastify";
import { formatCurrencyAmount } from "../../../../utils/revenueService";

const Billing = () => {
  const navigate = useNavigate();
  const {
    filteredProductList: productList,
    userData,
    cancelSubscription,
    pauseSubscription,
    fetchRazorpaySubscription,
    fetchPaymentHistory,
  } = useContext(Context);
  const { institutionData } = useContext(InstitutionContext);
  const [payments, setPayments] = useState([]);
  const [amount, setAmount] = useState("$0");
  const [renewDate, setRenewDate] = useState(userData.renewDate);
  const [loading, setLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [profile, setProfile] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [currentProductId, setCurrentProductId] = useState(
    userData?.productId ? String(userData.productId) : "",
  );
  const [showMore, setShowMore] = useState(false);
  const [currentExpanded, setCurrentExpanded] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubscriptionCancelled, setIsSubscriptionCancelled] = useState(false);
  const [isSilentInvoiceRender, setIsSilentInvoiceRender] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const canModify = !!renewDate && !!userData?.subscriptionId;
  const PrimaryColor = institutionData?.PrimaryColor || "#000";
  const productMap = useMemo(
    () =>
      productList.reduce((map, p) => {
        map[String(p.productId)] = p;
        return map;
      }, {}),
    [productList],
  );

  const parseNotes = (notes) => {
    if (!notes) return {};
    if (typeof notes === "object") return notes;
    if (typeof notes === "string") {
      try {
        return JSON.parse(notes);
      } catch {
        return {};
      }
    }
    return {};
  };

  const resolveEpochMs = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    // Most backend epochs are seconds; millisecond epochs are >= 1e12.
    return numeric < 1e12 ? numeric * 1000 : numeric;
  };

  const normalizeDate = (timestamp) => {
    const epochMs = resolveEpochMs(timestamp);
    return epochMs ? new Date(epochMs) : null;
  };

  const formatDateLabel = (timestamp, fallback = "N/A") => {
    const date = normalizeDate(timestamp);
    const dateLocale =
      userData?.location?.countryCode === "IN" ? "en-IN" : "en-US";
    return date ? date.toLocaleDateString(dateLocale) : fallback;
  };

  const resolveProductId = (payment, paymentProfile = null) => {
    const notes = parseNotes(payment?.notes);
    const fallbackIds = [
      userData?.productId, // live subscription — trust this first
      paymentProfile?.productId,
      payment?.productId,
      notes?.productId,
      payment?.planId,
    ];
    const resolved = fallbackIds.find(
      (id) => id !== undefined && id !== null && id !== "",
    );
    return resolved ? String(resolved) : "";
  };

  const currentProduct =
    productMap[
      String(
        currentProductId || profile?.productId || userData?.productId || "",
      )
    ];
  const currentPlanNotes = parseNotes(currentPlan?.notes);
  const currentPlanName =
    currentProduct?.heading ||
    currentPlanNotes?.subscriptionType ||
    currentPlan?.subscriptionType ||
    "N/A";
  const currentAmount =
    currentProduct?.amount || Number(currentPlan?.amount) || 0;

  useEffect(() => {
    if (userData?.productId) {
      setCurrentProductId(String(userData.productId));
    }
  }, [userData?.productId]);

const handleUpgradeClick = async (cognitoId, productId, order = false, previousSubscriptionId = null) => {
  try {
    if (!productId) { toast.error("Product not available"); return; }
    if (!cognitoId) { navigate(`/signup?productId=${productId}`); return; }

    const base = process.env.REACT_APP_STAGE === "PROD"
      ? "https://payment.happyprancer.com"
      : "https://betapayment.happyprancer.com";

    let paymentUrl = `${base}/${institutionData?.InstitutionId}/${productId}/${cognitoId}`;
    if (order) paymentUrl += `?orderType=true`;

    const referral = sessionStorage.getItem("referral") || localStorage.getItem("referral");
    if (referral) paymentUrl += order || previousSubscriptionId ? `&referral=${referral}` : `?referral=${referral}`;

    if (previousSubscriptionId) {
      paymentUrl += (paymentUrl.includes("?") ? "&" : "?") +
        `previousSubscriptionId=${encodeURIComponent(previousSubscriptionId)}`;
    }

    window.location.href = paymentUrl;
  } catch (e) { console.error(e); toast.error("Unable to start subscription"); }
};

const handleCancelForUpgrade = () => {
  setShowCancelConfirmModal(false);
  handleUpgradeClick(
    userData.cognitoId,
    selectedPlan.productId,
    false,
    currentPlan?.subscriptionId || userData?.subscriptionId,
  );
};

const handleDirectSwitch = () => {
  handleUpgradeClick(
    userData.cognitoId,
    selectedPlan.productId,
    false,
    currentPlan?.subscriptionId || userData?.subscriptionId,
  );
};
  const handleSubscriptionCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelSubscription(
        institutionData.institution || institutionData.InstitutionId,
      );
      toast.success("Subscription cancelled successfully.");
      setShowCancelModal(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      toast.error("Could not cancel subscription.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleChangeSubscription = () => {
    setShowUpgradeModal(true);
  };

  const handlePlanChange = (plan) => {
    setSelectedPlan(plan);
    const isUpgrade = plan.amount > currentAmount;
    if (isUpgrade) {
      setShowCancelConfirmModal(true);
    } else {
      handleDirectSwitch();
    }
  };

  const pauseSubscriptionAdmin = async () => {
    try {
      const institutionId =
        institutionData?.institutionid || institutionData?.InstitutionId;

      const response = await pauseSubscription({
        institutionId,
        cognitoId: userData.cognitoId,
        subscriptionId: profile?.subscriptionId,
        gateway: "razorpay",
        paymentId: profile?.paymentId,
      });

      toast.success("Subscription paused successfully.");
      return response;
    } catch (error) {
      console.error("Pause Error:", error);

      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Unable to pause subscription.";
      toast.error(msg);
      throw error;
    }
  };

  const handlePauseSubscription = async () => {
    setIsProcessing(true);
    try {
      await pauseSubscriptionAdmin();
      setShowPauseModal(false);
      window.location.reload();
    } catch (error) {
      // Error is already handled in the function
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewInvoice = (payment) => {
    // Fetch and merge subscription details before showing invoice
    (async () => {
      const merged = await fetchAndMergeSubscriptionData(payment);
      setSelectedPayment(merged);
      setShowInvoiceModal(true);
    })();
  };

  const generateInvoicePDF = async (paymentData) => {
    try {
      // Set payment temporarily for rendering
      setSelectedPayment(paymentData);
      setIsSilentInvoiceRender(true);
      setShowInvoiceModal(true);

      // Wait for DOM to update with the payment data
      await new Promise((resolve) => setTimeout(resolve, 300));

      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const invoiceElement = document.getElementById("invoice-content");
      if (!invoiceElement) {
        toast.error("Invoice content not found");
        setShowInvoiceModal(false);
        return;
      }

      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(
        `invoice-${paymentData?.paymentId || paymentData?.id || "document"}.pdf`,
      );
      toast.success("Invoice downloaded successfully!");
      // Close modal after download
      setShowInvoiceModal(false);
      setIsSilentInvoiceRender(false);
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      toast.error("Failed to download invoice. Please try again.");
      setShowInvoiceModal(false);
      setIsSilentInvoiceRender(false);
    }
  };

  const handleDownloadInvoice = async (payment) => {
    try {
      const paymentDataToUse = await fetchAndMergeSubscriptionData(payment);
      await generateInvoicePDF(paymentDataToUse);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice. Please try again.");
    }
  };

  const toggleCurrentExpanded = () => {
    setCurrentExpanded(!currentExpanded);
  };

  const togglePlanExpanded = (productId) => {
    setExpandedPlans((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetchPaymentHistory(
          institutionData.InstitutionId,
          userData.cognitoId,
        );
        const fetchedPayments = Array.isArray(res.payments) ? res.payments : [];
        // Enrich payments with Razorpay subscription details where available
        const mergedPayments =
          await enrichPaymentsWithSubscriptionDetails(fetchedPayments);
        setPayments(mergedPayments);
        setProfile(res.profile);

        const sortedPayments = [...mergedPayments].sort((a, b) => {
          const aDate = normalizeDate(a.paymentDate)?.getTime() || 0;
          const bDate = normalizeDate(b.paymentDate)?.getTime() || 0;
          return bDate - aDate;
        });

        if (res.profile && mergedPayments.length) {
          const currentPayment =
            mergedPayments.find((p) => p.paymentId === res.profile.paymentId) ||
            sortedPayments.find((p) => p.isVerified) ||
            sortedPayments[0];

          if (currentPayment) {
            setAmount(
              formatCurrencyAmount(currentPayment.amount, currentPayment.currency, {
                subunit: true,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })
            );
            setRenewDate(
              resolveEpochMs(
                currentPayment.renewDate || currentPayment.current_end,
              ) || null,
            );
            setCurrentPlan(currentPayment);
            setCurrentProductId(resolveProductId(currentPayment, res.profile));

            // Check Razorpay subscription status for current plan to hide cancel when cancelled
            if (currentPayment.subscriptionId) {
              try {
                const subscriptionData = await fetchRazorpaySubscription({
                  subscriptionId: currentPayment.subscriptionId,
                });
                const sd = subscriptionData?.data ?? subscriptionData;
                console.log("Razorpay subscription data for current plan:", sd);
                if (sd?.status) {
                  setCurrentPlan((prev) => ({ ...(prev || {}), ...sd }));
                  setIsSubscriptionCancelled(
                    sd.status.toLowerCase() === "cancelled",
                  );
                }
              } catch (err) {
                console.log("Razorpay status fetch failed:", err);
              }
            }
          }
        } else if (sortedPayments.length) {
          const fallbackPayment =
            sortedPayments.find((p) => p.isVerified) || sortedPayments[0];
          setAmount(
            formatCurrencyAmount(fallbackPayment.amount, fallbackPayment.currency, {
              subunit: true,
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })
          );
          setRenewDate(
            resolveEpochMs(
              fallbackPayment.renewDate || fallbackPayment.current_end,
            ) || null,
          );
          setCurrentPlan(fallbackPayment);
          setCurrentProductId(resolveProductId(fallbackPayment));
        }
      } catch (e) {
        console.error("Billing data fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [institutionData.InstitutionId, userData.cognitoId]);

  // Close modify dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showModifyModal &&
        !event.target.closest(".modify-dropdown-container")
      ) {
        setShowModifyModal(false);
      }
    };

    if (showModifyModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModifyModal]);

  const orderHistory = useMemo(() => {
    const filteredPayments = filterMonth
      ? payments.filter((p) => {
          const date = normalizeDate(p.paymentDate);
          return (
            p.paymentDate &&
            date &&
            date.toISOString().slice(0, 7) === filterMonth
          );
        })
      : payments;

    const sortedPayments = [...filteredPayments].sort(
      (a, b) =>
        (normalizeDate(b.paymentDate)?.getTime() || 0) -
        (normalizeDate(a.paymentDate)?.getTime() || 0),
    );

    console.log("Sorted payments:", sortedPayments);
    return sortedPayments.map((p, index) => [
      formatDateLabel(p.paymentDate),
      productMap[String(p.productId)]?.heading ||
        parseNotes(p.notes)?.subscriptionType ||
        p.subscriptionType ||
        "Subscription",
      (p.payment_method || p.paymentMode || "N/A").toUpperCase(),
      formatCurrencyAmount(p.amount, p.currency, {
        subunit: true,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      <span
        key={`status-${index}`}
        className={`px-2 py-1 rounded text-xs font-medium ${
          p.isVerified
            ? "bg-green-100 text-green-800 rounded-full px-3"
            : "bg-red-200 text-red-800"
        }`}>
        {p.isVerified ? "Paid" : "Halted"}
      </span>,
      <div
        key={`actions-${index}`}
        className="flex items-center justify-center space-x-2">
        <button
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
          onClick={() => handleViewInvoice(p)}
          title="View Invoice">
          <Eye className="h-5 w-5" />
        </button>
        <button
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
          onClick={() => handleDownloadInvoice(p)}
          title="Download Invoice">
          <Download className="h-5 w-5" />
        </button>
      </div>,
    ]);
  }, [payments, filterMonth, productMap]);

  // Helper to fetch and merge Razorpay subscription details into a payment object
  const fetchAndMergeSubscriptionData = async (payment) => {
    // Start with original payment data
    let paymentDataToUse = { ...payment };

    // Try to fetch subscription data from razorpay-subscription-fetch API ONLY if subscriptionId exists
    if (payment?.subscriptionId) {
      try {
        const subscriptionData = await fetchRazorpaySubscription({
          subscriptionId: payment.subscriptionId,
        });

        // API returns { message, data: {...} } — unwrap to use 'data'
        const sd = subscriptionData?.data ?? subscriptionData;

        // If subscription data is fetched successfully, merge only the available fields
        if (sd && Object.keys(sd).length > 0) {
          console.log("Razorpay subscription data fetched:", sd);

          // Only override fields that exist in the subscription data
          paymentDataToUse = {
            ...paymentDataToUse,
            // Update payment method if available
            ...(sd.payment_method && {
              payment_method: sd.payment_method,
              paymentMode: sd.payment_method,
            }),
            // Update amount if available
            ...(sd.amount && {
              amount:
                typeof sd.amount === "string"
                  ? parseInt(sd.amount, 10)
                  : sd.amount,
            }),
            // Update notes if available
            ...(sd.notes && {
              notes: sd.notes,
            }),
            // Update status if available
            ...(sd.status && {
              status: sd.status,
            }),
            // Update renewDate/current_end if available
            ...(sd.current_end && {
              renewDate: resolveEpochMs(sd.current_end),
              current_end: resolveEpochMs(sd.current_end),
            }),
            // Update plan_id if available
            ...(sd.plan_id && {
              plan_id: sd.plan_id,
            }),
            // Update remaining_count if available
            ...(sd.remaining_count !== undefined && {
              remaining_count: sd.remaining_count,
            }),
          };

          console.log("Merged payment data:", paymentDataToUse);
        }
      } catch (subscriptionError) {
        console.log(
          "Subscription fetch failed, using original payment data:",
          subscriptionError,
        );
        // Continue with original payment data if API fails
      }
    }

    return paymentDataToUse;
  };

  // Batch enrichment: best-effort merge of Razorpay subscription details into all payments
  const enrichPaymentsWithSubscriptionDetails = async (paymentsList) => {
    if (!Array.isArray(paymentsList) || paymentsList.length === 0) return [];

    const tasks = paymentsList.map(async (p) => {
      // Only attempt fetch when subscriptionId is present and method looks unknown/missing
      const methodUnknown = !p.paymentMode || p.paymentMode === "unknown";
      if (!p.subscriptionId || (!methodUnknown && p.payment_method)) {
        return p;
      }
      try {
        const subscriptionData = await fetchRazorpaySubscription({
          subscriptionId: p.subscriptionId,
        });
        const sd = subscriptionData?.data ?? subscriptionData;
        if (sd && Object.keys(sd).length > 0) {
          return {
            ...p,
            ...(sd.payment_method && {
              payment_method: sd.payment_method,
              paymentMode: sd.payment_method,
            }),
            ...(sd.amount && {
              amount:
                typeof sd.amount === "string"
                  ? parseInt(sd.amount, 10)
                  : sd.amount,
            }),
            ...(sd.notes && { notes: sd.notes }),
            ...(sd.status && { status: sd.status }),
            ...(sd.current_end && {
              renewDate: resolveEpochMs(sd.current_end),
              current_end: resolveEpochMs(sd.current_end),
            }),
            ...(sd.plan_id && { plan_id: sd.plan_id }),
            ...(sd.remaining_count !== undefined && {
              remaining_count: sd.remaining_count,
            }),
          };
        }
        return p;
      } catch (err) {
        // Best-effort: skip merge on error
        return p;
      }
    });

    const results = await Promise.allSettled(tasks);
    return results.map((r, i) =>
      r.status === "fulfilled" ? r.value : paymentsList[i],
    );
  };

  const months = useMemo(() => {
    if (!payments.length) return [];
    return [
      ...new Set(
        payments
          .map((p) => {
            const date = normalizeDate(p.paymentDate);
            return p.paymentDate && date
              ? date.toISOString().slice(0, 7)
              : null;
          })
          .filter(Boolean),
      ),
    ]
      .sort()
      .reverse();
  }, [payments]);

  const institutionName =
    institutionData?.institution ||
    institutionData?.InstitutionId ||
    "Institution";

  const downgrades = useMemo(() => {
    return productList
      .filter((plan) => plan.amount < currentAmount)
      .sort((a, b) => a.amount - b.amount);
  }, [productList, currentAmount]);

  const upgrades = useMemo(() => {
    return productList
      .filter((plan) => plan.amount > currentAmount)
      .sort((a, b) => a.amount - b.amount);
  }, [productList, currentAmount]);

  const PlanCard = ({
    plan,
    isExpanded,
    onToggleExpanded,
    onChange,
    currentAmount,
  }) => {
    const isUpgrade = plan.amount > (currentAmount || 0);
    return (
      <div className="relative bg-white p-4 rounded-lg border mb-4 hover:shadow-sm transition-shadow">
        <button
          onClick={() => onChange(plan)}
          className="absolute top-3 right-3 px-2 py-1 text-xs font-semibold rounded text-white transition-all duration-300 hover:opacity-90"
          style={{ backgroundColor: PrimaryColor }}>
          {isUpgrade ? "Upgrade" : "Downgrade"}
        </button>
        <p className="font-bold text-sm mb-2">{plan.heading}</p>
        <div className="space-y-1 mb-2">
          {Array.isArray(plan.provides) &&
            plan.provides
              .slice(0, isExpanded ? plan.provides.length : 2)
              .map((provide, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-1 text-xs text-gray-600">
                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span>{provide}</span>
                </div>
              ))}
          {Array.isArray(plan.provides) && plan.provides.length > 2 && (
            <button
              onClick={() => onToggleExpanded(plan.productId)}
              className="text-xs text-primary hover:underline flex items-center space-x-1 w-full justify-start"
              style={{ color: PrimaryColor }}>
              <span>{isExpanded ? "View Less" : "View More..."}</span>
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
        <p className="text-sm font-bold text-green-600">
          {formatCurrencyAmount(plan.amount, plan.currency, {
            subunit: true,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    );
  };

  return (
    <main className="inter no-scrollbar text-gray-900 p-8 space-y-8 font-sans relative max-h-[calc(100vh-8rem)] overflow-y-auto">
      <section className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
        <div className="bg-white rounded-xl shadow-sm border-2 border-primaryColor hover:shadow-md transition-all duration-300 p-4">
          <div className="flex items-center gap-3">
            <CreditCard style={{ color: PrimaryColor }} className="h-6 w-6" />
            <div className="flex items-center justify-between w-full">
              <p className="text-sm font-semibold text-gray-600">
                Current Plan
              </p>

              <div className="relative modify-dropdown-container">
                {!isSubscriptionCancelled && (
                  <>
                    <button
                      disabled={!canModify}
                      className={`px-3 py-1 text-xs font-semibold rounded-md text-white transition-all duration-300
    ${!canModify ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
                      style={{
                        backgroundColor: !canModify ? "#9CA3AF" : PrimaryColor,
                      }}
                      onClick={() => {
                        if (
                          canModify &&
                          normalizeDate(renewDate) > new Date()
                        ) {
                          setShowModifyModal(!showModifyModal);
                        }
                      }}>
                      Modify
                    </button>
                    {showModifyModal && (
                      <div className="absolute -top- -left-12 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1.5 space-y-1.5 min-w-[160px] z-10">
                        <button
                          onClick={() => {
                            setShowModifyModal(false);
                            handleChangeSubscription();
                          }}
                          className="w-full px-2.5 py-1.5 text-xs font-semibold text-white rounded-md transition-all duration-300 hover:opacity-90 flex items-center justify-center gap-1.5"
                          style={{ backgroundColor: PrimaryColor }}>
                          <CheckCircle className="h-3.5 w-3.5" />
                          Upgrade
                        </button>
                        <button
                          onClick={() => {
                            setShowModifyModal(false);
                            setShowPauseModal(true);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-all duration-300 flex items-center justify-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Pause
                        </button>
                        <button
                          onClick={() => {
                            setShowModifyModal(false);
                            setShowCancelModal(true);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-all duration-300 flex items-center justify-center gap-1.5">
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <p className="text-base font-bold mt-2">{currentPlanName}</p>
          {Array.isArray(currentProduct?.provides) && (
            <div className="mt-2">
              <div
                className={`overflow-hidden transition-all duration-700 ease-in-out ${
                  showMore ? "max-h-96" : "max-h-12"
                }`}>
                <div className="space-y-1">
                  {currentProduct.provides
                    .slice(0, showMore ? currentProduct.provides.length : 2)
                    .map((provide, i) => (
                      <p key={i} className="text-xs text-gray-600">
                        {provide}
                      </p>
                    ))}
                </div>
              </div>
              {currentProduct.provides.length > 2 && (
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="text-xs text-gray-700 hover:underline mt-1">
                  {showMore ? "View Less" : "View More..."}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border-2 border-primaryColor hover:shadow-md transition-all duration-300 p-4">
          <div className="flex items-center gap-3">
            <CalendarDays style={{ color: PrimaryColor }} className="h-6 w-6" />
            <p className="text-sm font-semibold text-gray-600">Next Renewal</p>
          </div>
          <p className="text-base font-bold mt-2">
            {formatDateLabel(renewDate)}
          </p>
          <p className="text-sm mt-1 text-gray-500">Auto-renews monthly</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border-2 border-primaryColor hover:shadow-md transition-all duration-300 p-4">
          <div className="flex items-center gap-3">
            <User style={{ color: PrimaryColor }} className="h-6 w-6" />
            <p className="text-sm font-semibold text-gray-600">
              Account Details
            </p>
          </div>
          <div className="mt-4 flex flex-col md:flex-row md:justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs uppercase text-gray-500">Billing Amount</p>
              <p className="text-base font-bold mt-1">{amount}</p>
              <p className="text-sm mt-1 text-gray-500">Billed every cycle</p>
            </div>
            <div className="flex-1 text-right md:text-left">
              <div className="mt-3">
                <p className="text-xs uppercase text-gray-500">Member Since</p>
                <h2 className="font-semibold text-base">
                  {userData.joiningDate
                    ? formatDateLabel(userData.joiningDate)
                    : "N/A"}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Billing History</h2>
          <div className="relative bg-white rounded-md shadow-sm border border-gray-200 inline-flex items-center min-w-[150px]">
            <CalendarDays className="h-4 w-4 text-gray-500 ml-2" />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-8 py-1.5 text-sm font-medium text-gray-700 bg-transparent border-0 focus:outline-none focus:ring-0 rounded-md cursor-pointer appearance-none">
              <option value="">All Months</option>
              {months.map((month) => (
                <option key={month} value={month}>
                  {new Date(`${month}-01`).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-600 text-sm py-4">
            <Spinner size="sm" /> <span>Loading history...</span>
          </div>
        ) : (
          <div className="bg-white rounded-xl hover:shadow-md transition-all duration-300 p-2">
            <PaginatedTable
              head={[
                "Date",
                "Description",
                "Method",
                "Amount",
                "Status",
                "Actions",
              ]}
              data={orderHistory}
              itemsPerPage={5}
            />
          </div>
        )}
      </section>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full mx-auto">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Cancel Subscription</h3>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to cancel your subscription? This action
                  cannot be undone.
                </p>
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={isCancelling}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50">
                    Cancel
                  </button>
                  <button
                    onClick={handleSubscriptionCancel}
                    disabled={isCancelling}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
                    {isCancelling
                      ? "Cancelling..."
                      : "I am sure, cancel subscription"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Pause Subscription Modal */}
      {showPauseModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full mx-auto shadow-xl">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <CalendarDays className="text-yellow-600 h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Pause Subscription
                  </h3>
                </div>
                {currentPlan?.status?.toLowerCase() === "authenticated" && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-yellow-800">
                          Warning
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Your subscription is not fully activated yet. Pausing
                          it now will result in cancellation instead of just
                          pausing.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Are you sure you want to pause your subscription? The
                  subscription will be temporarily suspended and can be resumed
                  later.
                </p>
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={() => {
                      setShowPauseModal(false);
                    }}
                    disabled={isProcessing}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handlePauseSubscription}
                    disabled={isProcessing}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {isProcessing ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        Pausing...
                      </>
                    ) : (
                      <>
                        <CalendarDays className="h-4 w-4" />
                        Pause Subscription
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cancel Confirmation Modal for Upgrade */}
      {showCancelConfirmModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-lg max-w-md w-full mx-auto">
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Confirm Upgrade</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Your previous subscription will be cancelled. Proceed with
                  upgrading to {selectedPlan?.heading}?
                </p>
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={() => setShowCancelConfirmModal(false)}
                    disabled={isCancelling}
                    className="px-4 py-2 text-sm font-medium border-2 border-gray-300 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50">
                    Cancel
                  </button>
                  <button
                    onClick={handleCancelForUpgrade}
                    disabled={isCancelling}
                    className="px-4 py-2 text-sm font-medium text-gray-100 bg-primaryColor rounded-md hover:bg-white hover:text-primaryColor border-2 border-primaryColor disabled:opacity-50 transition duration-500">
                    {isCancelling ? "Processing..." : "Confirm and Upgrade"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-6xl w-full mx-auto max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Change Plan</h3>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Current Plan</h4>
                  <p className="text-base font-bold mb-2">{currentPlanName}</p>
                  <div className="space-y-1 mb-2">
                    {Array.isArray(currentProduct?.provides) &&
                      currentProduct.provides
                        .slice(
                          0,
                          currentExpanded ? currentProduct.provides.length : 2,
                        )
                        .map((provide, i) => (
                          <div
                            key={i}
                            className="flex items-center space-x-1 text-xs text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span>{provide}</span>
                          </div>
                        ))}
                    {Array.isArray(currentProduct?.provides) &&
                      currentProduct.provides.length > 2 && (
                        <button
                          onClick={toggleCurrentExpanded}
                          className="text-xs text-primary hover:underline flex items-center space-x-1 w-full justify-start"
                          style={{ color: PrimaryColor }}>
                          <span>
                            {currentExpanded ? "View Less" : "View More..."}
                          </span>
                          <ChevronDown
                            className={`h-3 w-3 transition-transform duration-300 ${
                              currentExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      )}
                  </div>
                  <p className="text-sm font-bold">{amount}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-sm mb-4">
                      Downgrade Options
                    </h4>
                    {downgrades.length > 0 ? (
                      downgrades.map((plan) => {
                        const isExpanded =
                          expandedPlans[plan.productId] || false;
                        return (
                          <PlanCard
                            key={plan.productId}
                            plan={plan}
                            isExpanded={isExpanded}
                            onToggleExpanded={togglePlanExpanded}
                            onChange={handlePlanChange}
                            currentAmount={currentAmount}
                          />
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No downgrade options available.
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-4">
                      Upgrade Options
                    </h4>
                    {upgrades.length > 0 ? (
                      upgrades.map((plan) => {
                        const isExpanded =
                          expandedPlans[plan.productId] || false;
                        return (
                          <PlanCard
                            key={plan.productId}
                            plan={plan}
                            isExpanded={isExpanded}
                            onToggleExpanded={togglePlanExpanded}
                            onChange={handlePlanChange}
                            currentAmount={currentAmount}
                          />
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No upgrade options available.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            style={
              isSilentInvoiceRender
                ? { opacity: 0, pointerEvents: "none" }
                : undefined
            }>
            <div className="p-4 bg-white relative rounded-md max-w-2xl w-full mx-auto">
              <div className="flex justify-end gap-2 mb-2">
                <button
                  onClick={() => handleDownloadInvoice(selectedPayment)}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-md hover:opacity-90 transition-all"
                  style={{ backgroundColor: PrimaryColor }}
                  title="Download Invoice">
                  <Download className="h-4 w-4" />
                  <span className="text-sm font-medium">Download PDF</span>
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-2">
                {selectedPayment && profile && (
                  <div
                    id="invoice-content"
                    className="space-y-2 bg-white print:bg-white p-6">
                    <div className="flex justify-between items-start border-b pb-2 mb-2">
                      <div>
                        <h1
                          className="text-xl font-bold mb-1"
                          style={{ color: PrimaryColor }}>
                          Invoice
                        </h1>
                        <p className="text-xs text-gray-600">
                          {institutionName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold mb-1">
                          #{selectedPayment.paymentId}
                        </p>
                        <p className="text-xs text-gray-600">
                          Issued: {formatDateLabel(selectedPayment.paymentDate)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Due: {formatDateLabel(selectedPayment.paymentDate)}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="font-bold text-sm mb-1 border-b pb-1">
                          Bill To
                        </h3>
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">{profile.userName}</p>
                          <p>{profile.emailId}</p>
                          <p>{profile.phoneNumber}</p>
                          {profile.address && <p>{profile.address}</p>}
                          <p>{profile.country || "N/A"}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-sm mb-1 border-b pb-1">
                          From
                        </h3>
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">{institutionName}</p>
                          <p className="text-gray-600">Billing Department</p>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded overflow-hidden mb-4">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2 font-semibold text-gray-700 border-b">
                              Description
                            </th>
                            <th className="text-right p-2 font-semibold text-gray-700 border-b">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2">
                              <div className="space-y-1">
                                <p className="font-semibold text-gray-900 text-xs">
                                  {selectedPayment.notes?.subscriptionType ||
                                    selectedPayment.subscriptionType ||
                                    "Subscription Fee"}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Product ID:{" "}
                                  {selectedPayment.notes?.productId ||
                                    selectedPayment.productId}{" "}
                                  | Plan ID:{" "}
                                  {selectedPayment.plan_id ||
                                    selectedPayment.planId}
                                </p>
                                {selectedPayment.productType && (
                                  <p className="text-xs text-gray-600">
                                    Categories:{" "}
                                    {Array.isArray(selectedPayment.productType)
                                      ? selectedPayment.productType.join(", ")
                                      : selectedPayment.productType}
                                  </p>
                                )}
                                {(selectedPayment.renewDate ||
                                  selectedPayment.current_end) && (
                                  <p className="flex gap-1 text-xs text-gray-800">
                                    Period: Until{" "}
                                    <div className="font-bold">
                                      {formatDateLabel(
                                        selectedPayment.renewDate ||
                                          selectedPayment.current_end,
                                      )}
                                    </div>
                                  </p>
                                )}
                                {selectedPayment.status && (
                                  <p className="text-xs text-gray-600">
                                    <span className="font-semibold">
                                      Status:
                                    </span>{" "}
                                    {selectedPayment.status}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="p-2 text-right">
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrencyAmount(selectedPayment.amount, selectedPayment.currency, {
                                  subunit: true,
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end border-t pt-2 mb-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          Subtotal:{" "}
                          {formatCurrencyAmount(selectedPayment.amount, selectedPayment.currency, {
                            subunit: true,
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          Total:{" "}
                          {formatCurrencyAmount(selectedPayment.amount, selectedPayment.currency, {
                            subunit: true,
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <h4 className="font-bold mb-1 text-xs">
                          Payment Details
                        </h4>
                        <div className="space-y-1 text-xs">
                          <p>
                            <span className="font-semibold">Method:</span>{" "}
                            {(
                              selectedPayment.payment_method ||
                              selectedPayment.paymentMode ||
                              "N/A"
                            ).toUpperCase()}
                          </p>
                          <p>
                            <span className="font-semibold">Status:</span>{" "}
                            {selectedPayment.status ||
                              (selectedPayment.isVerified
                                ? "Paid"
                                : "Cancelled")}
                          </p>
                          {(selectedPayment.subscriptionId ||
                            selectedPayment.id) && (
                            <p>
                              <span className="font-semibold">Sub ID:</span>{" "}
                              {selectedPayment.subscriptionId ||
                                selectedPayment.id}
                            </p>
                          )}
                          {(selectedPayment.renewDate ||
                            selectedPayment.current_end) && (
                            <p>
                              <span className="font-semibold">
                                Next Billing:
                              </span>{" "}
                              {formatDateLabel(
                                selectedPayment.renewDate ||
                                  selectedPayment.current_end,
                              )}
                            </p>
                          )}
                          {(selectedPayment.renewDate ||
                            selectedPayment.current_end) && (
                            <p>
                              <span className="font-semibold">
                                Recurring Amount:
                              </span>{" "}
                              {selectedPayment.currency === "USD" ? "$" : "₹"}
                              {(
                                (parseInt(
                                  selectedPayment?.notes?.amount ??
                                    selectedPayment?.amount,
                                  10,
                                ) || 0) / 100
                              ).toFixed(2)}
                            </p>
                          )}
                          {selectedPayment.remaining_count !== undefined && (
                            <p>
                              <span className="font-semibold">
                                Remaining Cycles:
                              </span>{" "}
                              {selectedPayment.remaining_count}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold mb-1 text-xs">Notes</h4>
                        <p className="text-xs text-gray-600">
                          Thank you! Contact admin@
                          {institutionName.toLowerCase()}.com.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default Billing;
