import { backendFetch } from "@/lib/backend-api";
import type { Staff } from "@/services/booking.service";
import AdminStaffPage from "./staff-client";

export const metadata = { title: "Staff Management" };

async function fetchStaff(): Promise<Staff[]> {
	try {
		const result = await backendFetch("/staff?includeInactive=true", {
			cache: "no-store",
		});
		if (!result.success) return [];
		const data = result as any;
		return data.staff || data.data?.staff || data.data || [];
	} catch {
		return [];
	}
}

export default async function Page() {
	const initialStaff = await fetchStaff();
	return <AdminStaffPage initialStaff={initialStaff} />;
}
