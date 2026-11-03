import { Card, Button } from "flowbite-react";
import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
} from "react";
import { useNavigate } from "react-router";
import Context from "../../../Context/Context";
import InstitutionContext from "../../../Context/InstitutionContext";
import HappyprancerPaypalHybrid from "../Subscription/HappyprancerPaypalHybrid";
import HappyprancerPaypalMonthly from "../Subscription/HappyprancerPaypalMonthly";
import institutionData from "../../../constants";
import ProductModal from "./ProductModal";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { isOneDayPlan } from "../../../utils/subscriptionPricing";

const Subscription = () => {
  const InstitutionData = useContext(InstitutionContext)?.institutionData;
  const { util, isAuth, productList, userData: UserCtx } = useContext(Context);
  const [products, setProducts] = useState([]);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [userLocation, setUserLocation] = useState(null);
  const [bgInView, setBgInView] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [devProduct, setDevProduct] = useState(null);
  const Navigate = useNavigate();


  const institutionProductId = InstitutionData?.productId;
  // Referral discount logic:
  // - If a referral reward exists and it has not been used yet, show the plan as free on the home cards.
  const referralRewardActive =
    Boolean(UserCtx?.referred_code) && UserCtx?.referral_used === false;
  const cardVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 30,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1], // smooth, modern
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -20,
      transition: {
        duration: 0.25,
        ease: "easeIn",
      },
    },
  };

  /** -----------------------------
   * LOCATION INITIALIZATION
   * ----------------------------- */
  useEffect(() => {
    const initializeLocation = async () => {
      if (UserCtx?.location?.countryCode) {
        setUserLocation(UserCtx.location.countryCode);
        localStorage.setItem("userLocation", UserCtx.location.countryCode);
        return;
      }
      const storedLocation = localStorage.getItem("userLocation");
      if (storedLocation) {
        setUserLocation(storedLocation);
        return;
      }
      if (UserCtx?.location?.countryCode) {
        const ipLocation = UserCtx.location.countryCode === "IN" ? "IN" : "US";
        setUserLocation(ipLocation);
        localStorage.setItem("userLocation", ipLocation);
      }
    };
    initializeLocation();
  }, [UserCtx?.location?.countryCode]);

  /** -----------------------------
   * PRODUCT FILTERING
   * ----------------------------- */
  useEffect(() => {
    if (!userLocation || !productList?.length) return;

    const filteredProducts = productList
      .filter((item) => item.productId !== "1000048")
      .filter((item) => item.displayOnHome !== false)
      .filter((item) => {
        if (userLocation === "IN") {
          return (
            item.currency === "INR" &&
            item.subscriptionType?.toLowerCase() !== "hybrid"
          );
        }

        if (userLocation === "CA") {
          return (
            item.currency === "CAD" &&
            item.subscriptionType?.toLowerCase() !== "hybrid"
          );
        }

        return (
          item.currency !== "INR" &&
          item.subscriptionType?.toLowerCase() !== "hybrid"
        );
      })
      .filter((item) => item.isVisible !== false);

    const merged = filteredProducts.filter((product) => {
      if (referralRewardActive) {
        return product.referralEligible === true;
      }

      return product.referralEligible !== true;
    });

    console.log("[Subscriptions] referralRewardActive:", referralRewardActive);

    console.log(
      "[Subscriptions] merged product ids:",
      merged.map((p) => p.productId),
    );

    setProducts(merged);

    const devProd = productList.find((item) => item.productId === "1000048");

    setDevProduct(devProd);
  }, [userLocation, productList, referralRewardActive]);

  /** -----------------------------
   * INTERSECTION OBSERVER
   * ----------------------------- */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setBgInView(true);
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.01 },
    );
    const element = document.getElementById("subscription-section");
    if (element) observer.observe(element);
    return () => {
      if (element) observer.unobserve(element);
    };
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)"); // < lg
    const handler = () => setIsMobile(media.matches);

    handler();
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);
  useEffect(() => {
    if (isMobile) {
      setBillingPeriod("monthly");
    }
  }, [isMobile]);

  /** -----------------------------
   * AUTO-CYCLE BILLING PERIOD
   * ----------------------------- */

  const directionRef = useRef("forward");
  const intervalRef = useRef(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);

  useEffect(() => {
    if (isMobile || userInteracted || isCardHovered) return;

    intervalRef.current = setInterval(() => {
      setBillingPeriod((prev) => {
        if (prev === "trial") {
          directionRef.current = "forward";
          return "monthly";
        }
        if (prev === "yearly") {
          directionRef.current = "backward";
          return "monthly";
        }
        if (prev === "monthly") {
          return directionRef.current === "forward" ? "yearly" : "trial";
        }
        return "monthly"; // default fallback
      });
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMobile, userInteracted, isCardHovered]);

  const handleBillingPeriodClick = (period) => {
    setUserInteracted(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setBillingPeriod(period);
    setPageIndex(0);
  };

  const shouldBeDarkCard = (item, index) => {
    if (billingPeriod === "trial") return true; // only one card, always dark

    if (billingPeriod === "monthly") {
      return index === 0; // monthly → first card dark
    }

    if (billingPeriod === "yearly") {
      return index === 1; // yearly → second card dark
    }

    return false;
  };
  /** -----------------------------
   * HELPERS
   * ----------------------------- */
  const cardsRef = useRef(null);
  const [lockHeight, setLockHeight] = useState(null);
  const switchPlan = (type) => {
    if (!cardsRef.current) return;

    const height = cardsRef.current.getBoundingClientRect().height;
    setLockHeight(height); // 🔒 lock current height
    setBillingPeriod(type); // 🔄 change content
  };
  useLayoutEffect(() => {
    if (lockHeight !== null) {
      requestAnimationFrame(() => {
        setLockHeight(null); // 🔓 unlock AFTER paint
      });
    }
  }, [billingPeriod]);

  useEffect(() => {
    // reset to first page when products or billing period change
    setPageIndex(0);
  }, [products, billingPeriod]);

  const hasAnySubscription = () =>
    UserCtx?.productId &&
    UserCtx?.paymentId &&
    UserCtx?.renewDate &&
    Date.now() < UserCtx.renewDate;

  // check if a user is subscribed to a specific productId
  const isSubscribedTo = (productId) => {
    if (!UserCtx) return false;
    // If user's current productId matches and renewDate is in the future
    return (
      UserCtx.productId === productId &&
      UserCtx.paymentId &&
      UserCtx.renewDate &&
      Date.now() < UserCtx.renewDate
    );
  };

  // handle subscribe click - redirects to payment page or navigates to signup
  const handleSubscribeClick = async (
    cognitoId,
    referred_code,
    productId,
    order = false,
    referralAppliedFlag = false,
  ) => {
    try {
      if (!productId) {
        toast.error("Product not available");
        return;
      }

      // If user isn't signed in, navigate to signup with productId query so Redirect handles it
      if (!cognitoId) {
        Navigate(`/signup?productId=${productId}`);
        return;
      }

      // Build payment URL
      const base =
        process.env.REACT_APP_STAGE === "PROD"
          ? "https://payment.happyprancer.com"
          : "https://betapayment.happyprancer.com";

      let paymentUrl = `${base}/${InstitutionData?.InstitutionId}/${productId}/${cognitoId}`;
      const appendParam = (key, value) => {
        paymentUrl += paymentUrl.includes("?") ? "&" : "?";
        paymentUrl += `${key}=${encodeURIComponent(value)}`;
      };
      // append orderType=true if order flag is set
      if (order) appendParam("orderType", "true");

      // preserve referral if present in localStorage/session (optional)
      const referral =
        sessionStorage.getItem("referral") ||
        localStorage.getItem("referral") ||
        referred_code;

      if (referral) appendParam("referral", referral);
      if (referralAppliedFlag) appendParam("referralApplied", "true");

      // optional logging
      if (util && util.log)
        util.log("Redirecting to payment", {
          paymentUrl,
          productId,
          cognitoId,
          order,
        });
      console.debug("Redirecting to payment", paymentUrl);

      window.location.href = paymentUrl;
    } catch (e) {
      console.error(e);
      toast.error("Unable to start subscription");
    }
  };

  const renderProductCard = (item, index) => {
    const isSubscribed = isSubscribedTo(item.productId);
    const isDarkCard = shouldBeDarkCard(item, index);

    const isFamilyPlan =
      item.heading?.toLowerCase().includes("family") ||
      item.heading?.toLowerCase().includes("fusion");
    const isInstitutionPlan = item.heading?.toLowerCase().includes("institution");
    // Left card is dark
    const currencySymbol = item.currency === "INR" ? "₹" : "$";
    const basePrice = Number(item.amount || 0) / 100;
    const isYearly = billingPeriod === "yearly";

    const shouldApplyReferralDiscount = referralRewardActive;
    const finalPrice = shouldApplyReferralDiscount ? 0 : basePrice;

    return (
      <div
        key={index}
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
        className={`rounded-2xl p-4 sm:p-4 lg:p-6 relative flex flex-col h-full font-['Inter']
    transition-all duration-300
    ${
      isDarkCard
        ? "bg-[#03413A] text-white shadow-2xl"
        : "bg-[#FFFFFF]  border-2 border-[#03413A] text-gray-900 backdrop-blur-[30px] shadow-[0_4px_11px_0_#03413A]"
    }
  `}>
        {/* TOP BADGE */}
        <span
          className={`absolute hidden md:block top-6 right-6 text-xs px-4 py-1.5 rounded-full font-semibold
    ${
      isDarkCard ? "bg-[#F6F6F11A] text-white" : "bg-[#03413A1C] text-[#03413A]"
    }
  `}>
          {isDarkCard ? "Best long-term value" : "Recommended"}
        </span>

        {/* CONTENT */}
        <div className="flex-grow">
          {isFamilyPlan ? (
            <>
              <h3 className="text-xl font-inter font-bold mb-2">
                {item.heading}
              </h3>
              <p className="text-sm font-medium opacity-80 mb-3">
                The everything-for-everyone plan.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium opacity-80 mb-1">
                Or keep it simple for just you
              </p>
              <h3 className="text-xl font-bold mb-3">{item.heading}</h3>
            </>
          )}

          <div className="flex items-end gap-2 pb-3 lg:pb-2 flex-wrap">
            <span className="text-3xl font-bold leading-none">
              {currencySymbol}
              {finalPrice}
            </span>

            {shouldApplyReferralDiscount && (
              <span className="text-sm line-through opacity-60 mb-1">
                {currencySymbol}
                {basePrice}
              </span>
            )}

            <span className="text-sm opacity-70 mb-1">
              / {item.durationText || (isYearly ? "year" : "month")}
            </span>

            {!shouldApplyReferralDiscount && isYearly && !isDarkCard && (
              <span className="text-sm line-through opacity-50 mb-1">
                {currencySymbol}
                {Math.round(basePrice * 1.3)}
              </span>
            )}
          </div>

          <p
            className={`text-sm pb-2 leading-tight opacity-90 ${
              isDarkCard ? "text-[#F6F6F1E5]" : "text-[#03413A]"
            }`}>
            <span className="font-semibold">
              ≈ {currencySymbol}
              {Math.floor(finalPrice / (isYearly ? 12 : 1))}
            </span>{" "}
            {isFamilyPlan
              ? "/ month shared across your household, with full access to yoga, Zumba and BWORKZ."
              : isInstitutionPlan? "Perfect for gyms, schools, companies & community groups to offer unlimited Yoga, Zumba & BWORKZ classes to members" :"Perfect if you're building your own routine with yoga, Zumba and BWORKZ."}
          </p>

          {isFamilyPlan && item.members && (
            <p
              className={`text-sm font-semibold pb-1 ${
                isDarkCard ? "text-[#F6F6F1]" : "text-[#03413A]"
              }`}>
              Add up to {item.members} family members
            </p>
          )}

          {isFamilyPlan && (
            <p
              className={`text-sm mt-2 opacity-90 max-w-[320px] pb-2 ${
                isDarkCard ? "text-[#F6F6F1E5]" : "text-[#03413A]"
              }`}>
              Each person can pick class windows that match their schedule and
              even join multiple sessions on the same day.
            </p>
          )}
        </div>

        {/* CTA */}
        <div
          className={`mt-auto flex ${isDarkCard ? "justify-end" : "w-full"}`}>
          <button
            onClick={() => {
              // if (UserCtx.userType === "admin") {
              //   setEditingProduct(item);
              //   setModalOpen(true);
              //   setIsEditing(true);
              // } else {
              const heading = (item.heading || "").toString().toLowerCase();
              const order =
                heading.includes("day") || heading.includes("daily");
              handleSubscribeClick(
                UserCtx?.cognitoId,
                UserCtx?.referral_used ? "" : UserCtx?.referred_code,
                item.productId,
                order,
                shouldApplyReferralDiscount,
              );
              // }
            }}
            className={`
              ${isDarkCard ? "px-3 py-2 mt-3 w-full lg:w-auto" : "w-full py-2"}
              rounded-full  text-sm transition-all duration-200 cursor-pointer shadow-sm
              ${
                isDarkCard
                  ? "bg-[#F6F6F1] font-[700] text-[#03413A] hover:bg-[#E8FFFC]"
                  : "bg-[#03413A] text-[#F6F6F1] font-medium hover:bg-[#01221F]"
              }
            `}>
            {
              // UserCtx?.userType === "admin"
              //   ? "Edit Plan"
              //   :
              isDarkCard
                ? `Choose ${item.heading?.toLowerCase()}`
                : `Select ${item.heading?.toLowerCase()} for me`
            }
          </button>
        </div>
      </div>
    );
  };

  const renderDevSubscriptionCard = (index) => {
    if (!devProduct || !UserCtx?.student || billingPeriod !== "monthly")
      return null;
    return renderProductCard(devProduct, index);
  };

  const renderPlaceholderCard = (index) => {
    const isDarkCard = index === 0;
    return (
      <div
        key={`placeholder-${index}`}
        className={`rounded-3xl p-6 sm:p-8 lg:p-10 border border-dashed flex flex-col justify-center items-center h-full
          ${
            isDarkCard
              ? "border-white/30 text-white/50 bg-[#03413A]"
              : "border-gray-300 text-gray-400 bg-gray-50"
          }
        `}>
        <p className="text-xl font-bold">Coming Soon</p>
        <p className="text-sm">More options are on the way</p>
      </div>
    );
  };

  const isOneDayPlan = (product) =>
    product.heading?.toLowerCase().includes("day") ||
    product.durationText?.toLowerCase().includes("day");

  /** -----------------------------
   * MAIN RETURN (Modern Layout)
   * ----------------------------- */
  return (
    <div
      id="subscription-section"
      className="relative bg-[#E8FFFC] lg:bg-[#FFFFFF] py-16 lg:py-24 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-7">
        {/* HEADER AREA */}
        <div className="flex flex-col xl:flex-row justify-center xl:justify-between items-center xl:items-start lg:px-28 mb-10 gap-8">
          <div className="text-center w-full bg-[#03413A] lg:bg-[#FFFFFF]  lg:text-left">
            <h2 className="lg:text-[#03413A] text-[#FFFFFF] font-['Inter'] text-xl md:text-2xl lg:text-4xl font-[800] lg:font-extrabold  uppercase  py-2">
              Find the membership that fits your flow
            </h2>
          </div>
          <div className="hidden lg:block absolute top-40 -left-4 w-[80px] h-[80px] blur-3xl bg-primaryColor "></div>
          <div className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 w-[80px] h-[80px] blur-3xl bg-primaryColor"></div>

          <div className="hidden lg:block absolute  top-0 -right-4   w-[80px] h-[80px]  blur-3xl bg-primaryColor "></div>

          <div className="hidden lg:block absolute  bottom-20 right-4 w-[80px] h-[80px] blur-3xl bg-primaryColor "></div>

          <div className="flex flex-col items-center lg:items-end gap-4">
            {
              // UserCtx?.userType === "admin" && (
              //   <Button
              //     size="sm"
              //     className="bg-[#03413A] hover:!bg-[#01221F] rounded-full px-8"
              //     onClick={() => {
              //       setModalOpen(true);
              //       setIsEditing(false);
              //     }}
              //   >
              //     Create New Plan
              //   </Button>
              // )
            }

            {/* TOGGLE */}
            <div className="font-['Inter'] font-bold flex bg-[#FFFFFF] lg:bg-[#03413A14] rounded-full border-1 border-[#03413A] p-1.5 shadow-sm">
              <button
                onClick={() => handleBillingPeriodClick("trial")}
                className={`px-6 lg:px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300
                  ${
                    billingPeriod === "trial"
                      ? "bg-[#03413A] text-white shadow-md"
                      : "text-[#03413A] hover:bg-gray-50"
                  }
                `}>
                Trial
              </button>
              <button
                onClick={() => handleBillingPeriodClick("monthly")}
                className={`px-6 lg:px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300
                  ${
                    billingPeriod === "monthly"
                      ? "bg-[#03413A] text-white shadow-md"
                      : "text-[#03413A] hover:bg-gray-50"
                  }
                `}>
                Monthly
              </button>
              <button
                onClick={() => handleBillingPeriodClick("yearly")}
                className={`px-6 lg:px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300
                  ${
                    billingPeriod === "yearly"
                      ? "bg-[#03413A] text-white shadow-md"
                      : "text-[#03413A] hover:bg-gray-50"
                  }
                `}>
                Yearly
              </button>
            </div>
          </div>
        </div>

        {/* CARDS GRID */}
        <AnimatePresence mode="wait">
          <motion.div
            key={billingPeriod} // 👈 triggers animation on plan switch
            ref={cardsRef}
            style={lockHeight ? { height: lockHeight } : {}}
            className="
      grid lg:grid-cols-2 gap-4
      lg:px-12 xl:px-24
      overflow-hidden
    "
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.12, // 🔥 stagger effect
                },
              },
            }}>
            {(() => {
              let list = [];

              if (billingPeriod === "trial") {
                list = products.filter((p) => isOneDayPlan(p));
              } else {
                list = products.filter(
                  (p) =>
                    p.subscriptionType?.toLowerCase() === billingPeriod &&
                    !isOneDayPlan(p),
                );
              }

              // Prioritize specific testing product IDs so they show together
              let prioritized = [...list];

              // If student dev product should appear, ensure it's included at the front
              if (
                UserCtx?.student &&
                devProduct &&
                billingPeriod === "monthly"
              ) {
                if (
                  !prioritized.find((p) => p.productId === devProduct.productId)
                ) {
                  prioritized = [devProduct, ...prioritized];
                }
              }

              // Pagination: show up to 3 cards per page (except trial which shows a single card)
              if (billingPeriod === "trial") {
                const first = prioritized[0];
                const slot = first ? [first] : [null];
                return slot.map((slotItem, idx) => (
                  <motion.div
                    key={slotItem?.productId || `placeholder-${idx}`}
                    variants={cardVariants}>
                    {slotItem
                      ? renderProductCard(slotItem, idx)
                      : renderPlaceholderCard(idx)}
                  </motion.div>
                ));
              }

              const itemsPerPage = 3;
              const totalPages = Math.max(
                1,
                Math.ceil(prioritized.length / itemsPerPage),
              );
              const start = pageIndex * itemsPerPage;
              const visible = prioritized.slice(start, start + itemsPerPage);

              return visible.map((slot, idx) => (
                <motion.div
                  key={slot?.productId || `placeholder-${idx}`}
                  variants={cardVariants}>
                  {slot
                    ? renderProductCard(slot, idx)
                    : renderPlaceholderCard(idx)}
                </motion.div>
              ));
            })()}
          </motion.div>
        </AnimatePresence>
        {/* Pagination controls: prev/next for pages when more than 3 products */}
        <div className="mt-6 flex items-center justify-center gap-4">
          {products &&
            (() => {
              const list = products.filter((p) => {
                if (billingPeriod === "trial") return isOneDayPlan(p);
                return (
                  p.subscriptionType?.toLowerCase() === billingPeriod &&
                  !isOneDayPlan(p)
                );
              });
              // ensure testing products prioritized same way
              let prioritized = [...list];
              if (
                UserCtx?.student &&
                devProduct &&
                billingPeriod === "monthly"
              ) {
                if (
                  !prioritized.find((p) => p.productId === devProduct.productId)
                ) {
                  prioritized = [devProduct, ...prioritized];
                }
              }

              const itemsPerPage = 3;
              const totalPages = Math.max(
                1,
                Math.ceil(prioritized.length / itemsPerPage),
              );

              if (billingPeriod === "trial" || totalPages <= 1) return null;

              return (
                <>
                  <button
                    onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                    disabled={pageIndex === 0}
                    className={`rounded-full px-4 py-2 border ${pageIndex === 0 ? "opacity-40 cursor-not-allowed" : ""}`}>
                    Prev
                  </button>
                  <div className="text-sm text-gray-600">
                    Page {pageIndex + 1} of {totalPages}
                  </div>
                  <button
                    onClick={() =>
                      setPageIndex((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={pageIndex >= totalPages - 1}
                    className={`rounded-full px-4 py-2 border ${pageIndex >= totalPages - 1 ? "opacity-40 cursor-not-allowed" : ""}`}>
                    Next
                  </button>
                </>
              );
            })()}
        </div>
      </div>

      {modalOpen && (
        <ProductModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          isEditing={isEditing}
          initialData={editingProduct}
          userLocation={userLocation}
          setProducts={setProducts}
        />
      )}
    </div>
  );
};

export default Subscription;
