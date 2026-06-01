import type { Metadata } from "next";
import { StoreHomeClient } from "./store-client";

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to our store — shop curated collections and featured products",
};

export default function StoreHomePage() {
  return <StoreHomeClient />;
}
