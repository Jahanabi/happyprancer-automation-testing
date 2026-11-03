// import { API } from "../../../Context/ContextProvider";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Modal, Button } from "flowbite-react";
import InstitutionContext from "../../../Context/InstitutionContext";
import Context from "../../../Context/Context";

const ProductModal = ({
  isOpen,
  onClose,
  isEditing,
  initialData,
  setProducts,
  userLocation,
}) => {
  const institution = useContext(InstitutionContext).institutionData;
  const { updateSubscription, createSubscription } = useContext(Context);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    heading: initialData?.heading || "",
    frequencyValue: initialData?.interval || 1,
    frequencyUnit: "month",
    amount: initialData?.amount ? initialData.amount / 100 : "",
    currency: userLocation === "IN" ? "INR" : "USD",
    country: userLocation === "IN" ? "IN" : "US",
    provides:
      Array.isArray(initialData?.provides) && initialData.provides.length > 0
        ? initialData.provides
        : [""],
    duration: initialData?.duration || 30,
    productId: initialData?.productId || "",
  });

  useEffect(() => {
    if (initialData) {
      const { frequencyValue, frequencyUnit } =
        getFrequencyFromSubscriptionType(
          initialData.subscriptionType,
          initialData.interval
        );

      setFormData({
        heading: initialData.heading || "",
        frequencyValue: frequencyValue || 1,
        frequencyUnit: frequencyUnit || "month",
        amount: initialData?.amount ? initialData.amount / 100 : "",
        currency: userLocation === "IN" ? "INR" : "USD",
        country: userLocation === "IN" ? "IN" : "US",
        provides: Array.isArray(initialData?.provides)
          ? initialData.provides
          : [""],
        duration: initialData.duration || 30,
        productId: initialData?.productId || "",
      });
    }
  }, [initialData, userLocation]);

  // Helper function for input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "provides") {
      setFormData({ ...formData, [name]: value.split("\n") });
    } else if (name === "frequencyValue") {
      setFormData({ ...formData, [name]: parseInt(value) || 1 });
    } else if (name === "amount") {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else if (name === "duration") {
      setFormData({ ...formData, [name]: parseInt(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Helper function to derive frequencyValue and frequencyUnit from subscriptionType and interval
  const getFrequencyFromSubscriptionType = (subscriptionType, interval) => {
    switch (subscriptionType) {
      case "monthly":
        return { frequencyValue: interval, frequencyUnit: "month" };
      case "yearly":
        return { frequencyValue: interval / 12, frequencyUnit: "year" };
      default:
        return { frequencyValue: 1, frequencyUnit: "month" };
    }
  };

  // Duration options in minutes
  const durationOptions = [
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
  ];

  const getSubscriptionDetails = (value, unit) => {
    let duration = value;
    let interval = value;
    let subscriptionType;
    let durationText;
    let period;

    switch (unit) {
      case "month":
        duration = value;
        period = "monthly";
        subscriptionType = value >= 12 ? "yearly" : "monthly";
        interval = value;
        durationText = value >= 12 ? "Yearly" : "Monthly";
        break;
      case "year":
        duration = value * 12;
        subscriptionType = "yearly";
        interval = value * 12;
        period = "monthly";
        durationText = "Yearly";
        break;
      default:
        duration = value;
        subscriptionType = "monthly";
        period = "monthly";
        durationText = "Monthly";
    }

    return { duration, subscriptionType, durationText, interval, period };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { duration, subscriptionType, durationText, interval, period } =
      getSubscriptionDetails(formData.frequencyValue, formData.frequencyUnit);

    const payload = {
      heading: formData.heading,
      amount: Math.round(formData.amount * 100),
      currency: formData.currency,
      country: formData.country,
      duration: formData.duration, // Include duration in minutes
      durationText: durationText,
      subscriptionType: subscriptionType,
      interval: interval,
      period: period,
      india: userLocation === "IN",
      provides: formData.provides.filter((item) => item.trim() !== ""),
      productId: formData.productId || "", // Will be empty for new products
    };

    console.log("Submitting payload:", payload);

    try {
      let response;

      if (isEditing) {
        // Update existing product
        console.log("Updating product:", initialData.productId);
        response = await updateSubscription(
          institution.InstitutionId,
          initialData.productId,
          payload
        );
      } else {
        // Create new product
        console.log("Creating new product");
        if (payload.india) {
          response = await createSubscription(
            institution.InstitutionId,
            payload,
            false
          );
        } else {
          response = await createSubscription(
            institution.InstitutionId,
            payload,
            true
          );
        }
      }

      console.log("API response:", response);

      // Success case
      toast.success(isEditing ? "Product Updated" : "Product Created");

      // Update the products state locally
      setProducts((prevProducts) => {
        if (isEditing) {
          // Update existing product
          return prevProducts.map((product) =>
            product.productId === initialData.productId
              ? { ...product, ...payload, productId: initialData.productId }
              : product
          );
        } else {
          // Get the product ID from response
          const newProductId =
            response?.productId ||
            response?.body?.productId ||
            `temp-${Date.now()}`; // Fallback ID if response structure is unexpected

          // Add new product with the returned ID
          const newProduct = {
            ...payload,
            productId: newProductId,
          };
          return [...prevProducts, newProduct];
        }
      });

      onClose(); // Close the modal
    } catch (error) {
      // Enhanced error logging
      console.error("Error in API call:", error);

      // Safe error message extraction
      let errorMessage =
        "An error occurred while updating/creating the subscription.";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const periodOptions = [
    { value: "week", label: "Weeks" },
    { value: "month", label: "Months" },
    { value: "year", label: "Years" },
  ];

  return (
    <Modal show={isOpen} onClose={onClose} size="xl">
      <Modal.Header>
        {isEditing ? "Edit Subscription Plan" : "Add New Subscription Plan"}
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="heading"
              className="block text-sm font-medium text-gray-700">
              Plan Name
            </label>
            <input
              id="heading"
              name="heading"
              value={formData.heading}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              placeholder="Enter plan name"
              required
            />
          </div>

          <div className="space-y-2">
            {userLocation !== "IN" ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Billing Frequency (PayPal)
                </label>
                <select
                  name="paypalPeriod"
                  value={formData.paypalPeriod || "monthly"}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      paypalPeriod: e.target.value,
                      // Set these values to match what backend expects
                      frequencyValue:
                        e.target.value === "quarterly"
                          ? 3
                          : e.target.value === "yearly"
                          ? 12
                          : 1,
                      frequencyUnit: "month",
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly (3 months)</option>
                  <option value="yearly">Yearly (12 months)</option>
                </select>
                <div className="text-sm text-gray-500 mt-1">
                  Payments processed through PayPal
                </div>
              </div>
            ) : (
              // Keep your existing frequency input for Indian users
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Billing Frequency
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      name="frequencyValue"
                      min="1"
                      value={formData.frequencyValue}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Enter number"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <select
                      name="frequencyUnit"
                      value={formData.frequencyUnit}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500">
                      {periodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            <div className="text-sm text-gray-500 mt-1">
              {
                getSubscriptionDetails(
                  formData.frequencyValue,
                  formData.frequencyUnit
                ).durationText
              }{" "}
              plan
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700">
              Amount ({userLocation === "IN" ? "₹" : "$"})
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="1"
              step="1"
              value={formData.amount === 0 ? "" : formData.amount}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({
                  ...formData,
                  amount: value === "" ? "" : parseInt(value) || 0,
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              placeholder="Enter amount"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-gray-700">
              Duration
            </label>
            <select
              id="duration"
              name="duration"
              value={formData.duration.toString()}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500">
              {durationOptions.map((option) => (
                <option key={option.value} value={option.value.toString()}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* To add multiple Provides if the admin wants */}
          <div className="space-y-2">
            <label
              htmlFor="provides"
              className="block text-sm font-medium text-gray-700">
              Provides
            </label>

            <div className="space-y-2">
              {formData.provides.map((provide, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={provide}
                    maxLength={100}
                    onChange={(e) => {
                      const newProvides = [...formData.provides];
                      newProvides[index] = e.target.value;
                      setFormData({ ...formData, provides: newProvides });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder={`Feature ${index + 1}`}
                    required={index === 0}
                  />

                  {formData.provides.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newProvides = [...formData.provides];
                        newProvides.splice(index, 1);
                        setFormData({ ...formData, provides: newProvides });
                      }}
                      className="p-2 text-red-500 hover:text-red-700"
                      aria-label="Remove item">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16">
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  provides: [...formData.provides, ""],
                });
              }}
              className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Feature
            </button>

            <p className="text-sm text-gray-500">
              Add up to 10 features (max 100 characters each)
            </p>

            {formData.provides.length >= 10 && (
              <p className="text-sm text-amber-600">
                Maximum number of features reached (10)
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              onClick={onClose}
              color="light"
              type="button"
              disabled={isSubmitting}
              className="rounded">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: institution.PrimaryColor,
              }}
              className="rounded text-white">
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Add Plan"}
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default ProductModal;
