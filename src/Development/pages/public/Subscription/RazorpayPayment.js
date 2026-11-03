import React, { useContext, useEffect, useRef } from "react";
// import { API } from "../../../Context/ContextProvider";
// import Razorpay from "razorpay";
import InstitutionContext from "../../../Context/InstitutionContext";
// import SubscriptionPopup from "../../pages/SubscriptionPopup";
import { useNavigate } from "react-router-dom";
import Context from "../../../Context/Context";
import institutionData from "../../../utils/constants";

const RazorpayPayment = ({ productId }) => {
  const InstitutionData = useContext(InstitutionContext).institutionData;
  // eslint-disable-next-line
  const razorpay = useRef();
  const UtilCtx = useContext(Context).util;
  const { updatePayment, getUserProfile } = useContext(Context);
  const Ctx = useContext(Context);
  const UserCtx = useContext(Context).userData;

  const Navigate = useNavigate();

  useEffect(() => {
    // new window.Razorpay();
    console.log(window.razorpay);
  }, []);

  // eslint-disable-next-line
  const handleSubscribe = async () => {
    UtilCtx.setLoader(true);
    let response;
    try {
      response = await updatePayment(
        `/user/billing/regular/${InstitutionData.InstitutionId}`,
        { productId: productId }
      );
    } catch (e) {
      console.log(e);
      UtilCtx.setLoader(false);
    }
    try {
      const options = {
        key_id:
          process.env.REACT_APP_STAGE === "PROD"
            ? "rzp_live_KBQhEinczOWwzs"
            : "rzp_test_1nTmB013tmcWZS",
        amount: response.amount,
        currency: response.currency,
        name: InstitutionData.InstitutionId.toUpperCase(),
        description: response.subscriptionType,
        image: InstitutionData.logoUrl,
        order_id: response.orderId,
        handler: function (response) {
          alert(response.razorpay_payment_id);
          alert(response.razorpay_order_id);
          alert(response.razorpay_signature);
          const verify = async () => {
            UtilCtx.setLoader(true);
            try {
              let resBody = {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              };
              const res = await updatePayment(
                `/user/billing/regular/verify/${InstitutionData.InstitutionId}`,
                resBody
              );
              const tempUserdata = await getUserProfile(InstitutionData.InstitutionId);
              Ctx.setUserData(tempUserdata);
              if (res.signatureIsValid) {
                Navigate("/dashboard", { state: { isReload: true } });
              } else {
                alert(
                  "Transaction Failed If your Amount was Deducted then Contact us"
                );
              }
              // alert(res);
              UtilCtx.setLoader(false);
            } catch (e) {
              console.log(e);
              UtilCtx.setLoader(false);
            }
          };
          verify();
        },
        prefill: {
          name: UserCtx.userName,
          email: UserCtx.emailId,
          contact: "9999999999",
        },
        notes: {
          address: "Razorpay Corporate Office",
        },
        theme: {
          color: "#1b7571",
        },
      };
      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response) {
        // alert(response.error.code);
        alert(response.error.description);
        // alert(response.error.source);
        // alert(response.error.step);
        // alert(response.error.reason);
        // alert(response.error.metadata.order_id);
        // alert(response.error.metadata.payment_id);
        console.log(response);
        UtilCtx.setLoader(false);
      });
      rzp1.open();
      UtilCtx.setLoader(false);
    } catch (e) {
      console.log(e);
      UtilCtx.setLoader(false);
    }
  };

  // const handleSubscribe = () => {
  //   Navigate("/subscribe");
  // };

  const domain =
    process.env.NODE_ENV === "development" ?
      "http://localhost:3000" :
      process.env.REACT_APP_STAGE === "DEV"
        ? institutionData.BETA_DOMAIN
        : institutionData.PROD_DOMAIN;

  return (
    <div className="z-1">
      <button
        type="button"
        className="inline-flex w-full justify-center rounded-lg bg-lightPrimaryColor px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-primaryColor focus:outline-none focus:ring-2 focus:ring-lighestPrimaryColor dark:focus:ring-cyan-900"
        onClick={() => {
          window.open(
            `${domain}/allpayment/${institutionData.InstitutionId}/${UserCtx.cognitoId}/${UserCtx.emailId}?primary=${encodeURIComponent(InstitutionData.PrimaryColor.replace('#', ''))}&secondary=${encodeURIComponent(InstitutionData.SecondaryColor.replace('#', ''))}`,
            "_blank",
            "noopener,noreferrer"
          );
        }}
      >
        Subscribe
      </button>
    </div>
  );
};

export default RazorpayPayment;
