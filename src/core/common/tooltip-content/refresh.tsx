/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-keys */
/* eslint-disable no-const-assign */
"use client"
import React from 'react'

import { Tooltip } from 'antd';
import Link from 'next/link';

type RefreshIconProps = { onRefresh?: () => void };

const RefreshIcon = ({ onRefresh }: RefreshIconProps) => {
  return (
    <li>
      <Tooltip title="Refresh">
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onRefresh?.();
          }}
        >
          <i className="ti ti-refresh"></i>
        </Link>
      </Tooltip>
    </li>
  );
};

export default RefreshIcon