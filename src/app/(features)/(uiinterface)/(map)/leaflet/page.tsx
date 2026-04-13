
"use client";
/* eslint-disable @next/next/no-img-element */

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
const LeafletComponent = dynamic(() => import("./LeafletMap"), { ssr: false });
export default function Leaflet() {
  return (
    <>
          <LeafletComponent />
    </>
  );
}
