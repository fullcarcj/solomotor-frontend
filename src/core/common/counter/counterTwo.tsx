"use client"
import React, { useState } from "react";
import PropTypes from "prop-types";
import { MinusCircle, PlusCircle } from "react-feather";

const CounterTwo = () => {
  const [quantity, setQuantity] = useState(0); // Default state is 0

  const handleIncrement = () => {
    if (quantity < 99) {
      // Optional: Maximum limit
      setQuantity(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      // Prevent going below 0
      setQuantity(quantity - 1);
    }
  };

  const handleChange = (e:any) => {
    const value = e.target.value;
    const numericValue = parseInt(value, 10);

    // Allow empty input temporarily for manual edits
    if (value === "") {
      setQuantity(0); // Reset to 0 if input is empty
    } else if (
      !isNaN(numericValue) &&
      numericValue >= 0 &&
      numericValue <= 99
    ) {
      setQuantity(numericValue); // Update state with valid numbers
    }
  };

  return (
    <>

      <span className="quantity-btn" onClick={handleDecrement}>
        <MinusCircle size={14} className="feather-16" />
      </span>
      <input
        type="text"
        className="quntity-input  p-0"
        value={quantity.toString()} // Convert number to string for input
        onChange={handleChange} // Allow manual edits
      />
      <span className="quantity-btn" onClick={handleIncrement}>
        <PlusCircle size={14} className="feather-16" />
      </span>
     
    </>
  );
};
CounterTwo.propTypes = {
  defaultValue: PropTypes.number,
};
export default CounterTwo;
