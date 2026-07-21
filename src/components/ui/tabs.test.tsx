import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

describe("dashboard segmented tabs", () => {
  it("uses the LNDRY primary styling for the active segmented control", () => {
    render(
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
        </TabsList>
      </Tabs>
    )

    const trigger = screen.getByRole("tab", { name: /team members/i })

    expect(trigger.className).toContain("font-semibold")
    expect(trigger.className).toContain("data-[state=active]:bg-[#6366F1]")
    expect(trigger.className).toContain("data-[state=active]:text-white")
  })
})
