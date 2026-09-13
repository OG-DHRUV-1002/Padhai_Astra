import PageHeader from "@/components/dashboard/page-header";
import TimetableClient from "./timetable-client";

export default function TimetablePage() {
  return (
    <>
      <PageHeader
        title="Arc Table"
        description="Generate an AI-optimized study schedule tailored to your needs."
      />
      <TimetableClient />
    </>
  );
}
