import React, { memo } from "react";
import "./BirthdayCard.css";

const BirthdayCard = ({ userName }) => {
  return (
    <div className="flex justify-center items-center">
      <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-xl shadow-2xl p-10 max-w-lg mx-auto text-center relative overflow-hidden transform transition-all duration-500">
        {/* Balloons with tails and floating animation */}
        <div className="balloon-container absolute bottom-0 left-20">
          <div className="balloon">
            <div className="balloon-tail"></div>
          </div>
        </div>
        <div className="balloon-container absolute bottom-0 left-1/2">
          <div className="balloon">
            <div className="balloon-tail"></div>
          </div>
        </div>
        <div className="balloon-container absolute bottom-0 right-20">
          <div className="balloon">
            <div className="balloon-tail"></div>
          </div>
        </div>

        {/* animate ping */}
        <div
          className="absolute bottom-0 left-0 w-10 h-10 bg-purple-600 rounded-full custom-ping"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-10 h-10 bg-purple-600 rounded-full custom-ping"
          style={{ animationDelay: "1.2s" }}
        ></div>
        <div
          className="absolute top-0 left-0 w-10 h-10 bg-purple-600 rounded-full custom-ping"
          style={{ animationDelay: "1.4s" }}
        ></div>
        <div
          className="absolute top-0 right-0 w-10 h-10 bg-purple-600 rounded-full custom-ping"
          style={{ animationDelay: "1.6s" }}
        ></div>

        {/* Birthday Content */}
        <h1 className="text-4xl font-bold text-white mb-4 z-10 relative animate-pulse">
          🎉 Happy Birthday {userName.split(" ")[0]}! 🎂
        </h1>
        <img
          src="https://th.bing.com/th/id/OIP.v8Is0dcyT_iakZLPY04LlQHaHK?rs=1&pid=ImgDetMain"
          alt="Birthday Cake"
          className="w-44 mx-auto mb-6 z-10 relative rounded-full shadow-lg"
        />
        <p className="text-xl text-white font-semibold mb-6 z-10 relative animate-fade-in">
          Wishing you a day filled with laughter, love, and sweet memories! 🎈
        </p>
        <button className="bg-white text-purple-700 px-6 py-3 rounded-full shadow-md mt-4 hover:bg-purple-700 hover:text-black hover:underline hover:underline-offset-4 transform hover:scale-110 transition duration-300 ease-in-out">
          Celebrate Now 🎉
        </button>
      </div>
    </div>
  );
};

export default memo(BirthdayCard);
