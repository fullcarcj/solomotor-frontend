"use client";
{/* eslint-disable-next-line @next/next/no-img-element */}
import React from "react";
import { Tooltip } from "antd";
import Link from "next/link";


const TooltipIcons = () => {
  return (
    <>
      <li>
        <Tooltip title="Pdf">
          <Link href="#">
            <img src="assets/img/icons/pdf.svg" alt="img" />
          </Link>
        </Tooltip>
      </li>
      <li>
        <Tooltip title="Excel">
          <Link href="#">
            <img src="assets/img/icons/excel.svg" alt="img" />
          </Link>
        </Tooltip>
      </li>
    </>
  );
};

export default TooltipIcons;
