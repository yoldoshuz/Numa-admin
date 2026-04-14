import type { Metadata } from "next";
import { ProfilePage } from "@/components/pages/shared/ProfilePage";

export const metadata: Metadata = { title: "Профиль" };

export default function Page() {
  return <ProfilePage />;
}
