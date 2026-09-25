"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

type AdminStatCardProps = {
  icon: React.ElementType;
  title: string;
  value: string | number;
  color: string;
  iconClassName?: string;
};

export function AdminStatCard({
  icon: Icon,
  title,
  value,
  color,
  iconClassName = "size-6 text-white",
}: AdminStatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className={iconClassName} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
