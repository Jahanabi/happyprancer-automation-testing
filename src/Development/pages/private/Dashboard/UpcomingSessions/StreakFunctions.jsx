// import { API } from "../../../../Context/ContextProvider";

// Function to get the current date in the format "YYYY-MM-DD"
const getCurrentDate = () => {
  const now = new Date(); //globalTime
  return now.toISOString().split('T')[0]; // Extracts the "YYYY-MM-DD" part
};

// Function to fetch the streak count
const fetchStreakCount = async (institutionid, getStreakFn) => {
  try {
    const response = await getStreakFn(institutionid);

    if (response && response.streak !== undefined && response.level !== undefined) {
      return {
        streakCount: response.streak,
        level: response.level,
        lastCallDate: response.lastCallDate
      };
    }

    // Default values if response is incomplete
    return { streakCount: 0, level: 0, lastCallDate: null };
  } catch (error) {
    console.error('Error in fetchStreakCount:', error);
    throw error;
  }
};

// Function to update the streak
const updateStreak = async (institutionid, lastCallDate, updateStreakFn) => {
  const currentDate = getCurrentDate();

  if (!lastCallDate || lastCallDate < currentDate) {
    console.log('Updating streak as last call date is earlier than the current date.');
    const response = await updateStreakFn(institutionid);
    console.log('Streak updated:', response);
  } else {
    console.log('No update needed as the last call date matches the current date.');
  }
};

// Function to be called when the user leaves a class
const onJoinClass = async (institutionid, getStreakFn, updateStreakFn) => {
  try {
    const { lastCallDate } = await fetchStreakCount(institutionid, getStreakFn);
    await updateStreak(institutionid, lastCallDate, updateStreakFn);
  } catch (error) {
    console.error('Error in onLeaveClass:', error);
    throw error;
  }
};

export { fetchStreakCount, onJoinClass };
