import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Context from "../Context/Context";
import { useContext } from "react";
import NavBar from "../components/Header"
import "./PaymentError.module.css"

const PaymentError = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = location.state || {};
  const { institution, cognitoId, emailId } = useContext(Context).userData;

  console.log(`Incoming Message ${message}`);
  return (
    <>
      {/* <NavBar /> */}
      <div className="payment-error-container flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="error-box bg-white border-2 border-red-200 shadow-xl rounded-xl p-8 max-w-lg text-center animate-fadeIn">
          {/* Error Icon */}
          <div className="mb-6">
            <svg
              className="mx-auto h-24 w-24 text-red-500 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-extrabold text-red-600 mb-3">
            Payment Failed
          </h1>

          {/* <div className="text-sm text-gray-500 mb-6">
          Error Reference: #
          {Math.random().toString(36).substr(2, 9).toUpperCase()}
        </div> */}

          {message ? (
            <p className="text-lg text-gray-700 mb-6 bg-red-50 p-4 rounded-lg border border-red-100">
              {message}
            </p>
          ) : (
            <p className="text-md text-gray-600 mb-6 bg-red-50 p-4 rounded-lg border border-red-100">
              We were unable to process your payment. If the amount was debited
              from your account, don't worry, we will refund it within 24 hours.
              If you have any questions, please contact us.
            </p>
          )}

          <div className="payment-error-actions flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
            <button
              className="retry-button bg-gradient-to-r bg-primaryColor text-white font-semibold px-6 py-3 rounded-lg hover:bg-lightPrimaryColor shadow-md transition duration-300 hover:-translate-y-1"
              onClick={() =>
                navigate(`/allpayment/${institution}/${cognitoId}/${emailId}`)
              }
            >
              <span className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Retry Payment
              </span>
            </button>

            <button
              className="contact-button bg-white border-2 border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 shadow-md transition duration-300 hover:-translate-y-1"
              onClick={() => navigate("/query")}
            >
              <span className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                Contact Support
              </span>
            </button>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="mt-6 text-gray-500 hover:text-gray-700 transition duration-300"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </>
  );
};

export default PaymentError;
