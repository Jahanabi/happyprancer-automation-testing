import { ArrowLeft } from "lucide-react";
import { FaHistory, FaPlus, FaMinus } from "react-icons/fa";
import { motion } from "framer-motion";
import { useState } from "react";

export default function PointsHistoryPage({ user, InstitutionData, setPage }) {
  const [tab, setTab] = useState("all");

  // Sample points data - in a real app, this would come from an API
  const pointsData = [
    {
      id: 1,
      title: "Completed Yoga Session",
      date: "Today, 9:30 AM",
      points: +25,
    },
    { id: 2, title: "Referred Riya", date: "Yesterday, 2:15 PM", points: +50 },
    {
      id: 3,
      title: "Redeemed Free Yoga Class",
      date: "2 days ago, 11:00 AM",
      points: -100,
    },
    {
      id: 4,
      title: "Weekly Challenge Bonus",
      date: "3 days ago, 6:00 PM",
      points: +75,
    },
    { id: 5, title: "Zumba Session", date: "4 days ago, 7:30 PM", points: +30 },
    {
      id: 6,
      title: "Daily Check-in Bonus",
      date: "5 days ago, 8:00 AM",
      points: +10,
    },
    {
      id: 7,
      title: "Redeemed Yoga T-Shirt",
      date: "1 week ago, 3:00 PM",
      points: -50,
    },
  ];

  const filteredData =
    tab === "all"
      ? pointsData
      : tab === "earned"
      ? pointsData.filter((d) => d.points > 0)
      : pointsData.filter((d) => d.points < 0);

  return (
    <div className="min-h-screen font-poppins bg-white flex flex-col items-center text-gray-800 pb-10">
      {/* Header */}
      <div
        className="absolute flex top-0 -mt-1 w-full text-white p-4 pb-5 rounded-b-[28px] shadow-md justify-between items-center z-10"
        style={{ backgroundColor: InstitutionData?.PrimaryColor }}
      >
        <ArrowLeft
          size={22}
          className="cursor-pointer"
          onClick={() => setPage("profile")}
        />
        <div className="flex items-center">
          <FaHistory size={22} />
          <h1 className="text-2xl font-semibold ml-2">Points History</h1>
        </div>
        <div></div>
      </div>

      {/* Total HP Points */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white z-10 rounded-2xl w-[90%] mt-20 py-4 px-4 flex justify-between items-center shadow-[0_3.98px_5.97px_rgba(0,0,0,0.1),0_9.95px_14.93px_rgba(0,0,0,0.1)]"
      >
        <div>
          <p className="text-gray-500 text-md font-medium">Total HP Points</p>
              <h2 className="text-[34px] leading-tight font-bold text-gray-900 mt-1">
                {user?.totalPoints || user?.hpPoints || 0}
              </h2>
        </div>

        <div className="flex items-center justify-center relative w-14 h-14">
          <svg className="w-full h-full">
            <circle
              cx="28"
              cy="28"
              r="26"
              stroke="#22c55e"
              strokeWidth="3"
              fill="none"
            />
          </svg>
          <span className="absolute text-[18px] font-bold text-gray-800">
            75%
          </span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex bg-gray-200 rounded-full p-1 mt-4 w-[90%]">
        {["all", "earned", "spent"].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`flex-1 py-2 text-sm font-medium rounded-full capitalize transition-all ${
              tab === item
                ? "bg-green-500 text-white shadow-md"
                : "text-gray-600"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Transactions */}
      <div className="w-[90%] mt-4 space-y-3 mb-10">
        {filteredData.length > 0 ? (
          filteredData.map((item) => {
            const isPositive = item.points > 0;
            const bgGradient = isPositive
              ? "bg-gradient-to-r from-[#F0FDF4] to-[#DCFCE7]"
              : "bg-gradient-to-r from-[#FAF5FF] to-[#F3E8FF]";
            const amountColor = isPositive ? "text-green-600" : "text-purple-600";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`p-4 rounded-2xl shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex justify-between items-center ${bgGradient}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isPositive ? "bg-green-100" : "bg-purple-100"
                    }`}
                  >
                    {isPositive ? (
                      <FaPlus className="text-green-600 text-sm" />
                    ) : (
                      <FaMinus className="text-purple-600 text-sm" />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium text-black`}>{item.title}</p>
                    <p className="text-xs text-gray-500">{item.date}</p>
                  </div>
                </div>
                <p className={`font-bold text-lg ${amountColor}`}>
                  {isPositive ? "+" : ""}
                  {item.points}
                </p>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
}

