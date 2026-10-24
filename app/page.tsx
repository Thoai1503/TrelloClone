import { LandingPage } from "./components/templates";
import { redirectAuthenticatedUser } from "@/utils/redirect-authenticated-user";

export default async function Home() {
  await redirectAuthenticatedUser();

  return <LandingPage />;
}
