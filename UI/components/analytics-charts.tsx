"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const messageData = [
  { name: "Mon", messages: 120, responses: 115 },
  { name: "Tue", messages: 150, responses: 142 },
  { name: "Wed", messages: 180, responses: 168 },
  { name: "Thu", messages: 165, responses: 158 },
  { name: "Fri", messages: 200, responses: 185 },
  { name: "Sat", messages: 90, responses: 85 },
  { name: "Sun", messages: 75, responses: 70 },
]

const accuracyData = [
  { name: "Week 1", accuracy: 89 },
  { name: "Week 2", accuracy: 91 },
  { name: "Week 3", accuracy: 93 },
  { name: "Week 4", accuracy: 94 },
]

const chartConfig = {
  messages: {
    label: "Messages",
    color: "hsl(var(--chart-1))",
  },
  responses: {
    label: "Responses",
    color: "hsl(var(--chart-2))",
  },
  accuracy: {
    label: "Accuracy %",
    color: "hsl(var(--chart-1))",
  },
}

export function AnalyticsCharts() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Message Activity</CardTitle>
          <CardDescription className="font-body">Daily message processing and response rates</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={messageData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stackId="1"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="responses"
                  stackId="2"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Response Accuracy</CardTitle>
          <CardDescription className="font-body">Weekly accuracy trends for AI responses</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={accuracyData}>
                <XAxis dataKey="name" />
                <YAxis domain={[80, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="accuracy" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
