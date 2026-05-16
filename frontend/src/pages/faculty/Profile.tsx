import { useEffect, useState } from "react";

import { userApi } from "@/api/services";
import type { UserProfile } from "@/api/types";
import { AppLayout } from "@/components/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function avatarInitials(name: string | null, email: string): string {
  if (!name) {
    return email.slice(0, 2).toUpperCase();
  }

  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return email.slice(0, 2).toUpperCase();
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default function FacultyProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await userApi.me("/faculty/profile");
        if (!active) return;
        setProfile(response.user);
      } catch (loadError) {
        if (!active) return;
        setError((loadError as Error)?.message || "Failed to load faculty profile.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  return (
    <AppLayout>
      <div className="container py-8">
        <Card className="mx-auto max-w-3xl space-y-6 p-6 shadow-card">
          {loading ? (
            <>
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-56" />
                  <Skeleton className="h-4 w-72" />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-52" />
              </div>
            </>
          ) : error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : profile ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border border-border">
                    <AvatarFallback>{avatarInitials(profile.name, profile.email)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="font-display text-2xl font-bold">{profile.name ?? "Faculty"}</h1>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                </div>
                <Badge className="bg-blue-600 text-white hover:bg-blue-600">Administrator</Badge>
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Role</p>
                  <p className="font-medium">{profile.role}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Department</p>
                  <p className="font-medium">{profile.department ?? "Not set"}</p>
                </div>
              </div>
            </>
          ) : null}
        </Card>
      </div>
    </AppLayout>
  );
}
