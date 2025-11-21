"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Camera,
  UserCircle,
  Edit,
  ShoppingBag,
  Package,
  Mail,
  User as UserIcon,
  Shield,
  Calendar,
  DollarSign,
  MapPin,
  Truck,
  Eye,
  Download,
} from "lucide-react";

type OrderItem = { id: string; name: string; qty: number };
type Order = {
  id: string;
  userId: string;
  total: number;
  items: OrderItem[];
  date: string;
  status?: string;
  address?: string;
  tracking?: string;
};

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const updateUser = useAuthStore((state) => state.updateUser);
  const router = useRouter();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Profile edit states
  const [editOpen, setEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      setIsLoadingOrders(true);
      const qp = new URLSearchParams();
      qp.set("userId", user.id);
      qp.set("page", String(page));
      qp.set("pageSize", String(pageSize));
      if (statusFilter) qp.set("status", statusFilter);
      if (dateFrom) qp.set("dateFrom", dateFrom);
      if (dateTo) qp.set("dateTo", dateTo);

      fetch(`/api/orders?${qp.toString()}`)
        .then((r) => r.json())
        .then((d) => {
          setOrders(d.orders || []);
          setTotal(d.total || 0);
        })
        .finally(() => setIsLoadingOrders(false));
    }
  }, [user, loading, router, page, pageSize, statusFilter, dateFrom, dateTo]);

  const openEditProfile = () => {
    if (user) {
      setProfileForm({ name: user.name, email: user.email || "" });
      setAvatarPreview(user.avatar || null);
      setAvatarBase64(null);
      setEditOpen(true);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setAvatarBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!profileForm.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setIsSaving(true);
    try {
      const body: any = {
        name: profileForm.name,
        email: profileForm.email,
      };

      if (avatarBase64) {
        body.avatarBase64 = avatarBase64;
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error || 'Failed to update profile');
        return;
      }

      const data = await res.json();

      if (data.user) {
        updateUser(data.user);
        toast.success('Profile updated successfully! 🎉');
        setEditOpen(false);
        setAvatarPreview(null);
        setAvatarBase64(null);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <Spinner size="lg" />
      </div>
    );

  if (!user) return null;

  const totalSpent = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
  const ordersByStatus = orders?.reduce((acc, o) => {
    const status = o.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account and view your orders</p>
        </div>

        {/* Profile Card */}
        <Card className="border-none shadow-lg overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-shrink-0">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg">
                    <UserCircle className="h-16 w-16 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-bold">{user.name}</h2>
                  {user.isAdmin && (
                    <Badge className="bg-purple-500 hover:bg-purple-600">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="h-4 w-4" />
                  <span>Member ID: {user.id}</span>
                </div>
              </div>

              <Button onClick={openEditProfile} size="lg" className="w-full sm:w-auto">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-3xl font-bold">{orders?.length || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <ShoppingBag className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                  <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-3xl font-bold">{ordersByStatus['processing'] || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Calendar className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Delivered</p>
                  <p className="text-3xl font-bold">{ordersByStatus['delivered'] || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-purple-500/10">
                  <Package className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Section */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              Order History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center p-4 bg-muted/50 rounded-lg">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2 w-full sm:w-auto flex-1">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1"
                />
              </div>

              <Button onClick={() => setPage(1)}>
                Apply Filters
              </Button>
            </div>

            <Separator />

            {/* Orders List */}
            {isLoadingOrders ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24 mt-2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : orders && orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground mb-6">You haven't placed any orders yet</p>
                <Button onClick={() => router.push('/')}>
                  Start Shopping
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {orders?.map((o) => {
                    const statusStyles = {
                      processing: 'bg-yellow-500 hover:bg-yellow-600 text-white',
                      shipped: 'bg-blue-500 hover:bg-blue-600 text-white',
                      delivered: 'bg-green-500 hover:bg-green-600 text-white',
                      cancelled: 'bg-red-500 hover:bg-red-600 text-white',
                    };
                    const statusStyle = statusStyles[o.status as keyof typeof statusStyles] || 'bg-gray-500 text-white';

                    return (
                      <Card key={o.id} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all">
                        <CardHeader className="bg-gradient-to-r from-muted/30 to-background">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <ShoppingBag className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg font-semibold">
                                    Order #{o.id}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>{o.date}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={`${statusStyle} px-3 py-1`}>
                                {o.status || "Pending"}
                              </Badge>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold text-primary">${o.total.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-6 space-y-4">
                          {/* Quick Info */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{o.items.length} {o.items.length === 1 ? 'item' : 'items'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground truncate">{o.address?.split(',')[0] || 'No address'}</span>
                            </div>
                            {o.tracking && (
                              <div className="flex items-center gap-2 text-sm">
                                <Truck className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground font-mono text-xs">{o.tracking.slice(0, 8)}...</span>
                              </div>
                            )}
                          </div>

                          <Separator />

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant={expanded === o.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              {expanded === o.id ? "Hide Details" : "View Details"}
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/orders/${o.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Full Details
                              </a>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/api/orders/${o.id}/receipt`} target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Receipt
                              </a>
                            </Button>
                          </div>

                          {/* Expanded Details */}
                          {expanded === o.id && (
                            <div className="pt-4 space-y-4 border-t-2 border-primary/10">
                              {/* Delivery Info */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Card className="border border-muted/50 shadow-sm">
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      <div className="p-2 rounded-lg bg-blue-500/10">
                                        <MapPin className="h-4 w-4 text-blue-500" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Delivery Address</p>
                                        <p className="text-sm font-medium break-words">{o.address || "—"}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {o.tracking && (
                                  <Card className="border border-muted/50 shadow-sm">
                                    <CardContent className="p-4">
                                      <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-green-500/10">
                                          <Truck className="h-4 w-4 text-green-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-muted-foreground mb-1">Tracking Number</p>
                                          <p className="text-sm font-mono font-medium break-all">{o.tracking}</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>

                              {/* Items List */}
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="p-1.5 rounded-lg bg-orange-500/10">
                                    <Package className="h-4 w-4 text-orange-500" />
                                  </div>
                                  <p className="text-sm font-semibold">Order Items ({o.items.length})</p>
                                </div>
                                <div className="space-y-2">
                                  {o.items.map((it) => (
                                    <div
                                      key={it.id}
                                      className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/40 hover:to-muted/20 transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                          <Package className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="text-sm font-medium">{it.name}</span>
                                      </div>
                                      <Badge variant="secondary" className="font-mono">{it.qty}×</Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <Separator />

                              {/* Total Summary */}
                              <Card className="border-2 border-primary/20 shadow-md bg-gradient-to-br from-primary/5 to-primary/10">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 rounded-lg bg-primary/20">
                                        <DollarSign className="h-5 w-5 text-primary" />
                                      </div>
                                      <span className="text-lg font-semibold">Order Total</span>
                                    </div>
                                    <span className="text-3xl font-bold text-primary">${o.total.toFixed(2)}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {orders?.length} of {total} orders
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="px-4 py-2 text-sm font-medium">{page}</div>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * pageSize >= total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg">
                    <UserCircle className="h-16 w-16 text-white" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-lg"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground text-center">
                Click the camera icon to change avatar<br />
                Max size: 5MB • Formats: JPG, PNG, GIF
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={saveProfile} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Spinner className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
