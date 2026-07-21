"use client"

import Link from "next/link"
import { Key, Shield, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/PageHeader"
import { useAuthStore } from "@/store/auth.store"
import { usePermissions } from "@/hooks/usePermissions"

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const { permissions } = usePermissions()

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="My Profile" />

      {/* User Info */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-brand-50 p-3">
            <User className="h-6 w-6 text-brand-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{user?.name ?? "Unknown User"}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {user?.phone && <p className="text-sm text-muted-foreground">{user.phone}</p>}
            <div className="mt-2">
              <Badge variant="secondary" className="bg-brand-50 text-brand-700 border-0">
                {user?.role ?? "Unknown Role"}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Permissions */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-brand-50 p-3">
            <Shield className="h-6 w-6 text-brand-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Assigned Permissions</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {permissions.length > 0 ? (
                permissions.map((perm: string) => (
                  <Badge key={perm} variant="outline" className="text-xs font-mono">
                    {perm}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No specific permissions assigned</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-brand-50 p-3">
            <Key className="h-6 w-6 text-brand-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Security</h3>
            <p className="text-sm text-muted-foreground mt-1">Manage your account security settings.</p>
            <div className="mt-3">
              <Link href="/settings">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Key className="h-4 w-4" /> Change Password
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
