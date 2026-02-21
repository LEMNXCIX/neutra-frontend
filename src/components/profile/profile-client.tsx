'use client';

import React, { useState, useRef } from "react";
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Camera,
  UserCircle,
  Edit,
  Mail,
  User as UserIcon,
  Shield,
  LogOut
} from "lucide-react";

import { useTenant } from "@/context/tenant-context";
import { Order } from "@/types/order.types";
import { Appointment } from "@/services/booking.service";
import { OrderHistory } from "./order-history";
import { AppointmentHistory } from "./appointment-history";

interface ProfileClientProps {
    initialOrders: Order[] | null;
    initialAppointments: Appointment[] | null;
    isNeutral: boolean;
}

export function ProfileClient({ initialOrders, initialAppointments, isNeutral }: ProfileClientProps) {
  const { moduleType } = useTenant();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const router = useRouter();

  // Profile edit states
  const [editOpen, setEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const openEditProfile = () => {
    setProfileForm({ name: user.name, email: user.email || "" });
    setAvatarPreview(user.avatar || null);
    setAvatarBase64(null);
    setEditOpen(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setAvatarBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      toast.error('Name and Email are required');
      return;
    }

    setIsSaving(true);
    try {
      const body: any = { name: profileForm.name, email: profileForm.email };
      if (avatarBase64) body.profilePic = avatarBase64;

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to update profile');
      
      const data = await res.json();
      if (data.success) {
        updateUser({ ...data.data, avatar: data.data.profilePic });
        toast.success('Profile updated! 🎉');
        setEditOpen(false);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-12">
        {/* Profile Card */}
        <Card className={`overflow-hidden ${isNeutral ? "border-4 border-black shadow-none rounded-none" : "border-none shadow-lg bg-gradient-to-br from-primary/5 to-primary/10"}`}>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg" />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg">
                    <UserCircle className="h-16 w-16 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className={`font-black uppercase tracking-tight ${isNeutral ? "text-4xl" : "text-3xl font-bold"}`}>{user.name}</h2>
                  {user.isAdmin && (
                    <Badge className={isNeutral ? "bg-black text-white rounded-none px-3 font-black text-[10px]" : "bg-purple-500"}>
                      <Shield className="h-3 w-3 mr-1" /> ADMIN
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" /> <span>{user.email}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <Button onClick={openEditProfile} size="lg" className={isNeutral ? "bg-black text-white rounded-none font-black" : ""}>
                  <Edit className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
                <Button variant="outline" size="lg" onClick={async () => { await logout(); router.push("/login"); }} className={isNeutral ? "border-4 border-black font-black rounded-none" : "text-destructive"}>
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content History */}
        {!isNeutral && (
            <>
                {moduleType === 'booking' ? (
                    <AppointmentHistory initialAppointments={initialAppointments || []} />
                ) : (
                    <OrderHistory initialOrders={initialOrders || []} />
                )}
            </>
        )}

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                                <AvatarImage src={avatarPreview || user.avatar} />
                                <AvatarFallback><UserCircle className="h-16 w-16" /></AvatarFallback>
                            </Avatar>
                            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full">
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </div>
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button onClick={saveProfile} disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
