"use client";

import React, { useReducer, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import { useAuthStore } from "@/store/auth-store";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Camera,
  UserCircle,
  Edit,
  Mail,
  User as UserIcon,
  Shield,
  LogOut,
} from "lucide-react";

import { useTenant } from "@/context/tenant-context";
import { Order } from "@/types/order.types";
import { Appointment } from "@/services/booking.service";
import { OrderHistory } from "./order-history";
import { AppointmentHistory } from "./appointment-history";
import { cn } from "@/lib/utils";

type ProfileEditState = {
  editOpen: boolean;
  isSaving: boolean;
  profileForm: { name: string; email: string };
  avatarPreview: string | null;
};

type ProfileEditAction =
  | { type: "SET_EDIT_OPEN"; payload: boolean }
  | { type: "SET_IS_SAVING"; payload: boolean }
  | { type: "SET_PROFILE_FORM"; payload: ProfileEditState["profileForm"] }
  | { type: "SET_AVATAR_PREVIEW"; payload: string | null };

function profileEditReducer(state: ProfileEditState, action: ProfileEditAction): ProfileEditState {
  switch (action.type) {
    case "SET_EDIT_OPEN":
      return { ...state, editOpen: action.payload };
    case "SET_IS_SAVING":
      return { ...state, isSaving: action.payload };
    case "SET_PROFILE_FORM":
      return { ...state, profileForm: action.payload };
    case "SET_AVATAR_PREVIEW":
      return { ...state, avatarPreview: action.payload };
    default:
      return state;
  }
}

interface ProfileClientProps {
  initialOrders: Order[] | null;
  initialAppointments: Appointment[] | null;
  isNeutral: boolean;
}

const emptySubscribe = () => () => {};

export function ProfileClient({
  initialOrders,
  initialAppointments,
  isNeutral,
}: ProfileClientProps) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const { moduleType } = useTenant();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const router = useRouter();

  const [editState, dispatch] = useReducer(profileEditReducer, {
    editOpen: false,
    isSaving: false,
    profileForm: { name: "", email: "" },
    avatarPreview: null,
  });
  const avatarBase64Ref = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user || !isMounted) return null;

  const openEditProfile = () => {
    dispatch({ type: "SET_PROFILE_FORM", payload: { name: user.name, email: user.email || "" } });
    dispatch({ type: "SET_AVATAR_PREVIEW", payload: user.avatar || null });
    avatarBase64Ref.current = null;
    dispatch({ type: "SET_EDIT_OPEN", payload: true });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      dispatch({ type: "SET_AVATAR_PREVIEW", payload: result });
      avatarBase64Ref.current = result;
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!editState.profileForm.name.trim() || !editState.profileForm.email.trim()) {
      toast.error("Name and Email are required");
      return;
    }

    dispatch({ type: "SET_IS_SAVING", payload: true });
    try {
      const body: any = {
        name: editState.profileForm.name,
        email: editState.profileForm.email,
      };
      if (avatarBase64Ref.current)
        body.profilePic = avatarBase64Ref.current;

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const data = await res.json();
      if (data.success) {
        updateUser({ ...data.data, avatar: data.data.profilePic });
        toast.success("Profile updated! 🎉");
        dispatch({ type: "SET_EDIT_OPEN", payload: false });
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      dispatch({ type: "SET_IS_SAVING", payload: false });
    }
  };

  return (
    <div className="space-y-12 animate-slide-up" suppressHydrationWarning>
      {/* Profile Card */}
      <Card className="t-card border-none shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />

        <CardContent className="p-8 sm:p-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={128}
                  height={128}
                  className="relative z-10 size-32 rounded-full object-cover border border-border shadow-xl"
                />
              ) : (
                <div className="relative z-10 size-32 bg-primary/10 text-primary rounded-full flex items-center justify-center shadow-lg border border-primary/20">
                  <UserCircle className="size-20 opacity-90" />
                </div>
              )}
              <button
                type="button"
                onClick={openEditProfile}
                className="absolute bottom-1 right-1 z-20 p-2.5 bg-background border border-border rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all hover:border-primary/50"
              >
                <Camera className="size-4 text-foreground" />
              </button>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-4">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-none">
                    {user.name}
                  </h2>
                  {user.isAdmin && (
                    <Badge className="bg-foreground text-background font-bold text-[10px] tracking-widest px-4 py-1.5 rounded-full shadow-lg border-none">
                      <Shield className="size-3 mr-2" />{" "}
                      ADMINISTRATOR
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground font-medium text-base">
                  <Mail className="size-4 opacity-70" />{" "}
                  <span>{user.email}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <div className="px-6 py-3 bg-muted/40 rounded-2xl border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-70">
                    Account Level
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {user.roleName || "Member"}
                  </p>
                </div>
                <div className="px-6 py-3 bg-muted/40 rounded-2xl border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-70">
                    Registration Date
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    February 2026
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto">
              <Button
                onClick={openEditProfile}
                size="lg"
                className="h-14 px-10 rounded-2xl font-bold bg-foreground text-background hover:bg-foreground/90 shadow-xl shadow-foreground/10 transition-all hover:-translate-y-1"
              >
                <Edit className="size-4 mr-2" /> Edit Profile
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
                className="h-14 px-10 rounded-2xl font-bold border-2 border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all"
              >
                <LogOut className="size-4 mr-2" /> Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content History */}
      {!isNeutral && (
        <>
          {moduleType === "booking" ? (
            <AppointmentHistory
              initialAppointments={initialAppointments || []}
            />
          ) : (
            <OrderHistory initialOrders={initialOrders || []} />
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={editState.editOpen} onOpenChange={(open) => dispatch({ type: "SET_EDIT_OPEN", payload: open })}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-xl font-bold">
              Edit Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="size-24 border-2 border-border shadow-md group-hover:border-primary/30 transition-all">
                  <AvatarImage
                    src={editState.avatarPreview || user.avatar}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                >
                  <Camera className="size-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                aria-label="Upload avatar image"
                className="hidden"
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold ml-1">
                  Full Name
                </Label>
                <Input
                  value={editState.profileForm.name}
                  onChange={(e) =>
                    dispatch({ type: "SET_PROFILE_FORM", payload: {
                      ...editState.profileForm,
                      name: e.target.value,
                    }})
                  }
                  className="h-12 rounded-xl border-border focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold ml-1">
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={editState.profileForm.email}
                  onChange={(e) =>
                    dispatch({ type: "SET_PROFILE_FORM", payload: {
                      ...editState.profileForm,
                      email: e.target.value,
                    }})
                  }
                  className="h-12 rounded-xl border-border focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0 gap-3">
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "SET_EDIT_OPEN", payload: false })}
              className="rounded-xl font-semibold h-12 flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={saveProfile}
              disabled={editState.isSaving}
              className="rounded-xl font-bold h-12 flex-1 shadow-lg shadow-primary/20"
            >
              {editState.isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
