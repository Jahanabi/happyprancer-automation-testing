import { useContext, useEffect } from "react";
// import { API } from "../../../Context/ContextProvider";
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import { toast } from "react-toastify";
import Context from "../../../Context/Context";
import InstitutionContext from "../../../Context/InstitutionContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Redirect = () => {
  const {
    util,
    setUserData,
    setIsAuth,
    onAuthLoad,
    checkUserExist,
    signupUser,
    getUserProfile,
  } = useContext(Context);
  const { InstitutionId } = useContext(InstitutionContext).institutionData;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // OAuth providers redirect back to the exact redirect_uri registered in
  // Cognito/Google — that URL is fixed and does NOT carry over whatever
  // query string was on the page that started the sign-in flow. So the
  // productId/referral that were on e.g. /signup?productId=... are already
  // gone by the time we land here. The page that *starts* the Google
  // sign-in has to stash them in sessionStorage first
  // (sessionStorage.setItem("pending_productId", productId) before calling
  // signInWithRedirect), and this is where we read them back. The URL
  // param is kept as a fallback for non-OAuth entries into this route.
  const storedProductId = window.sessionStorage.getItem("pending_productId");
  const storedReferral = window.sessionStorage.getItem("pending_referral");
  const productId = storedProductId || searchParams.get("productId");
  const referral = storedReferral || searchParams.get("referral");

  console.log("ProductId from URL:", searchParams.get("productId"));
  console.log("ProductId from sessionStorage:", storedProductId);
  console.log("Resolved productId:", productId);

  useEffect(() => {
    const redirect = async () => {
      util.setLoader(true);
      try {
        await getCurrentUser();
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();

        let attributes = {};
        if (token) {
          attributes = jwtDecode(token);
        }

        const userPoolId =
          process.env.REACT_APP_STAGE === "PROD"
            ? process.env.REACT_APP_PROD_USER_POOL_ID
            : process.env.REACT_APP_DEV_USER_POOL_ID;

        const response = await checkUserExist(InstitutionId, {
          userPoolId: userPoolId,
          username: attributes.email,
        });

        if (!response.inInstitution) {
          await signupUser(InstitutionId, {
            userName: attributes.name,
            emailId: attributes.email,
            signupMethod: "google",
          });
        }

        const userdata = await getUserProfile(InstitutionId);
        setUserData(userdata);
        setIsAuth(true);

        toast.info("Logged in");
        // onAuthLoad(true, InstitutionId);
        util.setLoader(false);

        // Clean up now that we've consumed them — don't leak a stale
        // productId into some unrelated future login on this browser.
        window.sessionStorage.removeItem("pending_productId");
        window.sessionStorage.removeItem("pending_referral");

        // Redirect based on productId presence
        if (productId) {
          const paymentUrl =
            process.env.REACT_APP_STAGE === "PROD"
              ? `https://payment.happyprancer.com/${InstitutionId}/${productId}/${userdata.cognitoId}?referral=${referral || ""}`
              : `https://betapayment.happyprancer.com/${InstitutionId}/${productId}/${userdata.cognitoId}?referral=${referral || ""}`;
          window.location.href = paymentUrl;
        } else {
          const path = window.sessionStorage.getItem("login_redirect");
          window.sessionStorage.removeItem("login_redirect");
          if (userdata.phoneNumber) navigate(path || "/dashboard");
          else navigate("/phone-update");
        }
      } catch (e) {
        toast.error("Please signup first");
        util.setLoader(false);
        navigate("/signup");
      }
    };

    redirect();
  }, []);

  return null;
};

export default Redirect;
