"use client";
import React, { useState } from "react";
import { Tooltip } from "antd";
import Link from "next/link";

const CollapesIcon = () => {
  // Local state to manage toggle_header
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    const newState = !isCollapsed; // Toggle the state
    setIsCollapsed(newState);

    // Add or remove the class on the body element
    if (newState) {
      document.body.classList.add("header-collapse");
    } else {
      document.body.classList.remove("header-collapse");
    }
  };

  return (
    <li className="collapse-icons">
      <Tooltip title="Collapse">
        <Link
          href="#"
          id="collapse-header"
          className={`${isCollapsed ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault(); // Prevent default link behavior
            handleToggle();
          }}
        >
          <i className={`ti ${isCollapsed ? "ti-chevron-down" : "ti-chevron-up"}`}></i>
        </Link>
      </Tooltip>
    </li>
  );
};

export default CollapesIcon;