import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, MessageSquare, Zap } from "lucide-react"

const stats = [
  {
    title: "Active Replicas",
    value: "12",
    change: "+2.5%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Messages Processed",
    value: "1,847",
    change: "+12.3%",
    changeType: "positive" as const,
    icon: MessageSquare,
  },
  {
    title: "Response Accuracy",
    value: "94.2%",
    change: "+1.2%",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
  {
    title: "Automation Rate",
    value: "87%",
    change: "+5.1%",
    changeType: "positive" as const,
    icon: Zap,
  },
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-body font-medium text-card-foreground">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold text-card-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">{stat.change}</span> from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
