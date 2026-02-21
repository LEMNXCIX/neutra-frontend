import LogAnalyticsDashboard from "@/components/admin/LogAnalyticsDashboard";
import { redirect } from 'next/navigation';
import { validateAdminAccess } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    try {
        const { isValid } = await validateAdminAccess();

        if (!isValid) {
            redirect('/login');
        }

        return (
            <div className="space-y-12 pb-20">
                <div className="border-b border-border pb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-bold tracking-tight text-foreground leading-none">Control Center</h2>
                        <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] mt-4">Global system monitoring and tenant management</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-12">
                    <section className="space-y-6">
                        <header className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-border" />
                            <h3 className="font-semibold uppercase tracking-[0.3em] text-[10px] text-muted-foreground">System Vitals</h3>
                            <div className="h-px flex-1 bg-border" />
                        </header>
                        <LogAnalyticsDashboard />
                    </section>

                    <section className="p-8 t-card">
                        <h3 className="text-xl font-bold uppercase mb-4 tracking-tight">Quick Actions</h3>
                        <p className="text-muted-foreground font-medium mb-6">Select a module from the sidebar to manage tenants and global settings.</p>
                    </section>
                </div>
            </div>
        );
    } catch (error) {
        // Allow redirects to function properly
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }
        console.error('Admin page error:', error);
        throw error;
    }
}

