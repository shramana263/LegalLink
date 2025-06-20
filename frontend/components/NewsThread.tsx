"use client"

import { useState, useEffect } from "react"
import { Calendar, MapPin, Clock, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"

interface Hearing {
  id: string
  date: string
  time: string
  court: string
  status: "Scheduled" | "Completed" | "Postponed"
  description: string
}

interface NewsItem {
  id: string
  title: string
  hearings: Hearing[]
}

export default function NewsThread() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/data/data.json")
        const data = await response.json()
        setNewsItems(data.newsThread)
      } catch (error) {
        console.error("Error fetching news:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNews()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Postponed":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
            <Calendar className="h-5 w-5" />
            <span>Legal News & Updates</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {newsItems.map((item) => (
            <div key={item.id} className="space-y-3">
              <h4 className="font-semibold text-sm leading-tight">{item.title}</h4>

              <div className="space-y-3">
                {item.hearings.map((hearing) => (
                  <div key={hearing.id} className="bg-background rounded-lg p-3 border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={`text-xs ${getStatusColor(hearing.status)}`}>{hearing.status}</Badge>
                      <div className="text-xs text-muted-foreground">{new Date(hearing.date).toLocaleDateString()}</div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-2">{hearing.description}</p>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{hearing.court}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{hearing.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            View All Updates
          </Button>
        </CardContent>
      </Card>

      {/* Additional News Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Trending Legal Topics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h5 className="text-xs font-medium">New Consumer Protection Rules</h5>
            <p className="text-xs text-muted-foreground">Updated guidelines for e-commerce disputes</p>
          </div>
          <div className="space-y-2">
            <h5 className="text-xs font-medium">Digital Evidence in Courts</h5>
            <p className="text-xs text-muted-foreground">Supreme Court ruling on electronic evidence admissibility</p>
          </div>
          <div className="space-y-2">
            <h5 className="text-xs font-medium">Property Registration Changes</h5>
            <p className="text-xs text-muted-foreground">New online registration process launched in 5 states</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
