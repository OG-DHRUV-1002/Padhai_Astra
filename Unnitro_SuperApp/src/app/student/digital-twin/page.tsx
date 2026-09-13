"use client";

import dynamic from "next/dynamic";
import { Compass } from "lucide-react";

const CampusTourPage = dynamic(() => import("@/components/nexus/campus-tour-page"), {
  loading: () => (
    <div className="flex items-center justify-center h-[60vh] text-gray-400">
      <Compass className="w-5 h-5 animate-pulse mr-2 text-red-500" />Loading 3D Digital Twin...
    </div>
  ),
  ssr: false,
});

export default function DigitalTwinPage() {
  return <CampusTourPage />;
}
