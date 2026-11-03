import React, { useContext, useState, useEffect } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Context from "../../Context/Context";
import "./index.css"; //

const yogaQuotes = [
  "Yoga is the journey of the self, through the self, to the self.",
  "Inhale the future, exhale the past.",
  "Yoga is not about touching your toes, it's about what you learn on the way down.",
  "The nature of yoga is to shine the light of awareness into the darkest corners of the body.",
  "Yoga is the perfect opportunity to be curious about who you are.",
  "Calmness is the cradle of power.",
  "Yoga teaches us to cure what need not be endured and endure what cannot be cured.",
  "The pose begins when you want to leave it.",
  "Yoga is the art of awareness on the canvas of body, mind, and soul.",
  "Peace comes from within. Do not seek it without.",
];

const getRandomQuote = () => {
  return yogaQuotes[Math.floor(Math.random() * yogaQuotes.length)];
};

const LoaderProvider = (props) => {
  const UtilCtx = useContext(Context).util;
  const [quote, setQuote] = useState(getRandomQuote());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (UtilCtx.loader) {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [UtilCtx.loader]);

  useEffect(() => {
    if (UtilCtx.loader) {
      const interval = setInterval(() => {
        setIsVisible(false);
        setTimeout(() => {
          setQuote(getRandomQuote());
          setIsVisible(true);
        }, 200);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [UtilCtx.loader]);

  return (
    <div>
      {UtilCtx.loader && (
        <div
          className={`fixed top-0 left-0 w-screen h-screen bg-[#ffffffa6] backdrop-blur-3xl z-[100]`}
        >
          <div
            className={`flex flex-col items-center justify-center w-screen h-screen gap-3`}
          >
            <DotLottieReact
              src="https://lottie.host/24193183-e908-474a-94e5-e7aa46ee0020/ODfQkqxpq8.lottie"
              // src="https://lottie.host/17d36a3c-92fd-4795-a43c-4f822a02c3bb/VI3YK9Cd9f.lottie"
              loop
              autoplay
              style={{ width: "120px", height: "120px", marginLeft:"5px" }}
            />
            <div className="text-center">
              <p className="text-gray-600 text-base font-semibold transition-all duration-700 ease-in-out">
                Please wait while loading...
              </p>
              <p
                className={`text-gray-500 mt-2 text-sm italic max-w-[300px] transition-all duration-700 ease-in-out ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2"
                }`}
              >
                "{quote}"
              </p>
            </div>
          </div>
        </div>
      )}
      {props.children}
    </div>
  );
};

export default LoaderProvider;
