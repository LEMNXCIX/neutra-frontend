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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type Coupon = {
  code: string;
  type: "amount" | "percent";
  value: number;
  used?: boolean;
  expires?: string;
};

export default function CouponsAdminClient() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "amount",
    value: "",
    expires: "",
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/coupons", { credentials: "same-origin" });
      if (!res.ok) {
        toast.error("Failed to load coupons");
        return;
      }
      const data = await res.json();
      setItems(data.coupons || []);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value || 0),
        expires: form.expires || null,
      };
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Failed");
        return;
      }
      toast.success("Created");
      setForm({ code: "", type: "amount", value: "", expires: "" });
      load();
    } catch {
      toast.error("Failed");
    }
  };

  const remove = async (code: string) => {
    if (!confirm("Delete coupon?")) return;
    try {
      const res = await fetch(`/api/admin/coupons/${encodeURIComponent(code)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Failed");
        return;
      }
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Failed");
    }
  };

  const edit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      expires: c.expires || "",
    });
    setOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value || 0),
        expires: form.expires || null,
      };
      const res = await fetch(`/api/admin/coupons/${encodeURIComponent(editing.code)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      setForm({ code: "", type: "amount", value: "", expires: "" });
      load();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-medium mb-4">Coupons</h2>

      {/* === Create Form === */}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap gap-2 p-4">
          <Input
            value={form.code}
            placeholder="Code"
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            className="w-32 sm:w-40"
          />
          <Select
            value={form.type}
            onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
          >
            <SelectTrigger className="w-28 sm:w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="percent">Percent</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={form.value}
            placeholder="Value"
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            className="w-24"
          />
          <Input
            value={form.expires}
            placeholder="YYYY-MM-DD"
            onChange={(e) => setForm((f) => ({ ...f, expires: e.target.value }))}
            className="w-36"
          />
          <Button onClick={create}>Create</Button>
        </CardContent>
      </Card>

      {/* === Table (Desktop) === */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[70vh]">
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Code", "Type", "Value", "Used", "Expires", "Actions"].map((th) => (
                      <TableHead key={th}>
                        <Skeleton className="h-4 w-20" />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
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
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((c) => (
                    <TableRow key={c.code} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{c.code}</TableCell>
                      <TableCell>{c.type}</TableCell>
                      <TableCell>{c.value}</TableCell>
                      <TableCell>
                        <Badge variant={c.used ? "secondary" : "outline"}>
                          {c.used ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.expires || "-"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => edit(c)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(c.code)}>
                          Delete
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
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent className="text-sm flex flex-col gap-1">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2 mt-2 justify-end">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          items.map((c) => (
            <Card key={c.code}>
              <CardHeader className="pb-2 flex flex-row justify-between items-center">
                <CardTitle className="text-base">{c.code}</CardTitle>
                <Badge variant={c.used ? "secondary" : "outline"}>
                  {c.used ? "Used" : "Unused"}
                </Badge>
              </CardHeader>
              <CardContent className="text-sm flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>{c.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Value</span>
                  <span>{c.value}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span>{c.expires || "-"}</span>
                </div>
                <div className="flex gap-2 mt-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => edit(c)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(c.code)}>
                    Delete
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
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>
              Modify coupon details and click save to apply changes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 mt-2">
            <Input
              value={form.code}
              placeholder="Code"
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="w-32 sm:w-40"
            />
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
            >
              <SelectTrigger className="w-28 sm:w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="percent">Percent</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={form.value}
              placeholder="Value"
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              className="w-24"
            />
            <Input
              value={form.expires}
              placeholder="YYYY-MM-DD"
              onChange={(e) => setForm((f) => ({ ...f, expires: e.target.value }))}
              className="w-36"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={saveEdit}>Save</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setEditing(null);
                setForm({ code: "", type: "amount", value: "", expires: "" });
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