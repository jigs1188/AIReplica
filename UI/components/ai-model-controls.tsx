import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Brain, Zap, MessageSquare, Settings } from "lucide-react"

const models = [
  {
    id: 1,
    name: "GPT-4 Turbo",
    type: "Text Generation",
    status: "Active",
    accuracy: 94,
    speed: 85,
    icon: Brain,
  },
  {
    id: 2,
    name: "Whisper v3",
    type: "Speech Recognition",
    status: "Active",
    accuracy: 96,
    speed: 78,
    icon: MessageSquare,
  },
  {
    id: 3,
    name: "Custom Replica",
    type: "Personality Model",
    status: "Training",
    accuracy: 87,
    speed: 92,
    icon: Zap,
  },
]

export function AIModelControls() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">AI Model Controls</CardTitle>
        <CardDescription className="font-body">Configure and monitor your AI models</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {models.map((model) => (
          <div key={model.id} className="space-y-4 p-4 border border-border rounded-lg bg-card/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <model.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-body font-semibold text-card-foreground">{model.name}</h4>
                  <p className="text-xs text-muted-foreground">{model.type}</p>
                </div>
              </div>
              <Badge
                variant={model.status === "Active" ? "default" : "secondary"}
                className={model.status === "Active" ? "bg-primary text-primary-foreground" : ""}
              >
                {model.status}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-body text-card-foreground">Enable Model</span>
                <Switch defaultChecked={model.status === "Active"} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body text-card-foreground">Response Speed</span>
                  <span className="text-xs text-muted-foreground">{model.speed}%</span>
                </div>
                <Slider defaultValue={[model.speed]} max={100} step={1} className="w-full" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body text-card-foreground">Accuracy Threshold</span>
                  <span className="text-xs text-muted-foreground">{model.accuracy}%</span>
                </div>
                <Slider defaultValue={[model.accuracy]} max={100} step={1} className="w-full" />
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
              <Settings className="h-3 w-3" />
              Advanced Settings
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
