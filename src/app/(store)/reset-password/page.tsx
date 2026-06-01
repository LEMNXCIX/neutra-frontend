import type { Metadata } from "next";
import { ResetPasswordPageClient } from "./reset-password-client";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your account",
};

export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />;
}
