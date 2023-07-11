import React, { useState } from 'react';
import '../CSS/UserDropdown.css';

function UserDropdown({ options, selectedOption, setSelectedOption, defaultText, headerLabel }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleUserSelection = username => {
    setSelectedOption(username);
    setIsOpen(false);
  };

  return (
    <div className="custom-userDropdown">
      <div className="userDropdown-header" onClick={toggleDropdown}>
        {headerLabel}{selectedOption ? selectedOption : defaultText}
      </div>
      {isOpen && (
        <div className="userDropdown-options">
          {options.map(option => (
            <div
              key={option}
              className={`userDropdown-option ${selectedOption === option ? 'selected' : ''}`}
              onClick={() => handleUserSelection(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserDropdown;