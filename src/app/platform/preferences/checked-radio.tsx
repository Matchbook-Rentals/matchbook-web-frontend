import React, { useState } from "react";
import { FaCheck } from "react-icons/fa"; // Assuming you're using FontAwesome for the checkmark icon

const CheckedRadio = () => {
  const [selectedOption, setSelectedOption] = useState("furnished");

  return (
    <div className="border p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg">Furnished</span>
        <div
          className={`p-2 rounded-full border-2 ${selectedOption === "furnished" ? "bg-green-500 border-green-500" : "border-gray-300"}`}
          onClick={() => setSelectedOption("furnished")}
        >
          {selectedOption === "furnished" && <FaCheck className="text-white" />}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg">Unfurnished</span>
        <div
          className={`p-2 rounded-full border-2 ${selectedOption === "unfurnished" ? "bg-green-500 border-green-500" : "border-gray-300"}`}
          onClick={() => setSelectedOption("unfurnished")}
        >
          {selectedOption === "unfurnished" && (
            <FaCheck className="text-white" />
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckedRadio;
