import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 space-y-6">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold text-foreground">AIReplica Dashboard</h1>
            <p className="text-muted-foreground font-body">
              Manage your AI digital clone and monitor performance metrics
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
