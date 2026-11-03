import React, { useContext, useState } from 'react';
import institutionContext from '../../Context/InstitutionContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PaginatedTable = ({ head, data, itemsPerPage = 10, ...props }) => {
  const { PrimaryColor } = useContext(institutionContext).institutionData;
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total number of pages
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Get paginated data for the current page
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Generate page numbers array with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    // Calculate start and end of visible pages
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    // Adjust if at the start or end
    if (currentPage <= 2) {
      end = 4;
    }
    if (currentPage >= totalPages - 1) {
      start = totalPages - 3;
    }

    // Add ellipsis and numbers
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages - 1) pages.push('...');
    
    // Always show last page
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Table Component */}
      <div className="w-full overflow-x-auto shadow-md rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-100">
            <tr>
              {head.map((item, i) => (
                <th
                  key={i}
                  className="px-6 py-3 font-medium tracking-wider"
                >
                  {item}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((array, i) => (
              <tr
                key={i}
                className="bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                {array.map((item, index) => (
                  <td
                    key={index}
                    className="px-6 py-4 whitespace-nowrap"
                  >
                    {item}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-1">
            {getPageNumbers().map((pageNum, index) => (
              <button
                key={index}
                onClick={() => typeof pageNum === 'number' && handlePageChange(pageNum)}
                className={`px-3 py-1 rounded-lg ${
                  pageNum === currentPage
                    ? 'bg-gray-300 text-white'
                    : 'hover:bg-gray-100'
                } ${typeof pageNum !== 'number' ? 'cursor-default' : ''}`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PaginatedTable;