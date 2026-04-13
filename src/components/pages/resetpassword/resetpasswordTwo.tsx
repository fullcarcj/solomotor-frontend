"use client";
/* eslint-disable @next/next/no-img-element */

import { all_routes } from "@/data/all_routes";
import Link from "next/link";
import React, { useState } from "react";


export default function ResetpasswordTwoComponent() {
  const route = all_routes;

  const [passwordVisibility, setPasswordVisibility] = useState({
           password: false,
           confirmPassword: false,
           oldPassword: false,
           newPassword: false,
       });
    
        const togglePasswordVisibility = (field:any) => {
            setPasswordVisibility((prevState:any) => ({
                ...prevState,
                [field]: !prevState[field],
            }));
        };

  return (
    <>
      {/* Main Wrapper */}
      <div className="main-wrapper">
        <div className="account-content">
          <div className="row login-wrapper m-0">
            <div className="col-lg-6 p-0">
              <div className="login-content">
                <form>
                  <div className="login-userset">
                    <div className="login-logo logo-normal">
                      <img src="assets/img/logo.png" alt="img" />
                    </div>
                    <Link href={route.dashboard} className="login-logo logo-white">
                      <img src="assets/img/logo-white.png" alt="Img" />
                    </Link>
                    <div className="login-userheading">
                      <h3>Reset password?</h3>
                      <h4>
                        Enter New Password &amp; Confirm Password to get inside
                      </h4>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Old Password <span className="text-danger"> *</span>
                      </label>
                      <div className="pass-group">
                        <input
                          type={
                            passwordVisibility.oldPassword
                              ? "text"
                              : "password"
                          }
                          className="pass-input form-control"
                        />
                        <span
                          className={`ti toggle-passwords ${passwordVisibility.oldPassword
                            ? "ti-eye"
                            : "ti-eye-off"
                            }`}
                          onClick={() =>
                            togglePasswordVisibility("oldPassword")
                          }
                        ></span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        New Password <span className="text-danger"> *</span>
                      </label>
                      <div className="pass-group">
                        <input
                          type={
                            passwordVisibility.newPassword
                              ? "text"
                              : "password"
                          }
                          className="pass-input form-control"
                        />
                        <span
                          className={`ti toggle-passwords ${passwordVisibility.newPassword
                            ? "ti-eye"
                            : "ti-eye-off"
                            }`}
                          onClick={() =>
                            togglePasswordVisibility("newPassword")
                          }
                        ></span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Confirm Password <span className="text-danger"> *</span>
                      </label>
                      <div className="pass-group">
                        <input
                          type={
                            passwordVisibility.confirmPassword
                              ? "text"
                              : "password"
                          }
                          className="pass-input form-control"
                        />
                        <span
                          className={`ti toggle-passwords ${passwordVisibility.confirmPassword
                            ? "ti-eye"
                            : "ti-eye-off"
                            }`}
                          onClick={() =>
                            togglePasswordVisibility("confirmPassword")
                          }
                        ></span>
                      </div>
                    </div>
                    <div className="form-login">
                      <Link href={route.successTwo} className="btn btn-login">
                        Change Password
                      </Link>
                    </div>
                    <div className="signinform text-center">
                      <h4>
                        Return to{" "}
                        <Link href={route.signintwo} className="hover-a">
                          {" "}
                          login{" "}
                        </Link>
                      </h4>
                    </div>
                    <div className="my-4 d-flex justify-content-center align-items-center copyright-text">
                      <p>Copyright © 2025 DreamsPOS</p>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="col-lg-6 p-0">
              <div className="login-img">
                <img
                  src="assets/img/authentication/authentication-05.svg"
                  alt="img"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Main Wrapper */}
    </>


  );
};


