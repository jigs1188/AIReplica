import { BarChart3, Bot, Home, MessageSquare, Settings, Users, Zap, Brain, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "#", icon: Home, current: true },
  { name: "Cloning", href: "#", icon: Bot, current: false },
  { name: "History", href: "#", icon: Activity, current: false },
  { name: "Prompt", href: "#", icon: MessageSquare, current: false },
  { name: "Memory", href: "#", icon: Brain, current: false },
  { name: "Settings", href: "#", icon: Settings, current: false },
]

export function DashboardSidebar() {
  return (
    <div className="flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center h-16 px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-sidebar-foreground">AIReplica</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <Button
            key={item.name}
            variant={item.current ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 font-body",
              item.current
                ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Button>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent/10 rounded-lg p-4">
          <h3 className="font-body font-semibold text-sm text-sidebar-foreground mb-2">Upgrade to Pro</h3>
          <p className="text-xs text-sidebar-foreground/70 mb-3">Unlock advanced AI features and unlimited replicas</p>
          <Button size="sm" className="w-full">
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  )
}
