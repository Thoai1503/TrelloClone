"use client";

import { LandingPage } from "@/app/components/templates";
import { useUser } from "@/app/providers/UserProvider";

export default function LandingPageContent() {
  const user = useUser();
  const workspaceHref = user ? `/u/${encodeURIComponent(user.username)}/board` : "#";

  return <LandingPage workspaceHref={workspaceHref} />;
}
