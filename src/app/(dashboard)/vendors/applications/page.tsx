"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, X, Search, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getVendorsList } from "@/services/vendors.service"
import { getApplicationWorkflowState } from "@/lib/application-workflow"
import { useReviewVendorApplication } from "@/hooks/useVendorApplications"

export default function VendorApplicationsPage() {
  const [search, setSearch] = useState("")

  // Same real data source as /vendor-applications (see that page for the
  // full queue-management view with tabs/stats/export) — a large single
  // page, filtered client-side.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendor-applications-list"],
    queryFn: () => getVendorsList({ limit: 1000 }),
    staleTime: 30 * 1000,
  })
  const reviewApplication = useReviewVendorApplication()

  const pendingApplications = useMemo(() => {
    const all = data?.vendors ?? []
    return all.filter((app) => {
      const state = getApplicationWorkflowState(app)
      if (state !== "new" && state !== "in_review") return false
      if (!search) return true
      const query = search.toLowerCase()
      return (
        app.name.toLowerCase().includes(query) ||
        app.owner_name.toLowerCase().includes(query)
      )
    })
  }, [data, search])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Applications"
        subtitle="Review onboarding details and approve new laundry vendor tenants"
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Shop Details</TableHead>
              <TableHead>Owner Details</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Requested Radius</TableHead>
              <TableHead>Submitted Date</TableHead>
              <TableHead className="text-right">Decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground text-sm">
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                  Loading applications…
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-destructive text-sm">
                  Failed to load applications.
                </TableCell>
              </TableRow>
            ) : pendingApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground text-sm">
                  No pending vendor applications found.
                </TableCell>
              </TableRow>
            ) : (
              pendingApplications.map((app) => (
                <TableRow key={app.id} className="hover:bg-muted/10">
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">{app.name}</p>
                      <p className="text-xs text-muted-foreground">{app.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm">{app.owner_name}</p>
                      <p className="text-xs text-muted-foreground">{app.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{app.city}</TableCell>
                  <TableCell className="text-sm">{app.delivery_radius_km} km</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(app.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reviewApplication.isPending}
                        className="h-8 w-8 p-0 text-success hover:bg-success-bg hover:text-success border-success/30"
                        onClick={() =>
                          reviewApplication.mutate({ id: app.id, payload: { status: "APPROVED" } })
                        }
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reviewApplication.isPending}
                        className="h-8 w-8 p-0 text-danger hover:bg-danger-bg hover:text-danger border-danger/30"
                        onClick={() =>
                          reviewApplication.mutate({ id: app.id, payload: { status: "REJECTED" } })
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
