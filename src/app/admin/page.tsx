import LogAnalyticsDashboard from "@/components/admin/LogAnalyticsDashboard";
import { redirect } from 'next/navigation';
import { validateAdminAccess } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const { isValid } = await validateAdminAccess();

    if (!isValid) {
        redirect('/login');
    }

    return (
        <div className="space-y-12 pb-20">
            <div className="border-b-4 border-foreground pb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-6xl font-black uppercase tracking-tighter text-foreground italic leading-none">Control Center</h2>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-4">Global system monitoring and tenant management</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
                <section className="space-y-6">
                    <header className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-foreground opacity-20" />
                        <h3 className="font-black uppercase tracking-[0.4em] text-[10px] text-muted-foreground italic">System Vitals</h3>
                        <div className="h-px flex-1 bg-foreground opacity-20" />
                    </header>
                    <LogAnalyticsDashboard />
                </section>

                <section className="p-8 border-4 border-foreground bg-card rounded-none shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="text-xl font-black uppercase mb-4 italic underline decoration-4 underline-offset-8">Quick Actions</h3>
                    <p className="text-muted-foreground font-bold mb-6">Select a module from the sidebar to manage tenants and global settings.</p>
                </section>
            </div>
        </div>
    );
}

