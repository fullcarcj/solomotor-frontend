"use client";

import React, { useState } from "react";
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { all_routes } from "@/data/all_routes";
import { usePathname } from "next/navigation"; // Import usePathname from next/navigation
import Link from "next/link";

const SettingsSideBar = (props: any) => {
  const route = all_routes;
  const pathname = usePathname(); // Use usePathname to get the current route path

  const [isGeneralSettingsOpen, setIsGeneralSettingsOpen] = useState(false);
  const [isWebsiteSettingsOpen, setIsWebsiteSettingsOpen] = useState(false);
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);
  const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
  const [isFinancialSettingsOpen, setIsFinancialSettingsOpen] = useState(false);
  const [isOtherSettingsOpen, setIsOtherSettingsOpen] = useState(false);
  const [isSubmenutwo, setSubmenutwo] = useState(false);
  const [isSms, setSms] = useState(false);

  const toggleGeneralSettings = () => {
    setIsGeneralSettingsOpen(!isGeneralSettingsOpen);
  };

  const toggleWebsiteSettings = () => {
    setIsWebsiteSettingsOpen(!isWebsiteSettingsOpen);
  };

  const toggleAppSettings = () => {
    setIsAppSettingsOpen((prev) => !prev);
  };

  const toggleSystemSettings = () => {
    setIsSystemSettingsOpen((prev) => !prev);
  };

  const toggleFinancialSettings = () => {
    setIsFinancialSettingsOpen((prev) => !prev);
  };

  const toggleOtherSettings = () => {
    setIsOtherSettingsOpen((prev) => !prev);
  };

  const toggleSubmenutwo = () => {
    setSubmenutwo((prev) => !prev);
  };

  const toggleSms = () => {
    setSms((prev) => !prev);
  };

  return (
    <div>
    <div className="settings-sidebar" id="sidebar2" >

      <div className="sidebar-inner slimscroll">
        <PerfectScrollbar
          style={{ marginRight: -5, height: 800 }}
          autoHide
          autoHeight
          autoHeightMin={400} // Set a minimum height for the scrollbar
          {...props}
        // width={100}
        // autoHideTimeout={1000}
        // autoHideDuration={200}
        // autoHeight
        // autoHeightMin={0}
        // autoHeightMax="95vh"
        // thumbMinSize={30}
        // universal={false}
        // hideTracksWhenNotNeeded={true}
        >
          <div id="sidebar-menu5" className="sidebar-menu">
            <h4 className="fw-bold fs-18 mb-2 pb-2">Settings</h4>
            <ul>
              <li className="submenu-open">
                <ul>
                  <li className="submenu">
                    <Link href="#" onClick={toggleGeneralSettings} className={pathname === route.generalsettings || pathname === route.securitysettings || pathname === route.notification || pathname == route.connectedapps ? 'active subdrop' : ''}>
                      <i className="ti ti-settings fs-18"></i>
                      <span className="fs-14 fw-medium ms-2">General Settings</span>
                      <span className="menu-arrow" />
                    </Link>
                    <ul
                      style={{
                        display: isGeneralSettingsOpen ? "block" : "none",
                      }}
                    >
                      <li>
                        <Link
                          href={route.generalsettings}
                          className={
                            pathname === route.generalsettings
                              ? "active"
                              : ""
                          }
                        >
                          Profile
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.securitysettings}
                          className={
                            pathname === route.securitysettings
                              ? "active"
                              : ""
                          }
                        >
                          Security
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.notification}
                          className={
                            pathname === route.notification
                              ? "active"
                              : ""
                          }
                        >
                          Notifications
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.connectedapps}
                          className={
                            pathname === route.connectedapps
                              ? "active"
                              : ""
                          }
                        >
                          Connected Apps
                        </Link>
                      </li>
                    </ul>
                  </li>
                  <li className="submenu">
                    <Link href="#" onClick={toggleWebsiteSettings} className={pathname === route.systemsettings || pathname === route.companysettings || pathname === route.localizationsettings || pathname == route.prefixes || pathname == route.preference || pathname == route.appearance || pathname == route.socialauthendication || pathname == route.languagesettings ? 'active subdrop' : ''}>
                      <i className="ti ti-world fs-18"></i>
                      <span className="fs-14 fw-medium ms-2">Website Settings</span>
                      <span className="menu-arrow" />
                    </Link>
                    <ul
                      style={{
                        display: isWebsiteSettingsOpen ? "block" : "none",
                      }}
                    >
                      <li>
                        <Link
                          href={route.systemsettings}
                          className={
                            pathname === route.systemsettings
                              ? "active"
                              : ""
                          }
                        >
                          System Settings
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.companysettings}
                          className={
                            pathname === route.companysettings
                              ? "active"
                              : ""
                          }
                        >
                          Company Settings
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.localizationsettings}
                          className={
                            pathname === route.localizationsettings
                              ? "active"
                              : ""
                          }
                        >
                          Localization
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.prefixes}
                          className={
                            pathname === route.prefixes
                              ? "active"
                              : ""
                          }
                        >
                          Prefixes
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.preference}
                          className={
                            pathname === route.preference
                              ? "active"
                              : ""
                          }
                        >
                          Preference
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.appearance}
                          className={
                            pathname === route.appearance
                              ? "active"
                              : ""
                          }
                        >
                          Appearance
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.socialauthendication}
                          className={
                            pathname === route.socialauthendication
                              ? "active"
                              : ""
                          }
                        >
                          Social Authentication
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.languagesettings}
                          className={
                            pathname === route.languagesettings
                              ? "active"
                              : ""
                          }
                        >
                          Language
                        </Link>
                      </li>
                    </ul>
                  </li>
                  <li className="submenu">
                    <Link href="#" onClick={toggleAppSettings} className={pathname === route.invoicesettings || pathname === route.invoicetemplate || pathname === route.printersettings || pathname == route.possettings || pathname == route.signatures || pathname == route.customfields ? 'active subdrop' : ''}>
                      <i className="ti ti-device-mobile fs-18"></i>
                      <span className="fs-14 fw-medium ms-2">App Settings</span>
                      <span className="menu-arrow" />
                    </Link>
                    <ul
                      style={{
                        display: isAppSettingsOpen ? "block" : "none",
                      }}
                    >
                      <li>
                        <Link
                          href={route.invoicesettings}
                          className={
                            pathname === route.invoicesettings
                              ? "active"
                              : ""
                          }
                        >
                          Invoice
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.invoicetemplate}
                          className={
                            pathname === route.invoicetemplate
                              ? "active"
                              : ""
                          }
                        >
                          Invoice Templates
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.printersettings}
                          className={
                            pathname === route.printersettings
                              ? "active"
                              : ""
                          }
                        >
                          Printer
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.possettings}
                          className={
                            pathname === route.possettings
                              ? "active"
                              : ""
                          }
                        >
                          POS
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.signatures}
                          className={
                            pathname === route.signatures
                              ? "active"
                              : ""
                          }
                        >
                          Signatures
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.customfields}
                          className={
                            pathname === route.customfields
                              ? "active"
                              : ""
                          }
                        >
                          Custom Fields
                        </Link>
                      </li>
                    </ul>
                  </li>
                  <li className="submenu">
                    <Link href="#" onClick={toggleSystemSettings} className={pathname === route.invoicesettings || pathname === route.invoicetemplate || pathname === route.printersettings || pathname == route.possettings || pathname == route.signatures || pathname == route.customfields || pathname == route.emailsettings || pathname == route.emailtemplate || pathname == route.smssettings || pathname == route.smstemplate ? 'active subdrop' : ''}>
                      <i className="ti ti-device-desktop fs-18"></i>
                      <span className="fs-14 fw-medium ms-2">System Settings</span>
                      <span className="menu-arrow" />
                    </Link>
                    <ul
                      style={{
                        display: isSystemSettingsOpen ? "block" : "none",
                      }}
                    >
                      <li>
                        <Link
                          href="#"
                          className={`submenu-two ${pathname === route.emailsettings || pathname === route.emailtemplate ? "active" : ""}`}
                          onClick={toggleSubmenutwo}
                        >
                          Email
                          <span className="menu-arrow inside-submenu"></span>
                        </Link>
                        <ul style={{ display: isSubmenutwo ? 'block' : 'none' }}>
                          <li>
                            <Link href={route.emailsettings} className={`${pathname === route.emailsettings ? "active" : ""}`}>Email Settings</Link>
                          </li>
                          <li>
                            <Link href={route.emailtemplate} className={`${pathname === route.emailtemplate ? "active" : ""}`}>Email Templates</Link>
                          </li>
                        </ul>

                      </li>
                      <li>
                        <Link
                          href="#"
                          className={`submenu-two ${pathname === route.smssettings || pathname == route.smstemplate ? "active" : ""}`}
                          onClick={toggleSms}
                        >
                          SMS Gateways
                          <span className="menu-arrow inside-submenu"></span>
                        </Link>
                        <ul style={{ display: isSms ? 'block' : 'none' }}>
                          <li>
                            <Link href={route.smssettings} className={`${pathname === route.smssettings ? "active" : ""}`}>SMS Settings</Link>
                          </li>
                          <li>
                            <Link href={route.smstemplate}>SMS Templates</Link>
                          </li>
                        </ul>

                      </li>
                      <li>
                        <Link
                          href={route.otpsettings}
                          className={
                            pathname === route.otpsettings
                              ? "active"
                              : ""
                          }
                        >
                          OTP
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.gdbrsettings}
                          className={
                            pathname === route.gdbrsettings
                              ? "active"
                              : ""
                          }
                        >
                          GDPR Cookies
                        </Link>
                      </li>
                    </ul>
                  </li>
                  <li className="submenu" >
                    <Link
                      href="#"
                      // className={`active ${
                      //   isFinancialSettingsOpen ? "subdrop" : ""
                      // }`}
                      onClick={toggleFinancialSettings} className={pathname === route.paymentgateway || pathname === route.banksettingslist || pathname === route.taxrates || pathname == route.currencysettings ? 'active subdrop' : ''}

                    >
                      <i className="ti ti-settings-dollar fs-18"></i>
                      <span className="fs-14 fw-medium ms-2">Financial Settings</span>
                      <span className="menu-arrow" />
                    </Link>
                    <ul
                      style={{
                        display: isFinancialSettingsOpen ? "block" : "none",
                      }}
                    >
                      <li>
                        <Link
                          href={route.paymentgateway}
                          className={
                            pathname === route.paymentgateway
                              ? "active"
                              : ""
                          }
                        >
                          Payment Gateway
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.banksettingsgrid}
                          className={
                            pathname === route.banksettingsgrid
                              ? "active"
                              : ""
                          }
                        >
                          Bank Accounts
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.taxrates}
                          className={
                            pathname === route.taxrates
                              ? "active"
                              : ""
                          }
                        >
                          Tax Rates
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.currencysettings}
                          className={
                            pathname === route.currencysettings
                              ? "active"
                              : ""
                          }
                        >
                          Currencies
                        </Link>
                      </li>
                    </ul>
                  </li>
                  <li className="submenu">
                    <Link href="#" onClick={toggleOtherSettings} className={pathname === route.storagesettings || pathname === route.banipaddress ? 'active subdrop' : ''}>
                      <i className="ti ti-settings-2 fs-18"></i>
                      <span className="fs-14 fw-medium ms-2">Other Settings</span>
                      <span className="menu-arrow" />
                    </Link>
                    <ul
                      style={{
                        display: isOtherSettingsOpen ? "block" : "none",
                      }}
                    >
                      <li>
                        <Link
                          href={route.storagesettings}
                          className={
                            pathname === route.storagesettings
                              ? "active"
                              : ""
                          }
                        >
                          Storage
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={route.banipaddress}
                          className={
                            pathname === route.banipaddress
                              ? "active"
                              : ""
                          }
                        >
                          Ban IP Address
                        </Link>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </PerfectScrollbar>
      </div>

    </div>
  </div>
  );
};

export default SettingsSideBar;