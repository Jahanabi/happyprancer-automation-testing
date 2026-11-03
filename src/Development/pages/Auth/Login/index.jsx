import { useContext, useEffect, useState } from "react";
import { signIn, signInWithRedirect } from "aws-amplify/auth";
// import { API } from "../../../Context/ContextProvider";
import InstitutionContext from "../../../Context/InstitutionContext";
import { toast } from "react-toastify";
import Context from "../../../Context/Context";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { HR } from "flowbite-react";
import {
  EmailInput,
  PasswordInput,
  PrimaryButton,
} from "../../../common/Inputs";
import { FormWrapper } from "../../../common/Layouts";

const customTheme = {
  hrLine: "my-4 h-px w-64 border-0 bg-gray-700 dark:bg-gray-200",
};

const AuthPage = () => {
  const { util, checkUserExist, updateLoginDate } = useContext(Context);
  const { setLoader } = util;
  const data = useContext(InstitutionContext).institutionData;
  const { InstitutionId, productId } =
    useContext(InstitutionContext).institutionData;
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // The login page can itself be hit with ?productId=...&referral=... (e.g.
  // a "buy this plan" link routes an unauthenticated visitor here first).
  // Neither the Google button nor the email/password form was preserving
  // that — the Google button hands off to signInWithRedirect (which only
  // ever returns to Cognito's fixed redirect_uri, dropping any query string
  // that was on *this* page), and the email/password path just navigates to
  // /redirect with no query string at all. Stashing both in sessionStorage
  // as soon as this page mounts means Redirect.jsx can pick them back up
  // afterward regardless of which login path was used.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const incomingProductId = searchParams.get("productId");
    const incomingReferral = searchParams.get("referral");
    if (incomingProductId) {
      window.sessionStorage.setItem("pending_productId", incomingProductId);
    }
    if (incomingReferral) {
      window.sessionStorage.setItem("pending_referral", incomingReferral);
    }
  }, [searchParams]);

  const handleLogin = async (event) => {
    event.preventDefault();
    const email = event.target.email.value.toLowerCase();

    setIsLoggingIn(true);
    setLoader(true);

    try {
      const exists = await checkUserExist(InstitutionId, {
        userPoolId:
          process.env.REACT_APP_STAGE === "PROD"
            ? process.env.REACT_APP_PROD_USER_POOL_ID
            : process.env.REACT_APP_DEV_USER_POOL_ID,
        username: email,
      });

      if (exists.inCognito && exists.inDynamoDb && exists.inInstitution) {
        await signIn({
          username: email,
          password: event.target.password.value,
        });
        await updateLoginDate(InstitutionId);
        toast.success("Login successful! Redirecting...");
        // Use setTimeout to ensure state updates before navigation
        setTimeout(() => {
          setLoader(false);
          setIsLoggingIn(false);
          navigate("/redirect", { replace: true });
        }, 500);
      } else {
        setLoader(false);
        setIsLoggingIn(false);
        toast.error("Account does not exist");
        navigate("/signup");
      }
    } catch (e) {
      console.log(e);
      setIsLoggingIn(false);
      // Provide more specific feedback based on Amplify error names/messages
      if (e?.name === "NotAuthorizedException") {
        if (e?.message && e.message.includes("User is disabled")) {
          toast.error("Account doesn't exist. Please create a new account.");
          navigate("/signup");
        } else {
          toast.error(e?.message || "Incorrect password");
        }
      } else if (e?.name === "UserNotConfirmedException") {
        toast.error(
          e?.message || "Account not confirmed. Please confirm your account.",
        );
        navigate("/signup");
      } else {
        toast.error(e?.message || "Unknown error occurred");
      }
      setLoader(false);
    }
  };

  return (
    <FormWrapper heading="Login">
      {/* Description below heading */}
      <div className="mb-2 text-center">
        <p className="text-gray-600">Welcome back. Let’s go!</p>
      </div>
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
      <form
        onSubmit={handleLogin}
        className="flex flex-col items-center gap-3 w-full max-w-md">
        {productId === "1000007" && (
          <>
            <button
              className="flex items-center bg-white w-full justify-center text-gray-800 px-4 py-2 border rounded-md font-semibold"
              type="button"
              onClick={() =>
                signInWithRedirect({
                  provider: "Google",
                })
              }>
              <img
                className="w-6 h-6 mr-2"
                src="https://www.gstatic.com/images/branding/product/1x/gsa_48dp.png"
                alt="Google Icon"
              />
              Sign in with Google
            </button>
            <HR.Text text="or" theme={customTheme} />
          </>
        )}
        <div className="w-full text-left">
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <EmailInput id="login-email" name="email" className="rounded w-full" />
        </div>
        <div className="w-full text-left">
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <PasswordInput id="login-password" name="password" className="rounded w-full" />
        </div>
        <Link
          to="/forgot-password"
          className="hover:underline"
          style={{ color: data.PrimaryColor }}>
          Forgot password?
        </Link>
        <PrimaryButton
          className="hover:opacity-[90%] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          disabled={isLoggingIn}>
          {isLoggingIn ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logging in...
            </span>
          ) : (
            "Continue"
          )}
        </PrimaryButton>
        {productId === "1000007" && (
          <p>
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="hover:underline"
              style={{ color: data.PrimaryColor }}>
              Signup
            </Link>
          </p>
        )}
      </form>
    </FormWrapper>
  );
};

export default AuthPage;
