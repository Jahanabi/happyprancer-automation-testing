import React from 'react';

const FormField = ({ label, name, value, onChange, type = "text", required = false, readOnly = false }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full p-2 border border-gray-900 rounded-md focus:outline-none"
        required={required}
        readOnly={readOnly}
      />
    </div>
  );
};

export default FormField;
