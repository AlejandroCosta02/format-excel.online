import { Suspense } from "react";
import { AppWorkspace } from "@/components/app-workspace";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <AppWorkspace />
    </Suspense>
  );
}
