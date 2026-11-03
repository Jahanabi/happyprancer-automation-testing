import { useContext, useEffect, useState } from "react";
import apiPaths from "../../utils/api-paths";

import context from "../../Context/Context";

const DateFormatter = ({ epochDate }) => {
  const { userData } = useContext(context);
  const [location, setLocation] = useState(userData?.location?.countryCode);
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setLocation(userData?.location?.countryCode);
  }, [userData?.location?.countryCode]);

  useEffect(() => {
    if (!epochDate) {
      setFormattedDate("Invalid Date");
      return;
    }

    try {
      const date = new Date(epochDate);
      if (location === "IN") {
        setFormattedDate(
          date.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
          }),
        );
      } else {
        setFormattedDate(
          date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
          }),
        );
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      setFormattedDate("Invalid Date");
    }
  }, [epochDate, location]);

  return <>{formattedDate}</>;
};

export default DateFormatter;
