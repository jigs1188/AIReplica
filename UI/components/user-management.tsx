import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Plus, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const users = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    status: "Active",
    replicas: 3,
    lastActive: "2 hours ago",
    avatar: "/alice-avatar.png",
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    status: "Active",
    replicas: 1,
    lastActive: "1 day ago",
    avatar: "/bob-avatar.png",
  },
  {
    id: 3,
    name: "Carol Davis",
    email: "carol@example.com",
    status: "Inactive",
    replicas: 2,
    lastActive: "1 week ago",
    avatar: "/carol-avatar.png",
  },
  {
    id: 4,
    name: "David Wilson",
    email: "david@example.com",
    status: "Active",
    replicas: 4,
    lastActive: "30 minutes ago",
    avatar: "/david-avatar.png",
  },
]

export function UserManagement() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading">User Management</CardTitle>
            <CardDescription className="font-body">Manage user accounts and their AI replicas</CardDescription>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
        <div className="flex items-center gap-4 pt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search users..." className="pl-10" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50"
            >
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-body font-semibold text-card-foreground">{user.name}</h4>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-body font-medium text-card-foreground">{user.replicas} replicas</p>
                  <p className="text-xs text-muted-foreground">Last active {user.lastActive}</p>
                </div>

                <Badge
                  variant={user.status === "Active" ? "default" : "secondary"}
                  className={user.status === "Active" ? "bg-primary text-primary-foreground" : ""}
                >
                  {user.status}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit User</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
