import type { Metadata } from "next";
import { ForgotPasswordPageClient } from "./forgot-password-client";

export const metadata: Metadata = {
  title: "Recuperar Contraseña",
  description: "Solicitá un enlace para restablecer tu contraseña",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
