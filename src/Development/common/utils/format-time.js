const formatTime = (epochDate) => {
    if (!epochDate) return "N/A";
    try {
      const date = new Date(epochDate);
      if (isNaN(date.getTime())) return "N/A";
  
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
  
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const formattedHours = String(hours).padStart(2, "0");
  
      return `${formattedHours}:${minutes} ${ampm}`;
    } catch (error) {
      return "N/A";
    }
};

export default formatTime;
