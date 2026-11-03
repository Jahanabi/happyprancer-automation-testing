import React from "react";
import { useNavigate } from "react-router-dom";
import { HiPencilAlt, HiTrash } from "react-icons/hi";

const InstructorCard = ({
  instructor,
  isAdmin,
  institutionData,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  const getReferralValue = () => {
    const { referralCode, referral_code, name } = instructor;
    console.log(instructor)
    console.log(referral_code, referralCode, name);
    return (
      referralCode?.trim() ||
      referral_code?.trim()
    );
  };

  const handleNavigate = () => {
    navigate(
      `/hybrid/?institution=${
        instructor?.institution
      }&referral=${getReferralValue()}`,
      {
        state: { instructor },
      }
    );
  };

  return (
    <div className="group relative overflow-hidden bg-white font-['Poppins']">
      {/* Admin Controls */}
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(instructor);
            }}
            className="bg-white/90 text-[#225C59] p-2 rounded-full shadow-lg hover:bg-[#225C59] hover:text-white transition-all transform hover:scale-110"
          >
            <HiPencilAlt size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(instructor);
            }}
            className="bg-white/90 text-red-600 p-2 rounded-full shadow-lg hover:bg-red-600 hover:text-white transition-all transform hover:scale-110"
          >
            <HiTrash size={18} />
          </button>
        </div>
      )}

      {/* Instructor Image */}
      <div className="relative h-[260px] overflow-hidden border border-black cursor-pointer" onClick={handleNavigate}>
        <img
          src={instructor?.image || "https://institution-utils.s3.amazonaws.com/institution-common/Assests/user.png"}
          alt={instructor?.name}
          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-105"
        />
      </div>

      {/* Content Area */}
      <div className="p-3 border-x font-inter border-b border-black flex flex-col items-start bg-white">
        <h3 className="font-bold text-base text-[#225C59] line-clamp-1">
          {instructor?.name}
        </h3>

        <p className="text-xs font-['Inter'] text-[#225C59]/80 mb-3 font-medium line-clamp-1">
          {instructor?.position || "Instructor"}
        </p>

        <button
          onClick={handleNavigate}
          className="
            w-full
            py-2
            bg-black
            text-white
            text-xs
            font-semibold
            cursor-pointer
            hover:bg-[#0E3B36]
            transition-colors
            duration-300
          "
        >
          View Hybrid Profile
        </button>
      </div>
    </div>
  );
};

export default InstructorCard;
