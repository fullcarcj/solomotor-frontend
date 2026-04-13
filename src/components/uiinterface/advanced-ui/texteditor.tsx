"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import Link from "next/link";
import { all_routes } from "@/data/all_routes";
import TextEditor from "@/core/common/texteditor/texteditor";
const routes = all_routes;
const TextEditorComponent = () => {


  return (
    <div className="page-wrapper cardhead">
      <div className="content ">
        {/* Page Header */}
        <div className="page-header">
          <div className="row">
            <div className="col-sm-12">
              <h3 className="page-title">Text Editor</h3>
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link href={routes.dashboard}
                  >Dashboard</Link>
                </li>
                <li className="breadcrumb-item active">Text Editor</li>
              </ul>
            </div>
          </div>
        </div>
        {/* /Page Header */}
        <div className="row">
          {/* Editor */}
          <div className="col-md-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Editor</h5>
              </div>
              <div className="card-body">
                {/* <div id="summernote" /> */}
                <TextEditor/>
              </div>
            </div>
          </div>
          {/* /Editor */}
        </div>
      </div>
    </div>
  );
};

export default TextEditorComponent;
