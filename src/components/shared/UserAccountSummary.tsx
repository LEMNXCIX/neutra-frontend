"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserAccountSummaryProps = {
  user: { name: string; email?: string; avatar?: string };
};

export function UserAccountSummary({ user }: UserAccountSummaryProps) {
  return (
    <div className="flex items-center gap-4 p-5 bg-card border border-border shadow-sm rounded-xl">
      <Avatar className="size-12 border border-border">
        <AvatarImage src={user.avatar} />
        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
          {user.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="font-bold truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate font-medium">{user.email}</p>
      </div>
    </div>
  );
}
