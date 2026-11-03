// Packages
import { Select, TextInput } from "flowbite-react";
import React, { useContext, useEffect, useState } from "react";

// Local
import {
  LuHash,
  LuLock,
  LuMail,
  LuPhone,
  LuText,
  LuEye,
  LuEyeOff,
} from "react-icons/lu";
import Context from "../../Context/Context";
import institutionContext from "../../Context/InstitutionContext";
import countries from "./countries.json";
//import {useSelector} from "react-redux";

export const CountrySelect = (props) => {
  const { userData } = useContext(Context);
  const [internalCountry, setInternalCountry] = useState("IN");

  const rawValue = props.value !== undefined ? props.value : internalCountry;
  const currentMatch =
    countries.find(
      (item) => item.countryCode === rawValue || item.value === String(rawValue)
    ) || countries[0];

  const currentCountryCode = currentMatch?.countryCode || "IN";

  useEffect(() => {
    if (userData?.location?.countryCode) {
      const match = countries.find(
        (c) => c.countryCode === userData.location.countryCode
      );
      if (match) setInternalCountry(match.countryCode);
    } else if (userData?.location?.countryValue) {
      const match = countries.find(
        (c) => c.value === String(userData.location.countryValue)
      );
      if (match) setInternalCountry(match.countryCode);
    }
  }, [userData?.location?.countryCode, userData?.location?.countryValue]);

  useEffect(() => {
    if (props.value !== undefined) {
      const match = countries.find(
        (c) => c.countryCode === props.value || c.value === String(props.value)
      );
      if (match) setInternalCountry(match.countryCode);
    }
  }, [props.value]);

  const handleChange = (event) => {
    const selectedCode = event.target.value;
    setInternalCountry(selectedCode);
    if (props.onChange) {
      props.onChange(event);
    }
  };

  const { value, onChange, compact, ...rest } = props;

  return (
    <Select value={currentCountryCode} onChange={handleChange} {...rest}>
      {countries.map((item) => (
        <option key={item.countryCode} value={item.countryCode}>
          {item.name}
        </option>
      ))}
    </Select>
  );
};



export const PhoneInput = ({
  countryCode = "IN",
  country,
  showGuidance = true,
  id,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState("");

  const activeCode = countryCode || country?.countryCode || "IN";
  const matchedCountry =
    countries.find(
      (c) => c.countryCode === activeCode || c.value === String(activeCode)
    ) || countries[0];

  const minLength = matchedCountry?.minLength || 8;
  const maxLength = matchedCountry?.maxLength || 11;
  const guidance =
    matchedCountry?.guidance || `Enter a ${minLength}-digit phone number.`;

  const pattern =
    minLength === maxLength
      ? `[0-9]{${minLength}}`
      : `[0-9]{${minLength},${maxLength}}`;

  const handleChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, "");
    if (digitsOnly.length <= maxLength) {
      setInternalValue(digitsOnly);
      if (props.onChange) {
        props.onChange(event);
      }
    }
  };

  const currentValue = props.value !== undefined ? props.value : internalValue;
  const guidanceId = id ? `${id}-guidance` : "phone-guidance";
  const existingDescribedBy = props["aria-describedby"] || "";
  const combinedDescribedBy = showGuidance
    ? [existingDescribedBy, guidanceId].filter(Boolean).join(" ")
    : existingDescribedBy || undefined;

  return (
    <div className="w-full">
      <TextInput
        id={id}
        type="tel"
        placeholder={props.placeholder || "Phone Number"}
        icon={LuPhone}
        required
        pattern={pattern}
        title={guidance}
        maxLength={maxLength}
        value={currentValue}
        onChange={handleChange}
        aria-describedby={combinedDescribedBy}
        {...props}
      />
      {showGuidance && (
        <p id={guidanceId} className="text-xs text-gray-500 mt-1 text-left font-normal pl-0.5">
          {guidance}
        </p>
      )}
    </div>
  );
};

export const EmailInput = (props) => {
  return (
    <TextInput
      type="email"
      placeholder="Email Address"
      icon={LuMail}
      required
      {...props}
    />
  );
};

export const PasswordInput = ({ id, ...props }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (value) => {
    if (value.length < 8) return "Must be at least 8 characters.";
    if (!/\d/.test(value)) return "Must contain a number.";
    if (!/[A-Z]/.test(value)) return "Must contain an uppercase letter.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value))
      return "Must contain a special character.";
    return "";
  };

  const handleChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setError(validatePassword(newPassword));
    if (props.onChange) {
      props.onChange(e);
    }
  };

  const currentValue = props.value !== undefined ? props.value : password;
  const errorId = id ? `${id}-error` : "password-error";
  const existingDescribedBy = props["aria-describedby"] || "";
  const combinedDescribedBy = error
    ? [existingDescribedBy, errorId].filter(Boolean).join(" ")
    : existingDescribedBy || undefined;

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative w-full">
        <TextInput
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          icon={LuLock}
          value={currentValue}
          onChange={handleChange}
          required
          aria-describedby={combinedDescribedBy}
          aria-invalid={error ? true : props["aria-invalid"] !== undefined ? props["aria-invalid"] : false}
          className={`border ${
            error ? "border-red-500" : "border-gray-300"
          }`}
          {...props}
        />

        {currentValue && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500"
          >
            {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <p id={errorId} className="text-red-600 text-sm text-center">
          {error}
        </p>
      )}
    </div>
  );
};

export const OtpInput = (props) => {
  return (
    <TextInput
      type="text"
      placeholder="OTP"
      icon={LuHash}
      required
      pattern="[0-9]{6}"
      title="OTP is 6 digits"
      {...props}
    />
  );
};

export const BaseTextInput = (props) => {
  return (
    <TextInput
      type="text"
      placeholder="Enter text here..."
      icon={LuText}
      required
      {...props}
    />
  );
};

export const BaseTextInputWithValue = (props) => {
  return (
    <TextInput
      type="text"
      placeholder="Enter text here..."
      icon={LuText}
      value={props?.value || ""}
      required
      {...props}
    />
  );
};

export const PrimaryButton = ({ children, ...props }) => {
  const { PrimaryColor } = useContext(institutionContext).institutionData;
  //  const { PrimaryColor } = useSelector((state) => state.institutionData.data);

  return (
    <button
      style={{
        backgroundColor: PrimaryColor,
        width: "100%",
        height: "40px",
        color: "white",
        borderRadius: "10px",
      }}
      {...props}>
      {children}
    </button>
  );
};

// Components used in old components

export const Button1 = ({ data, fn, w = "auto", h = "auto" }) => {
  return (
    <button
      className={`sans-serif tracking-wider bg-[#2f2f2f] text-[#e1e1e1] h-[${h}] rounded-lg py-2 px-2 w-[${w}]`}
      onClick={fn}>
      {data}
    </button>
  );
};

export const Button2 = ({
  data,
  fn,
  w = "auto",
  h = "auto",
  className = "",
}) => {
  const InstitutionData = useContext(institutionContext).institutionData;
  return (
    <button
      className={`sans-serif tracking-wider font-semibold rounded-lg py-2 px-2 text-white h-[${h}] w-[${w}] ${className}`}
      style={{
        backgroundColor: InstitutionData.PrimaryColor,
      }}
      onClick={fn}>
      {data}
    </button>
  );
};
