import type { Metadata } from "next";
import { LoginPage } from "@/components/pages/auth/LoginPage";

export const metadata: Metadata = {
  title: "Вход",
  description: "Авторизация администратора Numa",
};

export default function Page() {
  return <LoginPage />;
}
