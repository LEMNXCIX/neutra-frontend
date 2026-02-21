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
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";

interface ProfileClientProps {
    initialOrders: Order[] | null;
    initialAppointments: Appointment[] | null;
    isNeutral: boolean;
}

export function ProfileClient({ initialOrders, initialAppointments, isNeutral }: ProfileClientProps) {
  const [isMounted, setIsMounted] = useState(false);
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

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!user || !isMounted) return null;

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
    <div className="space-y-12 animate-slide-up">
        {/* Profile Card */}
        <Card className="t-card border-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
          
          <CardContent className="p-8 sm:p-12">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="relative z-10 w-32 h-32 rounded-full object-cover border border-border shadow-xl" />
                ) : (
                  <div className="relative z-10 w-32 h-32 bg-primary/10 text-primary rounded-full flex items-center justify-center shadow-lg border border-primary/20">
                    <UserCircle className="h-20 w-20 opacity-90" />
                  </div>
                )}
                <button 
                  onClick={openEditProfile}
                  className="absolute bottom-1 right-1 z-20 p-2.5 bg-background border border-border rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all hover:border-primary/50"
                >
                  <Camera className="h-4 w-4 text-foreground" />
                </button>
              </div>

              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-4">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-none">{user.name}</h2>
                    {user.isAdmin && (
                      <Badge className="bg-foreground text-background font-bold text-[10px] tracking-widest px-4 py-1.5 rounded-full shadow-lg border-none">
                        <Shield className="h-3 w-3 mr-2" /> ADMINISTRATOR
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground font-medium text-base">
                    <Mail className="h-4 w-4 opacity-70" /> <span>{user.email}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 pt-4">
                    <div className="px-6 py-3 bg-muted/40 rounded-2xl border border-border/50">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-70">Account Level</p>
                        <p className="text-sm font-bold text-foreground">{user.roleName || 'Member'}</p>
                    </div>
                    <div className="px-6 py-3 bg-muted/40 rounded-2xl border border-border/50">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-70">Registration Date</p>
                        <p className="text-sm font-bold text-foreground">February 2026</p>
                    </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto">
                <Button onClick={openEditProfile} size="lg" className="h-14 px-10 rounded-2xl font-bold bg-foreground text-background hover:bg-foreground/90 shadow-xl shadow-foreground/10 transition-all hover:-translate-y-1">
                  <Edit className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
                <Button variant="outline" size="lg" onClick={async () => { await logout(); router.push("/login"); }} className="h-14 px-10 rounded-2xl font-bold border-2 border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
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
            <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-8 pb-0"><DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle></DialogHeader>
                <div className="space-y-6 p-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <Avatar className="w-24 h-24 border-2 border-border shadow-md group-hover:border-primary/30 transition-all">
                                <AvatarImage src={avatarPreview || user.avatar} />
                                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                                    {user.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold ml-1">Full Name</Label>
                            <Input 
                                value={profileForm.name} 
                                onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                                className="h-12 rounded-xl border-border focus:border-primary transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold ml-1">Email Address</Label>
                            <Input 
                                type="email" 
                                value={profileForm.email} 
                                onChange={e => setProfileForm({...profileForm, email: e.target.value})} 
                                className="h-12 rounded-xl border-border focus:border-primary transition-all"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter className="p-8 pt-0 gap-3">
                    <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl font-semibold h-12 flex-1">Cancel</Button>
                    <Button onClick={saveProfile} disabled={isSaving} className="rounded-xl font-bold h-12 flex-1 shadow-lg shadow-primary/20">{isSaving ? "Saving..." : "Save Changes"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
