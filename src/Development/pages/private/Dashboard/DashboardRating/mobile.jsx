import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Context from "../../../../Context/Context";
import InstitutionContext from "../../../../Context/InstitutionContext";
import PaginationComponent from "../../../../common/Pagination";
import {
  extractRatingTimestamp,
  sortRatingsChronologically,
  formatMemberDisplayName,
  formatInstructorDisplayName,
} from "../../../../utils/ratingService";

export default function DashboardRatingMobile({
  ratings = [],
  instructorTypeFilter,
  setinstructorTypeFilter,
  ratingTypeFilter,
  setRatingTypeFilter,
}) {
  const navigate = useNavigate();
  const InstitutionData = useContext(InstitutionContext).institutionData;
  // const [ratings, setRatings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState({});
  const itemsPerPage = 4;
  const UserCtx = useContext(Context);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRatings = ratings.slice(startIndex, endIndex);

  const formatDate = (timestamp) => {
    const epoch = extractRatingTimestamp(timestamp);
    if (!epoch) return "N/A";
    const date = new Date(epoch);
    if (isNaN(date.getTime())) return "N/A";
    const dateLocale =
      UserCtx?.userData?.location?.countryCode === "IN" ? "en-IN" : "en-US";

    return date.toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-xl ${
          index < rating ? "text-primaryColor" : "text-gray-300"
        }`}>
        ★
      </span>
    ));
  };

  const toggleReviewExpansion = (userId) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="flex flex-col w-full inter mt-14">
      {/* Header section */}
      <div className="flex w-[99vw] justify-between items-center p-4">
        <h3 className="text-xl font-semibold text-gray-800">Ratings</h3>
        <button
          className="bg-white text-gray-800 border border-gray-300 rounded-md px-3 py-1 text-sm"
          onClick={() => {
            setShowFilters(!showFilters);
            setinstructorTypeFilter("");
            setRatingTypeFilter("");
          }}>
          Filters
        </button>
      </div>

      {/* Filter Section (placeholder for future filters) */}
      {showFilters && (
        <div className="w-[95vw] mx-auto px-4 mb-4">
          <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-base font-semibold text-gray-700 mb-2">
              Filters
            </h3>

            {/* Instructor Filter */}
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="mobileInstructorFilter"
                className="text-sm font-medium text-gray-600">
                Instructor
              </label>
              <select
                id="mobileInstructorFilter"
                value={instructorTypeFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setinstructorTypeFilter(e.target.value);
                }}
                className="rounded-lg px-3 py-2 border border-gray-300 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                <option value="">All</option>
                {Array.from(
                  new Set(ratings.map((r) => r.instructorName).filter(Boolean))
                ).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="mobileRatingFilter"
                className="text-sm font-medium text-gray-600">
                Rating
              </label>
              <select
                id="mobileRatingFilter"
                value={ratingTypeFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setRatingTypeFilter(e.target.value);
                }}
                className="rounded-lg px-3 py-2 border border-gray-300 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                <option value="">All</option>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Rating cards */}
      <div className="w-[99vw] px-4 space-y-4">
        {ratings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No ratings found</div>
        ) : (
          sortRatingsChronologically(ratings)
            .slice(startIndex, endIndex)
            .map((rating, idx) => (
              <div
                key={`${rating.userId || rating.cognitoId || "r"}-${rating.timestamp || idx}`}
                className="w-full bg-white rounded-lg p-4 border border-gray-100">
                {/* Name and Stars */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {UserCtx.userData?.userType === "member"
                        ? formatInstructorDisplayName(rating)
                        : formatMemberDisplayName(rating)}
                    </h4>
                    <div className="flex items-center">
                      {renderStars(rating.rating)}
                    </div>
                  </div>
                  {/* Date */}
                  <div className="flex items-center text-gray-500 text-xs mb-3">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>{formatDate(rating.timestamp)}</span>
                  </div>
                </div>

                {/* Review text */}
                {rating.review && (
                  <div className="text-gray-700 text-sm relative">
                    <div
                      className={`transition-all duration-300 ease-in-out ${
                        expandedReviews[rating.userId] ? "max-h-96" : "max-h-10"
                      }`}
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: expandedReviews[rating.userId]
                          ? "unset"
                          : "2",
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: "1.25rem",
                      }}>
                      {rating.review}
                    </div>

                    {rating.review.length > 100 && (
                      <div className="flex justify-end mt-1">
                        <button
                          onClick={() => toggleReviewExpansion(rating.userId)}
                          className="text-xs font-medium hover:underline transition-colors duration-200"
                          style={{ color: InstitutionData.PrimaryColor }}>
                          {expandedReviews[rating.userId]
                            ? "Show Less"
                            : "Read more"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Edit Action for Members (Requirement 4) */}
                {UserCtx?.userData?.userType === "member" && (
                  <div className="flex justify-end mt-3 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        navigate(
                          `/rating?instructorId=${rating.instructorId}${
                            rating.classId ? `&classId=${rating.classId}` : ""
                          }`,
                          {
                            state: {
                              existingRating: rating,
                              instructorId: rating.instructorId,
                              classId: rating.classId,
                            },
                          }
                        );
                      }}
                      className="px-3 py-1 text-xs font-semibold text-white rounded-md shadow-sm transition-transform hover:scale-105"
                      style={{ backgroundColor: InstitutionData.PrimaryColor }}>
                      Edit Rating
                    </button>
                  </div>
                )}
              </div>
            ))
        )}
      </div>

      {/* Pagination - Show only if there are more than 4 items */}
      {ratings.length > itemsPerPage && (
        <div className="mt-4 px-4">
          <PaginationComponent
            showIcons={true}
            data={ratings}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
            hideResultsText={true}
          />
        </div>
      )}
    </div>
  );
}
