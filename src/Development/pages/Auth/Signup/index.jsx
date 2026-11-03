import Header from "../../../components/Header";
// import { API } from "../../../Context/ContextProvider";
import {
  signUp,
  confirmSignUp,
  signIn,
  resendSignUpCode,
} from "aws-amplify/auth";
import { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import SignupForm from "./SignupForm";
import OtpForm from "./OtpForm";
import countries from "../../../common/Inputs/countries.json";
import InstitutionContext from "../../../Context/InstitutionContext";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Context from "../../../Context/Context";
import { FormWrapper } from "../../../common/Layouts";

const Signup = () => {
  const { util, signupUser, productList, getProductsAny } = useContext(Context);
  const { setLoader } = util;
  const { InstitutionId } = useContext(InstitutionContext).institutionData;
  const [formState, setFormState] = useState("signup");
  const [userData, setUserData] = useState({});
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  const rawProductId = searchParams.get("productId");
  const navigate = useNavigate();
  const location = useLocation();
  // Variables to store trial status and period from URL
  const [trialStatus, setTrialStatus] = useState(null);
  const [trialPeriod, setTrialPeriod] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Extract trial params from URL
  const params = new URLSearchParams(location.search);
  const trial = params.get("trial");
  const period = params.get("trialPeriod");
  const hybridPath = params.get("hybrid");
  const referral = params.get("referral");
  const studentParam = params.get("student");
  const isStudentReferral = studentParam === "true";

  const productId =
    rawProductId || window.sessionStorage.getItem("pending_productId");

  useEffect(() => {
    if (trial === "true" && period) {
      setTrialStatus("Trial");
      setTrialPeriod(period); // e.g., 'Monthly', 'Quarterly', etc.
    }
  }, [location.search]);

  // Persist productId & referral in sessionStorage and resolve selectedPlan
  useEffect(() => {
    const currentPid =
      searchParams.get("productId") ||
      window.sessionStorage.getItem("pending_productId");
    const currentRef =
      searchParams.get("referral") ||
      window.sessionStorage.getItem("pending_referral");

    if (currentPid) {
      window.sessionStorage.setItem("pending_productId", currentPid);
    }
    if (currentRef) {
      window.sessionStorage.setItem("pending_referral", currentRef);
    }

    if (!currentPid) {
      setSelectedPlan(null);
      return;
    }

    // Try finding in existing productList first
    const fromContext = productList?.find(
      (p) => String(p.productId) === String(currentPid)
    );
    if (fromContext) {
      setSelectedPlan(fromContext);
      return;
    }

    // Fallback: fetch directly
    let isCancelled = false;
    const resolveProduct = async () => {
      try {
        if (getProductsAny && InstitutionId) {
          const list = await getProductsAny(InstitutionId);
          const found = list?.find(
            (p) => String(p.productId) === String(currentPid)
          );
          if (found && !isCancelled) {
            setSelectedPlan(found);
          }
        }
      } catch (err) {
        console.warn("Unable to fetch selected plan details:", err);
      }
    };
    resolveProduct();

    return () => {
      isCancelled = true;
    };
  }, [searchParams, productList, InstitutionId, getProductsAny]);

  const handleSignup = async (event) => {
    event.preventDefault();
    const email = event.target.email.value.toLowerCase();

    const selectedCode = event.target.country.value;
    const countryEntry = countries.find(
      (c) => c.countryCode === selectedCode || c.value === String(selectedCode)
    );

    const userCountry = countryEntry
      ? countryEntry.name.split(" (")[0]
      : selectedCode;
    const dialCode = countryEntry ? countryEntry.value : selectedCode;

    setLoader(true);
    try {
      await signUp({
        username: email,
        password: event.target.password.value,
        options: {
          userAttributes: {
            email: email,
            // Add other attributes if needed or mapped in cognito
          },
        },
      });

      // Prepare user data including trial status, period, and signup method
      const userPayload = {
        userName: event.target.name.value,
        emailId: email,
        phoneNumber: `+${dialCode}${event.target.phone.value}`,
        country: userCountry,
        referred_code: event.target.referral.value,
        status: trialStatus || "Inactive", // Set status to Trial if URL param exists
        trialPeriod: trialPeriod || null, // Add trialPeriod from URL
        trial: trial,
        signupMethod: "manual",
        student: isStudentReferral ? "true" : undefined,
      };

      setUserData(userPayload);
      setPassword(event.target.password.value);
      setFormState("confirm");
    } catch (e) {
      console.log(e);
      if (e.name === "UsernameExistsException")
        toast.error("User already exists.", { autoClose: false });
      else if (e.name === "InvalidPasswordException")
        toast.error(e.message, { autoClose: false });
      else toast.error("Error signing up", { autoClose: false });
    } finally {
      setLoader(false);
    }
  };

  const confirmSignup = async (event) => {
    event.preventDefault();
    setLoader(true);
    try {
      await confirmSignUp({
        username: userData.emailId,
        confirmationCode: event.target.otp.value,
      });
      await signIn({ username: userData.emailId, password });

      // Send user data to API
      await signupUser(
        InstitutionId,
        {
          ...userData,
          trial: trial,
          trialPeriod: trialPeriod,
          signupMethod: "manual",
          student: isStudentReferral ? "true" : undefined,
        },
        {
          trial: trial,
          trialPeriod: trialPeriod,
          hybrid: hybridPath,
          student: isStudentReferral ? "true" : undefined,
        },
      );

      setLoader(false);
      const activeProductId =
        productId || window.sessionStorage.getItem("pending_productId");
      const activeReferral =
        referral || window.sessionStorage.getItem("pending_referral");

      if (activeProductId && activeReferral) {
        navigate(
          `/redirect?productId=${activeProductId}&referral=${activeReferral}`
        );
      } else if (activeProductId) {
        navigate(`/redirect?productId=${activeProductId}`);
      } else {
        navigate(`/redirect`);
      }
    } catch (e) {
      toast.error(e.message, { autoClose: false });
    } finally {
      setLoader(false);
    }
  };

  const resendHandler = async () => {
    await resendSignUpCode({ username: userData.emailId });
  };

  return (
    <FormWrapper>
      {formState === "signup" ? (
        <SignupForm
          handler={handleSignup}
          selectedPlan={selectedPlan}
          productId={productId}
        />
      ) : (
        <OtpForm
          handler={confirmSignup}
          resendHandler={resendHandler}
          email={userData.emailId}
        />
      )}
    </FormWrapper>
  );
};

export default Signup;
