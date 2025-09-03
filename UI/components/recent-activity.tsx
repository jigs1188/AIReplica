import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Bot, User, Zap } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "message",
    user: "Alice Johnson",
    action: "Sent auto-reply to client email",
    time: "2 minutes ago",
    status: "success",
    icon: MessageSquare,
  },
  {
    id: 2,
    type: "training",
    user: "System",
    action: "Completed model training for Bob Smith",
    time: "15 minutes ago",
    status: "success",
    icon: Bot,
  },
  {
    id: 3,
    type: "user",
    user: "Carol Davis",
    action: "Updated personality preferences",
    time: "1 hour ago",
    status: "info",
    icon: User,
  },
  {
    id: 4,
    type: "automation",
    user: "David Wilson",
    action: "Triggered meeting summary automation",
    time: "2 hours ago",
    status: "success",
    icon: Zap,
  },
  {
    id: 5,
    type: "message",
    user: "Alice Johnson",
    action: "Failed to process voice message",
    time: "3 hours ago",
    status: "error",
    icon: MessageSquare,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "success":
      return "bg-primary text-primary-foreground"
    case "error":
      return "bg-destructive text-destructive-foreground"
    case "info":
      return "bg-secondary text-secondary-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Recent Activity</CardTitle>
        <CardDescription className="font-body">Latest actions and system events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg bg-card/50 border border-border">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <activity.icon className="w-4 h-4 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-body font-medium text-card-foreground truncate">{activity.user}</p>
                  <Badge variant="secondary" className={`text-xs ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{activity.action}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
