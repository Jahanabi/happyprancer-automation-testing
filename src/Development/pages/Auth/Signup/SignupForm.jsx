import {
  BaseTextInput,
  CountrySelect,
  EmailInput,
  PasswordInput,
  PhoneInput,
  PrimaryButton,
  BaseTextInputWithValue,
} from "../../../common/Inputs";
import { useContext, useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { signInWithRedirect } from "aws-amplify/auth";
import InstitutionContext from "../../../Context/InstitutionContext";

const SignupForm = ({ handler, selectedPlan, productId }) => {
  const data = useContext(InstitutionContext).institutionData;
  const [referral_code, setReferralCode] = useState("");
  const [hybrid, setHybrid] = useState(false);
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const activeProductId =
    productId ||
    params.get("productId") ||
    window.sessionStorage.getItem("pending_productId");

  useEffect(() => {
    const referral = params?.get("referral");
    const hybridParam = params?.get("hybrid");
    if (hybridParam === "true") {
      setHybrid(true);
    }

    if (referral) {
      setReferralCode(referral);
    }
  }, [location.search]);

  const handleGoogleSignup = () => {
    if (activeProductId) {
      window.sessionStorage.setItem("pending_productId", activeProductId);
    }
    if (referral_code) {
      window.sessionStorage.setItem("pending_referral", referral_code);
    }
    signInWithRedirect({
      provider: "Google",
    });
  };

  const getBillingPeriodText = () => {
    if (!selectedPlan) return "period";
    const period = selectedPlan.durationText?.toLowerCase();
    if (!period || period === "1") {
      return selectedPlan.subscriptionType === "yearly"
        ? "year"
        : selectedPlan.subscriptionType === "monthly"
        ? "month"
        : selectedPlan.subscriptionType || "period";
    }
    return period;
  };

  const currencySymbol =
    selectedPlan?.currency === "INR"
      ? "₹"
      : selectedPlan?.currency === "CAD"
      ? "CA$"
      : "$";
  const formattedPrice = (
    Number(selectedPlan?.amount || 0) / 100
  ).toLocaleString();

  return (
      <>
        {/* Background Blur Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Left blob */}
          <div
              className="absolute w-[15rem] h-[15rem] -left-8 top-1/3 opacity-30 blur-3xl rounded-full z-[-1]"
              style={{ backgroundColor: data.PrimaryColor }}></div>

          {/* Right blob */}
          <div
              className="absolute w-[18rem] h-[18rem] -right-10 top-1/4 opacity-25 blur-3xl rounded-full z-[-1]"
              style={{ backgroundColor: data.PrimaryColor }}></div>

          {/* Top blob */}
          <div
              className="absolute w-[12rem] h-[12rem] top-0 left-1/3 opacity-20 blur-3xl rounded-full z-[-1]"
              style={{ backgroundColor: data.PrimaryColor }}></div>

          {/* Bottom blob */}
          <div
              className="absolute w-[14rem] h-[14rem] -bottom-10 right-1/4 opacity-30 blur-3xl rounded-full z-[-1]"
              style={{ backgroundColor: data.PrimaryColor }}></div>
        </div>
        {/* Glass effect container */}
        <div className=" w-full max-w-md m-auto  p-6 bg-transparent rounded-xl relative z-10 ">
          {/* Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Create Your Account
            </h2>
            <p className="text-gray-600">Join our community and get started</p>
          </div>

          {/* Selected Plan Display (HP-033) */}
          {selectedPlan && (
            <div className="mb-6 p-4 rounded-xl border-2 border-[#225C59]/30 bg-gradient-to-br from-[#E8FFFC] to-white shadow-sm text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#225C59]">
                  Selected Plan
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  ✓ Your selected plan
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-bold text-lg text-gray-900 leading-tight">
                  {selectedPlan.heading ||
                    selectedPlan.name ||
                    "Membership Plan"}
                </h3>
                <div className="text-right shrink-0">
                  <span className="font-bold text-lg text-[#225C59]">
                    {currencySymbol}
                    {formattedPrice}
                  </span>
                  <span className="text-xs text-gray-600 font-medium">
                    {" "}/ {getBillingPeriodText()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sign up options */}
          <>
            {/* Google Signup */}
            <div className="flex flex-col w-full gap-3 max-w-md mx-auto">
              <button
                  className="flex items-center justify-center text-gray-800 px-5 py-2.5
                 border border-gray-300 rounded-lg shadow-sm
                 transition-all hover:bg-gray-50 hover:border-gray-400
                 w-full font-medium"
                  type="button"
                  onClick={handleGoogleSignup}
              >
                <img
                    className="w-5 h-5 mr-3"
                    src="https://www.gstatic.com/images/branding/product/1x/gsa_48dp.png"
                    alt="Google Icon"
                />
                Sign up with Google
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center w-full my-2">
              <div className="flex-grow h-px bg-gray-300"></div>

              <span className="px-4 text-sm text-gray-500 font-medium">
      or
    </span>

              <div className="flex-grow h-px bg-gray-300"></div>
            </div>

            {/* Email Signup Form */}
            <form onSubmit={handler} className="transition-all">
              <div className="grid gap-x-6 gap-y-4">

                {/* Personal Information */}
                <div className="space-y-4">
                  <div>
                    <div className="block text-sm font-semibold text-gray-800 mb-2">
                      Personal Information
                    </div>

                    <div className="mb-2">
                      <label
                        htmlFor="signup-name"
                        className="block text-xs font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <BaseTextInput
                        id="signup-name"
                        name="name"
                        className="rounded w-full text-sm sm:text-base"
                        placeholder="Full Name"
                        pattern="[A-Za-z\s]+"
                        value={name}
                        onChange={(e) => {
                          if (/^[^0-9]*$/.test(e.target.value)) {
                            setName(e.target.value);
                          }
                        }}
                      />
                    </div>

                    <div className="mb-2">
                      <label
                        htmlFor="signup-email"
                        className="block text-xs font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <EmailInput
                        id="signup-email"
                        name="email"
                        className="rounded w-full text-sm sm:text-base"
                        placeholder="Email Address"
                      />
                    </div>

                    <div className="flex gap-2 items-start">
                      <div className="w-32 sm:w-36 shrink-0">
                        <label
                          htmlFor="signup-country"
                          className="block text-xs font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <CountrySelect
                          id="signup-country"
                          name="country"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="rounded w-full text-sm sm:text-base shrink-0"
                        />
                      </div>

                      <div className="flex-1">
                        <label
                          htmlFor="signup-phone"
                          className="block text-xs font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <PhoneInput
                          id="signup-phone"
                          name="phone"
                          countryCode={countryCode}
                          className="rounded text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="signup-password"
                      className="block text-sm font-medium text-gray-700 mb-1">
                      Create New Password
                    </label>

                    <PasswordInput
                      id="signup-password"
                      name="password"
                      className="rounded w-full text-sm sm:text-base"
                      placeholder="Create Password"
                    />
                  </div>

                  {/* Referral */}
                  <div>
                    <label
                      htmlFor="signup-referral"
                      className="block text-sm font-medium text-gray-700 mb-1">
                      Referral Code (optional)
                    </label>

                    {referral_code ? (
                      <BaseTextInputWithValue
                        id="signup-referral"
                        name="referral"
                        className="rounded w-full text-sm sm:text-base"
                        value={referral_code}
                        required={false}
                      />
                    ) : (
                      <BaseTextInput
                        id="signup-referral"
                        name="referral"
                        className="rounded w-full text-sm sm:text-base"
                        placeholder="Referral Code (optional)"
                        required={false}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Create Account */}
              <PrimaryButton
                  className="mt-3 hover:opacity-[90%] w-full text-sm sm:text-base"
                  type="submit"
              >
                Create Account
              </PrimaryButton>

              <p className="text-sm text-gray-600 text-center mt-2">
                Already have an account?{" "}
                <Link
                    to="/login"
                    className="font-medium hover:underline"
                    style={{ color: data.PrimaryColor }}
                >
                  Signin
                </Link>
              </p>
            </form>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center mt-1">
              By creating an account, you agree to our{" "}
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms
              </a>{" "}
              and{" "}
              <a
                  href="/PrivacyPolicy"
                  className="text-blue-600 hover:underline"
              >
                Privacy Policy
              </a>
            </p>
          </>
        </div>
      </>
  );
};

export default SignupForm;
