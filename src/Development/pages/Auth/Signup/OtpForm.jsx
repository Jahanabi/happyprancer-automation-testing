import { OtpInput, PrimaryButton } from "../../../common/Inputs";
import { useState, useEffect } from "react";

const OtpForm = ({ handler, resendHandler, email }) => {
  const [seconds, setSeconds] = useState(30);
  const [isDisabled, setIsDisabled] = useState(true);

  const reset = () => {
    setIsDisabled(true);
    setSeconds(30);
  };

  const handleResend = () => {
    reset();
    resendHandler();
  };

  useEffect(() => {
    let interval = null;
    if (isDisabled && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsDisabled(false); // Re-enable the button when countdown reaches 0
      clearInterval(interval); // Clear the interval
    }
    return () => clearInterval(interval);
  }, [seconds, isDisabled]);

  const maskEmail = (e) => {
    if (!e) return "your email address";
    const parts = e.split("@");
    if (parts.length !== 2) return e;
    const local = parts[0];
    const domain = parts[1];
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    const first = local[0];
    const last = local[local.length - 1];
    return `${first}***${last}@${domain}`;
  };

  return (
    <form
      onSubmit={handler}
      className={`flex flex-col items-center gap-6
        w-full`}>
      <p className="text-center text-sm text-gray-600 w-full">
        We've sent a 6-digit verification code (OTP) to {maskEmail(email)}.
        Please check your inbox (and spam folder) and enter the code below to
        verify your account.
      </p>
      <OtpInput name="otp" className="rounded w-full" />
      <button
        type="button"
        onClick={handleResend}
        disabled={isDisabled}
        className="text-blue-500">
        {isDisabled ? `Resend OTP in ${seconds}s` : "Resend OTP"}
      </button>
      <PrimaryButton>Continue</PrimaryButton>
    </form>
  );
};

export default OtpForm;
