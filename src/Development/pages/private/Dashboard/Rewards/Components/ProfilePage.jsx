import { FaUserEdit, FaHistory, FaTrophy } from "react-icons/fa";
import {
  FaCircleQuestion,
  FaCircleInfo,
  FaGift,
  FaStar,
  FaUsers,
} from "react-icons/fa6";
import { FiLogOut } from "react-icons/fi";
import { BsCheckCircleFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";

export default function ProfilePage({ user, InstitutionData, setPage }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen font-poppins bg-gray-50 flex flex-col items-center pb-10">
      {/* Header Section */}
      <div
        className="relative w-full text-white rounded-b-3xl shadow-md pb-20 flex flex-col items-center justify-center"
        style={{
          backgroundColor: InstitutionData
            ? InstitutionData.PrimaryColor
            : "bg-emerald-700",
        }}
      >
        {/* Refresh / Logout Icon */}
        <button
        onClick={()=>{
          navigate("/logout")
        }}
        className="absolute top-4 right-5  p-2 rounded-full hover:bg-opacity-30 transition">
          <FiLogOut size={24} strokeWidth={4} className="" />
        </button>

        {/* Profile Image */}
        <div className="relative mt-6">
          <img
            src={
              user.avatar ||
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ718nztPNJfCbDJjZG8fOkejBnBAeQw5eAUA&s"
            }
            alt="Profile"
            className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
          />
          <BsCheckCircleFill
            className="absolute bottom-[1px] -right-1 rounded-full"
            size={28}     
            fill="#98FB98"
          />
        </div>

        {/* Name & Email */}
        <h2 className="text-3xl font-poppins font-semibold mt-3">
          {user.userName || "Sai"}
        </h2>
        <p className="text-md font-poppins font- text-white">
          {user.emailId || "Saiswaroop@gmail.com"}
        </p>
      </div>

      {/* Stats Card */}
      <div className="w-[90%] bg-white rounded-3xl shadow-[0_3.98px_5.97px_rgba(0,0,0,0.1),0_9.95px_14.93px_rgba(0,0,0,0.1)] -mt-16 py-3 px-3 flex justify-center gap-3 text-center z-10 mx-auto">
        {/* Total Points */}
        <div className="flex flex-col items-center">
          <div className="bg-purple-100 rounded-full p-3 mb-2">
            <FaStar className="text-purple-500 text-xl" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 leading-none">
            {user?.totalPoints || user?.hpPoints || 0}
          </p>
          <p className="text-md text-gray-500 mt-1">Total Points</p>
        </div>

        {/* Referrals */}
        <div className="flex flex-col items-center">
          <div className="bg-green-100 rounded-full p-3 mb-2">
            <FaUsers className="text-green-600 text-xl" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 leading-none">
            {user?.referrals || 0}
          </p>
          <p className="text-md text-gray-500 mt-1">Referrals Made</p>
        </div>

        {/* Rewards */}
        <div className="flex flex-col items-center">
          <div className="bg-pink-100 rounded-full p-3 mb-2">
            <FaGift className="text-pink-500 text-xl" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 leading-none">
            {Array.isArray(user?.rewards) ? user.rewards.length : (user?.rewards || 0)}
          </p>
          <p className="text-md text-gray-500 mt-1">Rewards Redeemed</p>
        </div>
      </div>

      {/* Options List */}
      <div className="w-[90%] mt-6 flex flex-col gap-3">
        <OptionItem
          icon={<FaUserEdit className="text-purple-500" />}
          label="Edit Profile"
          onClick={() => {
            // Handle edit profile functionality
            console.log("Edit Profile clicked");
          }}
        />
        <OptionItem
          icon={<FaHistory className="text-green-500" />}
          label="Points History"
          onClick={() => setPage("pointsHistory")}
        />
        <OptionItem
          icon={<FaTrophy className="text-pink-500" />}
          label="Rewards"
          onClick={() => setPage("rewards")}
        />
        <OptionItem
          icon={<FaCircleQuestion className="text-blue-500" />}
          label="Help & Support"
          onClick={() => {
            // Handle help & support functionality
            console.log("Help & Support clicked");
          }}
        />
        <OptionItem
          icon={<FaCircleInfo className="text-yellow-500" />}
          label="About HappyPrancer"
          onClick={() => {
            // Handle about functionality
            console.log("About HappyPrancer clicked");
          }}
        />
      </div>
    </div>
  );
}

// Reusable OptionItem Component
function OptionItem({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm hover:bg-gray-100 transition"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          {icon}
        </div>
        <p className="font-medium text-gray-800">{label}</p>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
}
