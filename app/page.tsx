import { Suspense } from "react";
import { AppWorkspace } from "@/components/app-workspace";
import { LandingPage } from "@/components/landing/landing-page";

export default function Home() {
  return (
    <>
      <LandingPage />
      <Suspense fallback={null}>
        <AppWorkspace />
      </Suspense>
    </>
  );
}
