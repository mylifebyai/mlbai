import type { Metadata } from "next";
import AdminUsersClient from "./AdminUsersClient";

export const metadata: Metadata = {
  title: "Admin – Users & Roles",
  description: "Manage user roles for My Life, By AI.",
};

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
