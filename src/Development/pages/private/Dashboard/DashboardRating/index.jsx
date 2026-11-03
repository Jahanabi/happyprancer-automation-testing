// import { API } from "../../../../Context/ContextProvider";
import React, { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Pagination, Button } from "flowbite-react";
import { useMediaQuery } from "../../../../utils/helpers";
import DashboardRatingMobile from "./mobile";
import InstitutionContext from "../../../../Context/InstitutionContext";
import Context from "../../../../Context/Context";
import { Table } from "flowbite-react";
import Skeleton from "react-loading-skeleton";
import formatTime from "../../../../common/utils/format-time";
import DateFormatter from "../../../../common/utils/DateFormatter";
import PaginationComponent from "../../../../common/Pagination";
import {
  extractRatingTimestamp,
  sortRatingsChronologically,
  filterRatingsByRole,
  groupRatingsByDate,
  formatMemberDisplayName,
  formatInstructorDisplayName,
} from "../../../../utils/ratingService";

export default function DashboardRating() {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const InstitutionData = useContext(InstitutionContext).institutionData;
  const UserCtx = useContext(Context);
  const { fetchRatingsAdmin } = useContext(Context);
  const itemsPerPage = 7;
  const [expandedReviews, setExpandedReviews] = useState({});
  const toggleReviewExpansion = (userId) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const [ratingTypeFilter, setRatingTypeFilter] = useState("");
  const [instructorTypeFilter, setinstructorTypeFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [allRatings, setAllRatings] = useState([]);
  const dateLocale =
    UserCtx?.userData?.location?.countryCode === "IN" ? "en-IN" : "en-US";

  const fetchRatings = useCallback(async () => {
    if (!UserCtx?.userData?.userType) {
      setIsLoading(false);
      return;
    }

    try {
      setFetchError(null);
      setIsLoading(true);
      const response = await fetchRatingsAdmin();
      const ratingList = Array.isArray(response) ? response : [];
      const roleFiltered = filterRatingsByRole(ratingList, UserCtx.userData);
      setRatings(roleFiltered);
    } catch (error) {
      console.error("Error fetching ratings:", error);
      setFetchError(error?.message || "Failed to load ratings.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchRatingsAdmin, UserCtx?.userData]);

  useEffect(() => {
    fetchRatings();
    const intervalId = setInterval(fetchRatings, 60000);
    return () => clearInterval(intervalId);
  }, [fetchRatings]);

  useEffect(() => {
    const sortedRatings = sortRatingsChronologically(ratings);

    const filtered = sortedRatings
      .filter((rating) =>
        instructorTypeFilter === ""
          ? true
          : (rating?.instructorName || "").trim().toLowerCase() ===
            instructorTypeFilter?.trim().toLowerCase(),
      )
      .filter((rate) =>
        ratingTypeFilter === ""
          ? true
          : Number(rate.rating) === Number(ratingTypeFilter),
      );

    setAllRatings(filtered);
  }, [ratings, instructorTypeFilter, ratingTypeFilter]);

  const calculateAverageRatings = () => {
    return groupRatingsByDate(allRatings, dateLocale);
  };

  const isMobileScreen = useMediaQuery("(max-width: 600px)");
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  function renderStarRating(averageRating) {
    const stars = [];
    const fullStars = Math.floor(averageRating);
    const halfStar = averageRating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-500 text-l mx-1">
          <i className="fas fa-star"></i>
        </span>,
      );
    }

    if (halfStar) {
      stars.push(
        <span key="half" className="text-yellow-500 text-l mx-1">
          <i className="fas fa-star-half-alt"></i>
        </span>,
      );
    }

    const remainingStars = Math.max(5 - fullStars - (halfStar ? 1 : 0), 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300 text-l mx-1">
          <i className="fas fa-star"></i>
        </span>,
      );
    }

    return stars;
  }

  if (isMobileScreen) {
    return (
      <DashboardRatingMobile
        ratings={allRatings}
        instructorTypeFilter={instructorTypeFilter}
        setinstructorTypeFilter={setinstructorTypeFilter}
        ratingTypeFilter={ratingTypeFilter}
        setRatingTypeFilter={setRatingTypeFilter}
      />
    );
  }

  if (UserCtx.userData.userType === "instructor") {
    const instructorAverageRatings = calculateAverageRatings();

    return (
      <div className="instructor-dashboard-container w-full">
        {fetchError && (
          <div className="w-[85%] mx-auto mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-sm text-red-700">
            <span>{fetchError}</span>
            <button
              onClick={fetchRatings}
              className="px-3 py-1 bg-red-600 text-white font-medium rounded-md text-xs hover:bg-red-700">
              Retry
            </button>
          </div>
        )}

        <div className="h-[calc(100vh-150px)] ml-[6rem] max1050:ml-0 max1050:mt-0">
          <div
            className={`w-[85%] min-h-[35rem] max536:bg-transparent max536:w-full rounded-3xl p-2 flex flex-col items-center
      max1050:w-[94vw] mx-[2.5%] max1440:w-[95%] mt-10`}
            // style={{ backgroundColor: InstitutionData.LightestPrimaryColor }}
          >
            <div className="overflow-x-auto w-full">
              <Table hoverable>
                <Table.Head
                  style={{ backgroundColor: InstitutionData.PrimaryColor }}>
                  <Table.HeadCell className="text-center ">Date</Table.HeadCell>
                  <Table.HeadCell className="text-center ">
                    Average Rating
                  </Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <Table.Row
                          key={index}
                          className="animate-pulse bg-gray-200">
                          <Table.Cell className="h-6 w-full bg-gray-300 rounded">
                            <Skeleton height={20} />
                          </Table.Cell>
                          <Table.Cell className="h-6 w-full bg-gray-300 rounded">
                            <Skeleton height={20} />
                          </Table.Cell>
                        </Table.Row>
                      ))
                    : Object.keys(instructorAverageRatings).length === 0 ? (
                        <Table.Row>
                          <Table.Cell colSpan={2} className="text-center py-8 text-gray-500">
                            No ratings found
                          </Table.Cell>
                        </Table.Row>
                      ) : (
                        Object.keys(instructorAverageRatings).map(
                          (date) =>
                            instructorAverageRatings[date] && (
                              <Table.Row
                                key={date}
                                className="text-center bg-white hover:bg-gray-100">
                                <Table.Cell className="text-black font-semibold">
                                  {date}
                                </Table.Cell>
                                <Table.Cell>
                                  {renderStarRating(
                                    instructorAverageRatings[date],
                                  )}
                                </Table.Cell>
                              </Table.Row>
                            ),
                        )
                      )}
                </Table.Body>
              </Table>

              <div className="absolute bottom-0 w-full flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(endIndex, allRatings.length)}
                  </span>{" "}
                  of <span className="font-medium">{allRatings.length}</span>{" "}
                  results
                </div>
                <PaginationComponent
                  data={allRatings}
                  itemsPerPage={6}
                  currentPage={currentPage}
                  onPageChange={onPageChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (UserCtx.userData.userType === "member") {
    return (
      <div className="w-full member-dashboard-container">
        <div className="h-[calc(100vh-150px)] ml-[6rem] max1050:ml-[0] max1050:mt-0">
          <div className="w-[85%] min-h-[35rem] max536:bg-transparent max536:w-[100%] rounded-3xl p-2 flex flex-col items-center max1050:w-[94vw] mx-[2.5%] max1440:w-[95%] mt-4">
            <div className="w-full h-full relative">
              <div className="w-full">
                <Table striped>
                  <Table.Head
                    className="rounded-3xl"
                    style={{ backgroundColor: InstitutionData.PrimaryColor }}>
                    <Table.HeadCell className="text-center w-[30%]">
                      Instructor
                    </Table.HeadCell>
                    <Table.HeadCell className="text-center">
                      Date
                    </Table.HeadCell>
                    <Table.HeadCell className="text-center">
                      Time
                    </Table.HeadCell>
                    <Table.HeadCell className="text-center">
                      Rating
                    </Table.HeadCell>
                    <Table.HeadCell className="text-center">
                      Action
                    </Table.HeadCell>
                  </Table.Head>
                  <Table.Body>
                    {isLoading
                      ? Array.from({ length: 6 }).map((_, index) => (
                          <Table.Row
                            key={index}
                            className="animate-pulse bg-gray-200">
                            <Table.Cell className="text-center">
                              <Skeleton height={20} width={100} />
                            </Table.Cell>
                            <Table.Cell className="text-center">
                              <Skeleton height={20} width={80} />
                            </Table.Cell>
                            <Table.Cell className="text-center">
                              <Skeleton height={20} width={60} />
                            </Table.Cell>
                            <Table.Cell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Skeleton
                                    key={i}
                                    height={20}
                                    width={20}
                                    circle
                                  />
                                ))}
                              </div>
                            </Table.Cell>
                            <Table.Cell className="text-center">
                              <Skeleton height={20} width={40} />
                            </Table.Cell>
                          </Table.Row>
                        ))
                      : allRatings.length === 0 ? (
                        <Table.Row>
                          <Table.Cell colSpan={5} className="text-center py-8 text-gray-500">
                            No ratings found
                          </Table.Cell>
                        </Table.Row>
                      ) : (
                        allRatings
                          .slice(startIndex, endIndex)
                          .map((rating) => {
                            const epoch = extractRatingTimestamp(rating);
                            return (
                              <Table.Row
                                key={`${rating.userId || "u"}-${rating.timestamp || rating.classId || Math.random()}`}>
                                <Table.Cell className="text-gray-700 font-semibold text-center">
                                  {formatInstructorDisplayName(rating)}
                                </Table.Cell>
                                <Table.Cell className="text-gray-700 font-semibold text-center">
                                  {epoch > 0 ? (
                                    <DateFormatter epochDate={epoch} />
                                  ) : (
                                    "N/A"
                                  )}
                                </Table.Cell>
                                <Table.Cell className="text-gray-700 font-semibold text-center">
                                  {epoch > 0 ? formatTime(epoch) : "N/A"}
                                </Table.Cell>
                                <Table.Cell className="text-gray-700 font-semibold text-center">
                                  <div className="flex items-center justify-center">
                                    {Array.from({ length: 5 }, (_, index) => (
                                      <span
                                        key={index}
                                        className={`text-sm mx-1 ${
                                          index < rating.rating
                                            ? "text-yellow-500"
                                            : "text-gray-300"
                                        }`}>
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </Table.Cell>
                                <Table.Cell className="text-center">
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
                                    className="px-3 py-1 text-xs font-semibold text-white rounded-lg transition-transform hover:-translate-y-0.5"
                                    style={{ backgroundColor: InstitutionData.PrimaryColor }}>
                                    Edit
                                  </button>
                                </Table.Cell>
                              </Table.Row>
                            );
                          })
                      )}
                  </Table.Body>
                </Table>
              </div>
              <PaginationComponent
                data={allRatings}
                itemsPerPage={7}
                currentPage={currentPage}
                onPageChange={onPageChange}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" w-full">
      <h2 className="pl-5 font-sans text-[1.4rem] max536:mb-3 max536:text-[1.7rem] sans-serif max536:text-[bg-[#1b7571] font-bold text-center mt-4 w-[80%] mx-auto">
        Reviews
      </h2>
      <div className="min-h-screen ml-[6rem] max1050:ml-[0] max1050:mt-0">
        <div className="w-[85%] flex justify-end mt-4">
          <Button
            style={{
              backgroundColor: InstitutionData.LightPrimaryColor,
            }}
            onClick={() => {
              setShowFilters(!showFilters);
            }}>
            Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="w-[85%] bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex justify-end gap-6">
              <div className="flex items-center gap-3">
                <label className="font-bold" htmlFor="instructorTypeFilter">
                  Instructor:
                </label>
                <select
                  className="rounded-lg px-4 py-2 border border-gray-300"
                  style={{
                    backgroundColor: InstitutionData.LightestPrimaryColor,
                  }}
                  id="instructorTypeFilter"
                  value={instructorTypeFilter}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setinstructorTypeFilter(e.target.value);
                  }}>
                  <option value="">All</option>
                  {Array.from(
                    new Set(ratings.map((rating) => rating.instructorName)),
                  ).map((instructorName) => (
                    <option key={instructorName} value={instructorName}>
                      {instructorName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="font-bold" htmlFor="ratingTypeFilter">
                  Rating:
                </label>
                <select
                  className="rounded-lg px-4 py-2 border border-gray-300"
                  style={{
                    backgroundColor: InstitutionData.LightestPrimaryColor,
                  }}
                  id="ratingTypeFilter"
                  value={ratingTypeFilter}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setRatingTypeFilter(e.target.value);
                  }}>
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

        <div className="w-[85%] min-h-[35rem] max536:bg-transparent max536:w-[100%] rounded-3xl p-2 flex flex-col items-center max1050:w-[94vw] mx-[2.5%] max1440:w-[95%] mt-4">
          <div className="w-full h-full relative">
            <div className="w-full">
              <Table striped>
                <Table.Head
                  className="rounded-3xl"
                  style={{
                    backgroundColor: InstitutionData.PrimaryColor,
                  }}>
                  <Table.HeadCell className="text-center">
                    User Name
                  </Table.HeadCell>
                  <Table.HeadCell className="text-center">
                    Instructor
                  </Table.HeadCell>
                  <Table.HeadCell className="text-center">Date</Table.HeadCell>
                  <Table.HeadCell className="text-center">Time</Table.HeadCell>
                  <Table.HeadCell className="text-center">
                    Rating
                  </Table.HeadCell>
                  <Table.HeadCell className="text-center">
                    Review
                  </Table.HeadCell>
                </Table.Head>
                <Table.Body>
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, index) => (
                        <Table.Row
                          key={index}
                          className="animate-pulse bg-gray-200">
                          <Table.Cell className="text-center">
                            <Skeleton height={20} width={80} />
                          </Table.Cell>
                          <Table.Cell className="text-center">
                            <Skeleton height={20} width={100} />
                          </Table.Cell>
                          <Table.Cell className="text-center">
                            <Skeleton height={20} width={80} />
                          </Table.Cell>
                          <Table.Cell className="text-center">
                            <Skeleton height={20} width={60} />
                          </Table.Cell>
                          <Table.Cell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton
                                  key={i}
                                  height={20}
                                  width={20}
                                  circle
                                />
                              ))}
                            </div>
                          </Table.Cell>
                          <Table.Cell className="text-center">
                            <Skeleton height={20} width={150} />
                          </Table.Cell>
                        </Table.Row>
                      ))
                    : allRatings.length === 0 ? (
                        <Table.Row>
                          <Table.Cell colSpan={6} className="text-center py-8 text-gray-500">
                            No reviews found
                          </Table.Cell>
                        </Table.Row>
                      ) : (
                        allRatings
                          .slice(startIndex, endIndex)
                          .map((rating) => {
                            const epoch = extractRatingTimestamp(rating);
                            return (
                              <Table.Row
                                key={`${rating.userId || "u"}-${rating.timestamp || rating.classId || Math.random()}`}>
                                <Table.Cell className="text-gray-700 font-semibold text-center">
                                  {formatMemberDisplayName(rating)}
                                </Table.Cell>
                                <Table.Cell className="text-gray-700 font-semibold text-center">
                                  {formatInstructorDisplayName(rating)}
                                </Table.Cell>
                                <Table.Cell className="text-gray-700 font-semibold text-center">
                                  {epoch > 0 ? (
                                    <DateFormatter epochDate={epoch} />
                                  ) : (
                                    "N/A"
                                  )}
                                </Table.Cell>
                                <Table.Cell className="text-gray-700 font-semibold text-center">
                                  {epoch > 0 ? formatTime(epoch) : "N/A"}
                                </Table.Cell>
                                <Table.Cell className="text-gray-700 font-semibold text-center">
                                  <div className="flex items-center justify-center">
                                    {Array.from({ length: 5 }, (_, index) => (
                                      <span
                                        key={index}
                                        className={`text-sm mx-1 ${
                                          index < rating.rating
                                            ? "text-yellow-500"
                                            : "text-gray-300"
                                        }`}>
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </Table.Cell>
                                <Table.Cell className="text-gray-700 font-semibold text-center">
                                  {rating.review ? (
                                    <div className="text-gray-700 text-sm relative">
                                      <div
                                        className={`transition-all duration-300 ease-in-out ${
                                          expandedReviews[rating.userId]
                                            ? "max-h-96"
                                            : "max-h-10"
                                        }`}
                                        style={{
                                          display: "-webkit-box",
                                          WebkitLineClamp: expandedReviews[
                                            rating.userId
                                          ]
                                            ? "unset"
                                            : "2",
                                          WebkitBoxOrient: "vertical",
                                          overflow: "hidden",
                                          lineHeight: "1.25rem",
                                        }}>
                                        {rating.review}
                                      </div>

                                      {rating.review.length > 110 && (
                                        <div className="flex justify-end mt-1">
                                          <button
                                            onClick={() =>
                                              toggleReviewExpansion(rating.userId)
                                            }
                                            className="text-xs font-medium hover:underline transition-colors duration-200"
                                            style={{
                                              color: InstitutionData.PrimaryColor,
                                            }}>
                                            {expandedReviews[rating.userId]
                                              ? "Show Less"
                                              : "Read more"}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 italic text-xs">
                                      No review comment
                                    </span>
                                  )}
                                </Table.Cell>
                              </Table.Row>
                            );
                          })
                      )}
                </Table.Body>
              </Table>
            </div>
            <PaginationComponent
              data={allRatings}
              itemsPerPage={7}
              currentPage={currentPage}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
