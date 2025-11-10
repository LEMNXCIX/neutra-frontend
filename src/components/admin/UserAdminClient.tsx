"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

type User = { id: string; name: string; email: string; isAdmin: boolean };

export default function UserAdminClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", isAdmin: false });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { credentials: "same-origin" });
      if (!res.ok) {
        toast.error("Failed loading users");
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      toast.error("Failed loading users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleAdmin = async (id: string) => {
    try {
      const res = await fetch("/api/admin/users/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Failed");
        return;
      }
      toast.success("Role updated");
      load();
    } catch {
      toast.error("Request failed");
    }
  };

  const edit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, isAdmin: u.isAdmin });
    setOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const res = await fetch(`/api/admin/users/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Failed");
        return;
      }
      toast.success("Saved");
      setEditing(null);
      setOpen(false);
      load();
    } catch {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-medium">Users</h2>
        <div className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${users.length} users`}
        </div>
      </div>

      {/* === Desktop Table === */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[70vh]">
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Name", "Email", "Admin", "Actions"].map((th) => (
                      <TableHead key={th}>
                        <Skeleton className="h-4 w-20" />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/30">
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.isAdmin ? "secondary" : "outline"}>
                          {u.isAdmin ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => edit(u)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleAdmin(u.id)}
                        >
                          {u.isAdmin ? "Revoke" : "Make admin"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* === Mobile Cards === */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2 flex flex-row justify-between items-center">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent className="text-sm flex flex-col gap-1">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2 mt-3 justify-end">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          users.map((u) => (
            <Card key={u.id}>
              <CardHeader className="pb-2 flex flex-row justify-between items-center">
                <CardTitle className="text-base">{u.name}</CardTitle>
                <Badge variant={u.isAdmin ? "secondary" : "outline"}>
                  {u.isAdmin ? "Admin" : "User"}
                </Badge>
              </CardHeader>
              <CardContent className="text-sm flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{u.email}</span>
                </div>
                <div className="flex gap-2 mt-3 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => edit(u)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleAdmin(u.id)}
                  >
                    {u.isAdmin ? "Revoke" : "Make admin"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* === Edit Dialog === */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <Input
              value={form.name}
              placeholder="Name"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              value={form.email}
              placeholder="Email"
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="isAdmin"
                checked={form.isAdmin}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isAdmin: checked }))}
              />
              <label htmlFor="isAdmin" className="text-sm">
                Administrator
              </label>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={saveEdit}>Save</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}