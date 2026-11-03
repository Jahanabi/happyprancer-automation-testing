import React, { useContext, useState, useEffect } from "react";
import LeftBanner from "./LeftBanner";
import NavBar from "../../../components/Header";
import Context from "../../../Context/Context";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import InstitutionContext from "../../../Context/InstitutionContext";
import BirthdayModal from "./ProfileUpdate/BirthdayModal";

const DashBoard = () => {
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const Navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const Ctx = useContext(Context);
  const { userData, onAuthLoad } = useContext(Context);
  const { util } = useContext(Context);
  useEffect(() => {
    let cancelled = false;
    if (!userData) return;

    const run = async () => {
      try {
        // util.setLoader(true);

        // Works for both sync and async onAuthLoad:
        await Promise.resolve(onAuthLoad(true, InstitutionData?.InstitutionId));
      } catch (error) {
        console.error("Error running onAuthLoad:", error);
      } finally {
        // if (!cancelled) util.setLoader(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [InstitutionData?.InstitutionId]);

  const isProfileSection = location.pathname === "/account";
  const isUpcomingClassesPage = location.pathname === "/dashboard";
  const isMembersPage = location.pathname === "/members";
  const hideLeftBanner = isUpcomingClassesPage || isMembersPage;

  console.log("Upcoming Classes Page:", isUpcomingClassesPage);

  return (
    <>
      <NavBar />
      <div
        className={`flex flex-col items-center max-w-screen no-scrollbar mt-[1.5rem]`}>
        {Ctx?.userData &&
          Ctx.userData.hasOwnProperty("dob") &&
          Ctx.userData.dob && <BirthdayModal />}
        <div
          className={`w-full rounded-3xl flex max1050:w-screen max1050:ml-0 max536:rounded-none items-top ml-0 h-full relative`}>
          {!hideLeftBanner && <LeftBanner />}
          <div
            className={`    flex
              flex-col
              w-full
              pb-4
              min-h-[calc(100vh-100px)]
              overflow-y-auto`}>
            {Ctx.userData.status === "Inactive" &&
            Ctx.userData.userType === "member" &&
            !isProfileSection ? (
              <div className="relative">
                <div className="absolute z-10 inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center max-w-4xl w-full text-center p-8 gap-6">
                    {/* SUBSCRIBE BUTTON (hide when referral is available) */}
                    {Ctx.userData?.referral_used !== false && (
                      <button
                        className="flex items-center justify-center px-6 py-3 rounded-full text-white font-medium transition-all hover:shadow-lg"
                        onClick={() => Navigate("/subscription")}
                        style={{
                          backgroundColor: InstitutionData.PrimaryColor,
                        }}>
                        <img
                          src="https://institution-utils.s3.amazonaws.com/institution-common/images/Dashboard/lock.svg"
                          alt=""
                          className="w-5 h-5 mr-2"
                        />
                        <span>SUBSCRIBE AND UNLOCK</span>
                      </button>
                    )}

                    {/* CLAIM NOW CARD */}
                    {Ctx.userData?.referral_used === false && (
                      <div className="w-full max-w-md  px-4 py-3 text-center">
                        <p className="text-base font-semibold text-gray-800">
                          Claim your free subscription
                        </p>
                        <p className="text-sm text-gray-600">
                          You have a free referral reward waiting. Activate it
                          now to unlock premium access.
                        </p>

                        <button
                          className="mt-3 inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:shadow-lg"
                          style={{
                            backgroundColor: InstitutionData.PrimaryColor,
                          }}
                          onClick={() => Navigate("/subscription")}>
                          Claim Now
                        </button>
                      </div>
                    )}

                    {/* SWITCH ACCOUNT */}
                    <div className="flex items-center gap-2 mt-3 justify-center">
                      <span className="text-gray-600">
                        Already have a{" "}
                        <span
                          className="font-bold"
                          style={{ color: InstitutionData.PrimaryColor }}>
                          subscription
                        </span>{" "}
                        with a different email?
                      </span>

                      <button
                        className={`underline hover:text-blue-800 font-medium transition-colors`}
                        onClick={() => Navigate("/logout")}
                        disabled={loading}
                        style={{ color: InstitutionData.PrimaryColor }}>
                        {loading ? "Processing..." : "Switch Account"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="opacity-20">
                  <Outlet />
                </div>
              </div>
            ) : (
              <div>
                <Outlet />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashBoard;
