import { useContext, useEffect, useRef, useState } from "react";
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import { get, post } from "aws-amplify/api";
import { HelmetProvider, Helmet } from "react-helmet-async";
import Context from "./Development/Context/Context";
import RoutesContainer from "./Development/routes";
import LoaderProvider from "./Development/components/LoaderProvider";
import InstitutionContext from "./Development/Context/InstitutionContext";
import apiPaths from "./Development/utils/api-paths";
import { jwtDecode } from "jwt-decode";
import institutionData from "./Development/constants";
import institutionJson from "./Operation/institutionData.json";
import { useNavigate } from "react-router-dom";
import { Theme } from "@radix-ui/themes";

//commit
function App() {
  const UtilCtx = useRef(useContext(Context).util);
  const RefCtx = useRef(useContext(Context));
  const RefInstitutionCtx = useRef(useContext(InstitutionContext));
  const InstitutionCtx = useContext(InstitutionContext);
  const InstitutionData = InstitutionCtx.institutionData;
  const navigate = useNavigate();
  const [metaData, setMetaData] = useState({
    title: InstitutionData?.title || institutionData.seo?.title || "",
    description:
      InstitutionData?.description || institutionData.seo?.description || "",
    keywords: institutionData.seo?.keywords || "",
    companyName: institutionData.institution || "",
  });

  // Function to get cached data
  const getCachedData = (key) => {
    const cachedData = localStorage.getItem(key);
    return cachedData ? JSON.parse(cachedData) : null;
  };

  // Function to set cached data
  const setCachedData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Capitalize the company name
  const getCompanyName = () => {
    return metaData.companyName
      ? metaData.companyName.charAt(0).toUpperCase() +
          metaData.companyName.slice(1)
      : "";
  };

  const setFavicon = (logoUrl) => {
    if (!logoUrl) return;

    let link = document.querySelector("link[rel~='icon']");

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    link.type = "image/x-icon";
    link.href = logoUrl;
  };

  useEffect(() => {
    const init = async () => {
      RefCtx.current.setLoadingNav(true);

      let isAuthenticated = false;
      let cognito;
      let attributes;
      try {
        cognito = await getCurrentUser();
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (token) {
          attributes = jwtDecode(token);
          isAuthenticated = true;
        }
      } catch (e) {
        if (e.name === "UserUnAuthenticatedException") {
          console.log("User is not authenticated (guest).");
        } else {
          console.error("Initial auth check failed:", e);
        }
      }

      // Load institution data
      try {
        const cachedInstitutionData = getCachedData("institutionData");
        let data;
        if (cachedInstitutionData) {
          cachedInstitutionData.FAQ = institutionJson.FAQ;
          cachedInstitutionData.Refund = institutionJson.Refund;
          cachedInstitutionData.PrivacyPolicy = institutionJson.PrivacyPolicy;
          cachedInstitutionData.TermsData = institutionJson.TermsData;
          cachedInstitutionData.AboutUs = institutionJson.AboutUs;
          cachedInstitutionData.description = institutionJson.description;
          cachedInstitutionData.title = institutionJson.title;
          cachedInstitutionData.ClassTypes = institutionJson.ClassTypes;
          cachedInstitutionData.Testimonial = institutionJson.Testimonial;
          data = cachedInstitutionData;
          RefInstitutionCtx.current.setInstitutionData(cachedInstitutionData);
          setCachedData("institutionData", cachedInstitutionData);
          setFavicon(cachedInstitutionData.logoUrl);
          setMetaData({
            title: `${cachedInstitutionData.title}`,
            description:
              cachedInstitutionData.description ||
              institutionData.seo?.description ||
              "",
            keywords:
              cachedInstitutionData.seo?.keywords ||
              institutionData.seo?.keywords ||
              "",
            companyName:
              cachedInstitutionData.companyName ||
              institutionData.institution ||
              "",
          });

          document.documentElement.style.setProperty(
            "--color-primary",
            cachedInstitutionData.PrimaryColor,
          );
          document.documentElement.style.setProperty(
            "--color-secondary",
            cachedInstitutionData.SecondaryColor,
          );
          document.documentElement.style.setProperty(
            "--color-light-primary",
            cachedInstitutionData.LightPrimaryColor,
          );
          document.documentElement.style.setProperty(
            "--color-lightest-primary",
            cachedInstitutionData.LightestPrimaryColor,
          );
        } else {
          data = institutionJson;
          data.InstitutionId =
            data.institutionid || institutionData.InstitutionId; // Fallback if needed
          setFavicon(data.logoUrl);
          RefInstitutionCtx.current.setInstitutionData(data);
          setCachedData("institutionData", data); // Cache the new data

          setMetaData({
            title: `${data.title}`,
            description:
              data.description || institutionData.seo?.description || "",
            keywords: data.seo?.keywords || institutionData.seo?.keywords || "",
            companyName: data.companyName || institutionData.institution || "",
          });

          document.documentElement.style.setProperty(
            "--color-primary",
            data.PrimaryColor,
          );
          document.documentElement.style.setProperty(
            "--color-secondary",
            data.SecondaryColor,
          );
          document.documentElement.style.setProperty(
            "--color-light-primary",
            data.LightPrimaryColor,
          );
          document.documentElement.style.setProperty(
            "--color-lightest-primary",
            data.LightestPrimaryColor,
          );
        }

        // Fetch location for all users (authenticated or not)
        const locationOp = get({
          apiName: "main",
          path: apiPaths?.getUserLocation,
        });
        const locationRes = await locationOp.response;
        const location = await locationRes.body.json();
        RefCtx.current.setUserData((prev) => ({
          ...prev,
          location,
        }));

        if (isAuthenticated) {
          // Complete auth-dependent operations
          const userdataOp = get({
            apiName: "main",
            path: `/user/profile/${data.InstitutionId}`,
          });
          const userdataRes = await userdataOp.response;
          const userdata = await userdataRes.body.json();

          RefCtx.current.setUserData((prev) => ({
            ...prev,
            ...userdata,
          }));

          if (!userdata.phoneNumber) navigate("/phone-update");
          RefCtx.current.setIsAuth(isAuthenticated);
          RefCtx.current.setLoadingNav(false);

          // Update login date
          const loginDateOp = post({
            apiName: "main",
            path: `/user/logindate-update/${data.InstitutionId}`,
          });
          await loginDateOp.response;

          // Check birthday modal
          const birthdayOp = post({
            apiName: "main",
            path: `/user/birthday-message/${data.InstitutionId}`,
          });
          const birthdayRes = await birthdayOp.response;
          const showBirthdayModal = await birthdayRes.body.json();
          RefCtx.current.setUserData((prev) => ({
            ...prev,
            showBirthdayModal,
          }));
        }
      } catch (e) {
        console.error("Error during initialization:", e);
        if (isAuthenticated) {
          // If error occurred after initial auth, reset auth
          isAuthenticated = false;
        }
      } finally {
        RefCtx.current.setIsAuth(isAuthenticated);
        RefCtx.current.setAuthInitialized(true);
        RefCtx.current.setLoadingNav(false);
        UtilCtx.current.setLoader(false);
      }
    };

    init();
  }, []);

  return (
    <HelmetProvider>
      <Helmet>
        <title>{`${metaData.title}`}</title>
        <meta name="title" content={metaData.title} />
        <meta name="description" content={metaData.description} />
        <meta
          name="keywords"
          content={
            Array.isArray(metaData.keywords)
              ? metaData.keywords.join(", ")
              : metaData.keywords
          }
        />
        {institutionData?.GTM_ID && (
          <script>{`
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${institutionData?.GTM_ID}');
  `}</script>
        )}
      </Helmet>

      {institutionData?.GTM_ID && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${institutionData.GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
      )}
      <LoaderProvider>
        <Theme>{InstitutionCtx.institutionData && <RoutesContainer />}</Theme>
      </LoaderProvider>
    </HelmetProvider>
  );
}

export default App;
