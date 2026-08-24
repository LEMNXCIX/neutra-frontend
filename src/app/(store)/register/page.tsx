import type { Metadata } from "next";
import { RegisterPageClient } from "./register-client";

export const metadata: Metadata = {
  title: "Registrarse",
  description: "Crear una nueva cuenta",
};

export default function RegisterPage() {
  return <RegisterPageClient />;
}
