import React from 'react'
import ImageWithBasePath from '../../../core/img/imagewithbasebath'
import { all_routes } from '../../../Router/all_routes'
import Link from "next/link";;

const SuccessTwo = () => {

    const route = all_routes;

    return (
        <div>
            <>
                {/* Main Wrapper */}
                <div className="main-wrapper">
                    <div className="account-content">
                        <div className="row login-wrapper">
                            <div className="col-lg-6">
                                <div className="login-content">
                                    <div className="login-userset">
                                        <div className="login-userset">
                                            <div className="login-logo logo-normal">
                                                <img src="assets/img/logo.png" alt="img" />
                                            </div>
                                        </div>
                                        <Link href={all_routes.newdashboard} className="login-logo logo-white">
                                            <img src="assets/img/logo-white.png" alt="Img" />
                                        </Link>
                                        <div className="login-userheading text-center">
                                            <img src="assets/img/icons/check-icon.svg" alt="Icon" />
                                            <h3 className="text-center">Success</h3>
                                            <h4 className="verfy-mail-content text-center">
                                                Your Passwrod Reset Successfully!
                                            </h4>
                                        </div>
                                        <div className="form-login">
                                            <Link className="btn btn-login mt-0" href={route.signintwo}>
                                                Back to Login
                                            </Link>
                                        </div>
                                        <div className="my-4 d-flex justify-content-center align-items-center copyright-text">
                                            <p>Copyright © 2025 DreamsPOS</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-6">
                                <div className="login-img">
                                    <img
                                        src="assets/img/authentication/authentication-06.svg"
                                        alt="img"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* /Main Wrapper */}
            </>

        </div>
    )
}

export default SuccessTwo
