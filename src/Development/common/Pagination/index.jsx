import React from "react";
import {Pagination} from "flowbite-react";

const PaginationComponent = ({
  data,
  currentPage,
  onPageChange,
  itemsPerPage = 6,
  showIcons = true,
  hideResultsText,
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  return (
    <div className="flex items-center justify-between mt-4 px-2">
      {!hideResultsText && (
        <div className="text-xs text-gray-700 max850:hidden animate-fadeIn">
          Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
          <span className="font-medium">{Math.min(endIndex, data.length)}</span>{" "}
          of <span className="font-medium">{data.length}</span> results
        </div>
      )}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        showIcons={showIcons}
        className={`${hideResultsText ? "mx-auto" : ""} animate-slideUp text-xs`}
        previousLabel=""
        nextLabel=""
        layout="pagination"
        showPagesOnXs
        theme={{
          pages: {
            selector: {
              base: "flex h-7 min-w-[2rem] items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 text-sm font-medium text-gray-500 enabled:hover:bg-primaryColor enabled:hover:text-white transition-all duration-300"
            }
          }
        }}
        visiblePages={4}
      />
    </div>
  );
};

export default PaginationComponent;
