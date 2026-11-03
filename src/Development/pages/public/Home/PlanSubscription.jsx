import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Context from "../../../Context/Context";
import InstitutionContext from "../../../Context/InstitutionContext";
import Navbar from "../../../components/Header";
import Footer from "../../../components/Footer";
import institutionData from "../../../constants";
import SubscriptionCard from "../../../components/SubscriptionCard"; // adjust path to wherever you save it

/**
 * PlanSubscription — dynamic version of TestingPayment.js.
 *
 * Route: /subscribe/:planId
 * Renders every product in `productList` whose `planId` matches the URL
 * param, using the shared <SubscriptionCard/> for each. Everything else
 * (hero copy, split desktop/mobile layout, payment URL building) is carried
 * over from TestingPayment.js unchanged — the only thing that stopped being
 * hardcoded is which plan is shown.
 */
const PlanSubscription = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const { isAuth, productList, userData: UserCtx } = useContext(Context);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!productId) {
      setProducts([]);
      return;
    }
    // Single-product link. If you actually want one link to show every
    // product under the same *plan* (e.g. monthly + yearly variants of one
    // offer), match on `item.planId === product.planId` instead, after
    // first finding the product that owns this productId.
    const matched = productList.filter((item) => item.productId === productId);
    setProducts(matched);
  }, [productList, productId]);

  const domain =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.REACT_APP_STAGE === "DEV"
        ? institutionData.BETA_DOMAIN
        : institutionData.PROD_DOMAIN;

  const getPaymentUrl = (selectedProduct) => {
    if (!selectedProduct || !UserCtx) return "";
    const baseUrl =
      process.env.REACT_APP_STAGE === "PROD"
        ? "https://payment.happyprancer.com"
        : "https://betapayment.happyprancer.com";

    return `${baseUrl}/${InstitutionData.InstitutionId}/${selectedProduct.productId}/${UserCtx.cognitoId}/${domain.split("://")[1]}`;
  };

  const handlePurchase = (selectedProduct) => {
    if (selectedProduct && UserCtx) {
      window.location.href = getPaymentUrl(selectedProduct);
    }
  };

  // Central place that decides what state the current viewer is in relative
  // to a given product — SubscriptionCard just renders whatever this says.
  const getProductStatus = (product) => {
    if (!isAuth) return "guest";
    if (
      UserCtx?.status === "Active" &&
      UserCtx?.productIds?.includes(product?.productId)
    ) {
      return "subscribed";
    }
    return "purchasable";
  };

  const handleAction = (product) => {
    if (!isAuth) {
      navigate(`/login?productId=${product?.productId || ""}`);
    } else {
      handlePurchase(product);
    }
  };

  if (!productId) return <Navbar />; // malformed URL, nothing to show but the shell

  if (!products.length) {
    // productId didn't match anything in productList — distinguish from
    // "still loading" so a bad link doesn't render a silent blank page.
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          No subscription plans found for this link.
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen">
        {/* Desktop layout */}
        <div className="hidden lg:block relative min-h-screen">
          <div
            className="flex min-h-screen"
            style={{ backgroundColor: InstitutionData.PrimaryColor }}>
            <div className="w-[65%] p-12 flex flex-col justify-center">
              <div className="text-white max-w-2xl ml-8">
                <h1 className="text-4xl font-bold mb-6">
                  Staff and Member Subscription
                </h1>
                <div className="space-y-4 text-lg">
                  <div className="flex items-center gap-2">
                    <CheckIcon /> Exclusive access to all features
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckIcon /> Special staff privileges
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckIcon /> Priority support
                  </div>
                </div>
              </div>
            </div>
            <div className="w-[35%] bg-white p-6 flex items-center justify-center">
              <div className="w-full max-w-[420px] max-h-[90vh] overflow-y-auto space-y-6 pr-1">
                {products.map((item) => (
                  <SubscriptionCard
                    key={item.productId}
                    product={item}
                    primaryColor={InstitutionData.PrimaryColor}
                    status={getProductStatus(item)}
                    onAction={handleAction}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet layout */}
        <div
          className="lg:hidden min-h-screen flex flex-col"
          style={{ backgroundColor: InstitutionData.PrimaryColor }}>
          <div className="p-6 text-white">
            <h1 className="text-3xl font-bold mb-6">
              Staff and Member Subscription
            </h1>
            <div className="space-y-4 text-base">
              <div className="flex items-center gap-2">
                <CheckIcon /> Exclusive access to all features
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon /> Special staff privileges
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon /> Priority support
              </div>
            </div>
          </div>

          <div className="px-4 py-8 space-y-6">
            {products.map((item) => (
              <SubscriptionCard
                key={item.productId}
                product={item}
                primaryColor={InstitutionData.PrimaryColor}
                status={getProductStatus(item)}
                onAction={handleAction}
              />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

const CheckIcon = () => (
  <svg
    className="h-5 w-5 shrink-0"
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

export default PlanSubscription;
