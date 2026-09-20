"use client"

import { useState } from "react"
import { CalendarClock, FlaskConical, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CampaignsTab } from "@/components/notifications/CampaignsTab"
import { SendNotificationDialog, type SendMode } from "@/components/notifications/SendNotificationDialog"
import { SendTestDialog } from "@/components/notifications/SendTestDialog"
import { TemplatesTab } from "@/components/notifications/TemplatesTab"
import type { DeepLink, NotificationCampaign, NotificationTemplate } from "@/types/notification.types"

/** Notification Center: compose → pick audience → Send now / Schedule → track
 * delivery and opens. Templates are optional presets. */
export default function NotificationCenterPage() {
  const [tab, setTab] = useState("campaigns")

  const [composeOpen, setComposeOpen] = useState(false)
  const [composeMode, setComposeMode] = useState<SendMode>("now")
  const [composeTemplate, setComposeTemplate] = useState<NotificationTemplate | null>(null)
  const [composeDraft, setComposeDraft] = useState<NotificationCampaign | null>(null)

  const [testOpen, setTestOpen] = useState(false)
  const [testDefaults, setTestDefaults] = useState<{ title?: string; body?: string; image_url?: string; link?: DeepLink | null } | undefined>()

  function openCompose(mode: SendMode, opts?: { template?: NotificationTemplate; draft?: NotificationCampaign }) {
    setComposeMode(mode)
    setComposeTemplate(opts?.template ?? null)
    setComposeDraft(opts?.draft ?? null)
    setComposeOpen(true)
  }

  function openTest(t?: NotificationTemplate) {
    setTestDefaults(t ? {
      title: t.title, body: t.body, image_url: t.image_url ?? undefined,
      link: t.deep_link_type ? { type: t.deep_link_type, params: t.deep_link_params ?? {} } : null,
    } : undefined)
    setTestOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#080f14]">Notifications</h1>
          <p className="text-[13px] text-[#64748b]">Send push notifications to customers, vendors and captains — now or on a schedule.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="h-10 rounded-full border-[#6366F1] px-5 text-[13px] font-bold text-[#6366F1] hover:bg-[#EEF2FF]" onClick={() => openTest()}>
            <FlaskConical className="mr-2 h-4 w-4" /> Send test
          </Button>
          <Button variant="outline" className="h-10 rounded-full border-[#6366F1] px-5 text-[13px] font-bold text-[#6366F1] hover:bg-[#EEF2FF]" onClick={() => openCompose("schedule")}>
            <CalendarClock className="mr-2 h-4 w-4" /> Schedule
          </Button>
          <Button className="h-10 rounded-full bg-[#6366F1] px-5 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(99,102,241,0.25)] hover:bg-[#4F46E5]" onClick={() => openCompose("now")}>
            <Send className="mr-2 h-4 w-4" /> Send now
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns &amp; history</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="campaigns" className="mt-4">
          <CampaignsTab onEditDraft={(draft) => openCompose("now", { draft })} />
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <TemplatesTab
            onUse={(template) => openCompose("now", { template })}
            onTest={(t) => openTest(t)}
          />
        </TabsContent>
      </Tabs>

      <SendNotificationDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        initialMode={composeMode}
        template={composeTemplate}
        draft={composeDraft}
      />
      <SendTestDialog open={testOpen} onOpenChange={setTestOpen} defaults={testDefaults} />
    </div>
  )
}
