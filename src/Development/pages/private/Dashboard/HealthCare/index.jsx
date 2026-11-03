import React, { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { Heart, Activity } from "lucide-react";
import InstitutionContext from "../../../../Context/InstitutionContext";
import Context from "../../../../Context/Context";
import { FaWeightScale, FaHeartPulse, FaBell } from "react-icons/fa6";
import { MdWaterDrop } from "react-icons/md";
import { PiTestTubeFill } from "react-icons/pi";
import LogHealthTrackModal from "./Components/logHealthTrackModal";

const HealthDashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const { userData } = useContext(Context);
  const { institutionData } = useContext(InstitutionContext);
  console.log("institutionData", institutionData);
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);
  useEffect(() => {
    setShowModal(true);
  }, []);
  const metrics = [
    {
      id: 1,
      title: "Weight",
      unit: "kg",
      baseline: "10.0",
      latest: "40.0",
      message: "Great progress! Keep up the healthy habits. 🎉",
      icon: (
        <FaWeightScale
          fill={`${institutionData.PrimaryColor}90`}
          className=""
          size={18}
        />
      ),
    },
    {
      id: 2,
      title: "Blood Pressure",
      unit: "mmHg",
      baseline: "80/120",
      latest: "90/130",
      message: "Small improvement. Stay consistent with exercise! 💪",
      icon: (
        <FaHeartPulse
          fill={`${institutionData.PrimaryColor}90`}
          className=""
          size={18}
        />
      ),
    },
    {
      id: 3,
      title: "Blood Sugar",
      unit: "mg/dL",
      baseline: 20,
      latest: 30,
      message: "Excellent control! Your hard work is paying off. ✨",
      icon: (
        <MdWaterDrop
          fill={`${institutionData.PrimaryColor}90`}
          className=""
          size={18}
        />
      ),
    },
    {
      id: 4,
      title: "Cholesterol",
      unit: "mg/dL",
      baseline: 50,
      latest: 60,
      message: "Let’s focus on heart-healthy foods together. 💚",
      icon: (
        <PiTestTubeFill
          fill={`${institutionData.PrimaryColor}90`}
          className=""
          size={18}
        />
      ),
    },
  ];
  // show modal first time only
  useEffect(() => {
    const visited = localStorage.getItem("visitedHealthDashboard");
    if (!visited) {
      setShowModal(true);
      localStorage.setItem("visitedHealthDashboard", "true");
    }
  }, []);

  return (
    <div className="relative font-poppins min600:px-10 px-4 py-6 w-full min-h-screen">
      {/* Top Greeting Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-2 w-full">
        {/* Left Section: Icon + Text */}
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          <div
            className="flex items-center justify-center rounded-lg w-10 h-10"
            style={{
              backgroundColor: institutionData?.PrimaryColor || "#124F4D",
            }}
          >
            <Heart color="#fff" fill="#fff" size={20} />
          </div>
          <div className="leading-tight">
            <h2
              className="text-[1.35rem] max600:text-[1.15rem] font-[700] text-[#124F4D] mb-1"
              style={{
                color: institutionData?.PrimaryColor || "#124F4D",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Good morning, {userData.userName} !
            </h2>
            <p className="text-gray-500 text-[1rem] font-normal">
              Track your health journey with HappyPrancer
            </p>
          </div>
        </div>
        {/* Right Section: Buttons */}
        <div className="flex gap-3 max600:flex-col max600:w-full">
          <button
            className="px-4 py-2 rounded-md text-sm font-medium transition hover:bg-gray-100 flex items-center max600:w-full"
            style={{
              border: `1px solid ${institutionData?.PrimaryColor || "#124F4D"}`,
              color: institutionData?.PrimaryColor || "#124F4D",
              background: "#fff",
            }}
          >
            <FaBell
              className="inline-block mr-2"
              fill={institutionData.PrimaryColor}
              size={14}
            />
            Set Weekly Reminder
          </button>
          <button
            className="text-white px-4 py-2 rounded-md text-sm font-medium transition hover:bg-[#0e3c3b] flex items-center max600:w-full"
            style={{
              backgroundColor: institutionData.PrimaryColor || "#124F4D",
            }}
            onClick={() => setOpen(true)}
          >
            + Log Health Data
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 place-content-center place-items-center gap-3 w-full">
        {metrics.map((metric) => {
          const parseBloodPressure = (bpString) => {
            if (
              !bpString ||
              typeof bpString !== "string" ||
              !bpString.includes("/")
            )
              return 0;
            const [systolic, diastolic] = bpString.split("/").map(Number);
            return (systolic + diastolic) / 2;
          };

          const baselineValue =
            metric.title === "Blood Pressure"
              ? parseBloodPressure(metric.baseline)
              : Number(metric.baseline);

          const latestValue =
            metric.title === "Blood Pressure"
              ? parseBloodPressure(metric.latest)
              : Number(metric.latest);

          const progress =
            baselineValue > 0
              ? ((latestValue - baselineValue) / baselineValue) * 100 + 10
              : 10;

          return (
            <motion.div
              key={metric.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white px-4 pb-8 pt-4 rounded-xl border border-gray-100 flex flex-col gap-1 min-w-[265px] max-w-[285px] max600:min-w-[unset] max600:max-w-full max600:w-full shadow-sm"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div
                    className="w-9 h-9 flex items-center justify-center rounded-lg mr-2"
                    style={{
                      backgroundColor:
                        `${institutionData?.LightestPrimaryColor}80` ||
                        "#E6F7F5",
                    }}
                  >
                    {metric.icon}
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">
                    {metric.title}
                  </h3>
                </div>
                <button
                  className="text-xs text-green-500 px-2 py-1 rounded-lg bg-green-50 hover:bg-green-100 transition"
                  style={{
                    backgroundColor: `${institutionData.LightestPrimaryColor}70`,
                  }}
                >
                  Add Info
                </button>
              </div>
              <div className="flex justify-between mb-2 ">
                {/* Baseline */}
                <div className="flex flex-col items-start">
                  <p className="text-sm text-gray-500 mb-0.5">Baseline</p>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-extrabold text-gray-900 leading-none">
                      {metric.baseline ?? "0.0"}
                    </span>
                    <span className="text-xs text-gray-500 font-medium leading-none">
                      {metric.unit ?? "kg"}
                    </span>
                  </div>
                </div>
                {/* Latest */}
                <div className="flex flex-col items-end">
                  <p className="text-sm text-gray-500 mb-0.5">Latest</p>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-extrabold text-green-600 leading-none">
                      {metric.latest ?? "0.0"}
                    </span>
                    <span className="text-xs text-green-600 font-medium leading-none">
                      {metric.unit ?? "kg"}
                    </span>
                  </div>
                </div>
              </div>
              {/* Progress Bar with Dot */}
              <div className="relative w-full h-[6px] bg-gray-200 rounded-full overflow-hidden mt-1">
                <div
                  className="absolute h-[6px] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(10, Math.min(100, progress))}%`,
                    backgroundColor: institutionData?.PrimaryColor || "#22c55e",
                    transition: "width 0.5s ease-in-out",
                    borderRadius: "8px",
                  }}
                />
                <div
                  className="absolute top-[1px] left-[3px] w-[10px] h-[12px] rounded-full"
                  style={{
                    backgroundColor: institutionData?.PrimaryColor || "#22c55e",
                  }}
                />
              </div>
              <p className="mt-3 text-xs text-gray-600">{metric.message}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-10 text-center bg-white rounded-xl py-8 border border-gray-100 shadow-sm">
        <h2
          className="text-xl font-[700] text-gray-800 mb-2"
          style={{
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Your Health Journey
        </h2>
        <p className="text-gray-500 mb-4">
          One week with HappyPrancer classes
        </p>

        <div className="flex justify-center gap-10 text-center">
          <div>
            <p className="text-2xl font-bold text-teal-600">3</p>
            <p className="text-gray-500 text-sm">Metrics Improved</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-500">1</p>
            <p className="text-gray-500 text-sm">Needs Attention</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">75%</p>
            <p className="text-gray-500 text-sm">Overall Progress</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-8 w-[90%] max-w-md"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-teal-100 text-teal-600 p-4 rounded-full mb-4">
                <Activity size={28} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Welcome to Health Tracking
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Track your health improvements with HappyPrancer classes
              </p>

              <div className="space-y-3 w-full text-left">
                <div className="flex gap-3">
                  <span className="bg-teal-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm font-semibold">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-gray-800">
                      Log Baseline Data
                    </p>
                    <p className="text-sm text-gray-500">
                      Record your initial health metrics before starting
                      classes.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="bg-teal-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm font-semibold">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-gray-800">
                      Attend Classes
                    </p>
                    <p className="text-sm text-gray-500">
                      Join HappyPrancer fitness classes throughout the week.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="bg-teal-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm font-semibold">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-gray-800">
                      Track Progress
                    </p>
                    <p className="text-sm text-gray-500">
                      Log your metrics again after one week to see improvements.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="mt-6 bg-teal-600 text-white w-full py-2.5 rounded-lg font-semibold hover:bg-teal-700 transition"
              >
                Start Tracking
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <LogHealthTrackModal open={open} onClose={onClose} />
    </div>
  );
};

export default HealthDashboard;
