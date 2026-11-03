import React, { useState, useRef } from "react";
import { FaPencilAlt } from "react-icons/fa";

const EditableTextArea = ({ label, value, onChange,placeholder,minimumHeight,maxLength }) => {
  const [isEditable, setIsEditable] = useState(false);
  const inputRef = useRef(null);

  const handleEditClick = () => {
    setIsEditable(true);
    setTimeout(() => {
      inputRef.current.focus();
    }, 0);
  };

  return (
    <div className="relative flex flex-col gap-1 justify-center">
      <label className="ml-2">{label}</label>
      <textarea
        ref={inputRef}
        className={`bg-inputBgColor px-4 py-2 rounded-lg w-full ${minimumHeight}`}
        type="text"
        value={value}
        placeholder={"Enter your address here"}
        readOnly={!isEditable}
        onChange={onChange}
        // if max length is there use maxLength else it can be any length
        maxLength={maxLength ? maxLength : 1000}
        onBlur={() => setIsEditable(false)}
      />
      <FaPencilAlt
        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
        onClick={handleEditClick}
      />
    </div>
  );
};

export default EditableTextArea;
