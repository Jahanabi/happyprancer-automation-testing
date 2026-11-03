import { Card } from "flowbite-react";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Context from "../../../Context/Context";
import InstitutionContext from "../../../Context/InstitutionContext";
import Navbar from "../../../components/Header";
import Footer from "../../../components/Footer";
import institutionData from "../../../constants";

const TESTING_PAYMENT_PLAN_ID = "P-0X877546BW9712401ND4GPWI";

const TestingPayment = () => {
  const navigate = useNavigate();
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const { isAuth, productList, userData: UserCtx } = useContext(Context);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const planProducts = productList.filter(
      (item) => item.planId === TESTING_PAYMENT_PLAN_ID,
    );
    setProducts(planProducts);
  }, [productList]);

  const domain =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.REACT_APP_STAGE === "DEV"
        ? institutionData.BETA_DOMAIN
        : institutionData.PROD_DOMAIN;

  // Consistent payment URL generator function
  const getPaymentUrl = (selectedProduct) => {
    if (!selectedProduct || !UserCtx) return "";

    const baseUrl =
      process.env.REACT_APP_STAGE === "PROD"
        ? "https://payment.happyprancer.com"
        : "https://betapayment.happyprancer.com";

    return `${baseUrl}/${InstitutionData.InstitutionId}/${selectedProduct.productId}/${UserCtx.cognitoId}/${domain.split("://")[1]}`;
  };

  // Function to handle purchase action
  const handlePurchase = (selectedProduct) => {
    if (selectedProduct && UserCtx) {
      const paymentUrl = getPaymentUrl(selectedProduct);
      window.location.href = paymentUrl;
    }
  };

  // Reusable feature list component
  const FeaturesList = ({ isMobile = false }) => {
    const textSize = isMobile ? "text-base" : "text-lg";
    return (
      <div className={`space-y-4 ${textSize}`}>
        <div className="flex items-center gap-2">
          <CheckIcon />
          Exclusive access to all features
        </div>
        <div className="flex items-center gap-2">
          <CheckIcon />
          Special staff privileges
        </div>
        <div className="flex items-center gap-2">
          <CheckIcon />
          Priority support
        </div>
      </div>
    );
  };

  // SVG Check Icon component
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

  // Product Feature List component
  const ProductFeatures = ({ color, product }) => (
    <ul className="my-7 space-y-5 min-h-[12rem]">
      {product?.provides &&
        Array.isArray(product.provides) &&
        product.provides.map((provide, j) => (
          <li key={`provide-${j}`} className="flex space-x-3">
            <svg
              className="h-5 w-5 shrink-0 text-primaryColor"
              style={{ color }}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">
              {provide}
            </span>
          </li>
        ))}
    </ul>
  );

  // Subscription Card component
  const SubscriptionCard = ({ product, isDesktop = true }) => {
    const headingClass = isDesktop ? "text-2xl min-h-20" : "text-xl min-h-16";
    const priceClass = isDesktop ? "text-5xl" : "text-4xl";
    const currencyClass = isDesktop ? "text-3xl" : "text-2xl";
    const durationClass = isDesktop ? "text-xl" : "text-lg";

    return (
      <Card
        className={`${isDesktop ? "w-full" : "w-full max-w-[400px] mx-auto"} min-h-[450px] shadow-xl`}>
        <h5
          className={`${headingClass} font-medium flex items-center text-gray-500 dark:text-gray-400`}>
          {product?.heading}
        </h5>
        <div className="flex items-baseline text-gray-900 dark:text-white">
          <span className={`${currencyClass} font-semibold`}>
            {product?.currency === "INR" ? "₹ " : "$ "}
          </span>
          <span className={`${priceClass} font-extrabold tracking-tight`}>
            {product ? parseInt(product.amount) / 100 : 0}
          </span>
          <span
            className={`ml-1 ${durationClass} font-normal text-gray-500 dark:text-gray-400`}>
            /{product?.durationText}
          </span>
        </div>
        <ProductFeatures
          color={InstitutionData.PrimaryColor}
          product={product}
        />
        {renderActionButton(product)}
      </Card>
    );
  };

  const renderActionButton = (product) => {
    if (!isAuth) {
      return (
        <button
          type="button"
          className="mt-4 inline-flex w-full justify-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-2"
          style={{
            backgroundColor: InstitutionData.PrimaryColor,
          }}
          onClick={() =>
            navigate(`/signup?productId=${product?.productId || ""}`)
          }>
          Sign up
        </button>
      );
    }

    if (
      UserCtx?.status === "Active" &&
      UserCtx?.productIds?.includes(product?.productId)
    ) {
      return (
        <button
          type="button"
          className="mt-4 inline-flex w-full justify-center rounded-lg border-2 px-5 py-2.5 text-center text-sm font-medium"
          style={{
            borderColor: InstitutionData.PrimaryColor,
            color: InstitutionData.PrimaryColor,
          }}>
          Subscribed
        </button>
      );
    }

    return (
      <button
        type="button"
        className="mt-4 inline-flex w-full justify-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-2"
        style={{
          backgroundColor: InstitutionData.PrimaryColor,
        }}
        onClick={() => handlePurchase(product)}>
        Purchase
      </button>
    );
  };

  if (!products.length) return null;

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
                <FeaturesList />
              </div>
            </div>
            <div className="w-[35%] bg-white p-6 flex items-center justify-center">
              <div className="w-full max-w-[420px] max-h-[90vh] overflow-y-auto space-y-6 pr-1">
                {products.map((item) => (
                  <SubscriptionCard
                    key={item.productId}
                    product={item}
                    isDesktop={true}
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
          {/* Mobile content */}
          <div className="p-6 text-white">
            <h1 className="text-3xl font-bold mb-6">
              Staff and Member Subscription
            </h1>
            <FeaturesList isMobile={true} />
          </div>

          {/* Mobile card */}
          <div className="px-4 py-8 space-y-6">
            {products.map((item) => (
              <SubscriptionCard
                key={item.productId}
                product={item}
                isDesktop={false}
              />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TestingPayment;
