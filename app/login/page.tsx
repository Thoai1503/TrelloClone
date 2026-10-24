import type { Metadata } from "next";

import { redirectAuthenticatedUser } from "@/utils/redirect-authenticated-user";
import LoginForm from "@/app/features/auth/LoginForm";
import { LoginPage } from "@/app/components/templates";

export const metadata: Metadata = {
  title: "Đăng nhập | Trello",
  description: "Đăng nhập để tiếp tục quản lý công việc cùng Trello.",
};

export default async function LoginRoute() {
  await redirectAuthenticatedUser();

  return (
    <LoginPage>
      <LoginForm />
    </LoginPage>
  );
}
