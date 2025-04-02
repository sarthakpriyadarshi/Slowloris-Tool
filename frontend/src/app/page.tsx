"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { ModeToggle } from "@/components/mode-toggle"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Activity, AlertCircle, Loader2, Play, RefreshCw, Server, Settings, Square, Wifi } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"

interface ProcessData {
  target: string
  port: number
  maxConnections: number
  threadCount: number
  timeout: number
}

export default function NetworkDiagnostics() {
  const [target, setTarget] = useState("")
  const [port, setPort] = useState(80)
  const [maxConnections, setMaxConnections] = useState(500)
  const [threadCount, setThreadCount] = useState(10)
  const [timeout, setTimeout] = useState(4)
  const [status, setStatus] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("config")

  const startProcess = async () => {
    if (!target) {
      toast.error("Missing target", {
        description: "Please enter a target domain or IP address",
      })
      return
    }

    setLoading(true)
    try {
      const processData: ProcessData = {
        target,
        port,
        maxConnections,
        threadCount,
        timeout,
      }

      await axios.post("http://localhost:8000/start/", processData)
      toast.success("Process started", {
        description: `Diagnostic process for ${target} has been initiated`,
      })
      fetchStatus()
      setActiveTab("processes")
    } catch (error) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.detail
          ? error.response.data.detail
          : error instanceof Error
            ? error.message
            : "An unknown error occurred"

      toast.error("Failed to start process", {
        description: errorMessage,
      })
    }
    setLoading(false)
  }

  const stopProcess = async (target: string) => {
    try {
      setStatus(status.map((item) => (item === target ? `${item} (stopping...)` : item)))
      await axios.post("http://localhost:8000/stop/", { target })
      toast.success("Process stopped", {
        description: `Diagnostic process for ${target} has been terminated`,
      })
      fetchStatus()
    } catch (error) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.detail
          ? error.response.data.detail
          : error instanceof Error
            ? error.message
            : "An unknown error occurred"

      toast.error('Faailed to stop process')
    }
  }

  const fetchStatus = async () => {
    setRefreshing(true)
    try {
      const response = await axios.get<{ active_processes: string[] }>("http://localhost:8000/status/")
      setStatus(response.data.active_processes || [])
      console.log(response.data.active_processes || [])
    } catch (error) {
      console.error("Error fetching status:", error instanceof Error ? error.message : "Unknown error")
    }
    setRefreshing(false)
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Wifi className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Network Diagnostics</h1>
              <p className="text-muted-foreground">Advanced network monitoring and diagnostics</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={fetchStatus} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <ModeToggle />
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="config">
              <Settings className="mr-2 h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="processes">
              <Activity className="mr-2 h-4 w-4" />
              Active Processes
              {status.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {status.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Network Diagnostic Configuration</CardTitle>
                <CardDescription>Configure the parameters for your network diagnostic process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="target">Target Domain/IP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="target"
                      placeholder="e.g., example.com or 192.168.1.1"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Server className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Enter a domain name or IP address to diagnose</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <div className="flex gap-2 items-center">
                      <Input id="port" type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} />
                      <Select value={port.toString()} onValueChange={(value) => setPort(Number(value))}>
                        <SelectTrigger className="w-[110px]">
                          <SelectValue placeholder="Common" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="80">HTTP (80)</SelectItem>
                          <SelectItem value="443">HTTPS (443)</SelectItem>
                          <SelectItem value="22">SSH (22)</SelectItem>
                          <SelectItem value="21">FTP (21)</SelectItem>
                          <SelectItem value="3306">MySQL (3306)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                    <div className="flex gap-4 items-center">
                      <Slider
                        id="timeout-slider"
                        min={1}
                        max={10}
                        step={1}
                        value={[timeout]}
                        onValueChange={(value) => setTimeout(value[0])}
                        className="flex-1"
                      />
                      <span className="w-8 text-center">{timeout}s</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxConnections">Max Connections</Label>
                    <Input
                      id="maxConnections"
                      type="number"
                      value={maxConnections}
                      onChange={(e) => setMaxConnections(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threadCount">Thread Count</Label>
                    <Input
                      id="threadCount"
                      type="number"
                      value={threadCount}
                      onChange={(e) => setThreadCount(Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTarget("")
                    setPort(80)
                    setMaxConnections(500)
                    setThreadCount(10)
                    setTimeout(4)
                  }}
                >
                  Reset
                </Button>
                <Button onClick={startProcess} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Diagnostic
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="processes">
            <Card>
              <CardHeader>
                <CardTitle>Active Diagnostic Processes</CardTitle>
                <CardDescription>Monitor and manage your running network diagnostic processes</CardDescription>
              </CardHeader>
              <CardContent>
                {status.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No active processes</h3>
                    <p className="text-muted-foreground mt-2 max-w-md">
                      There are currently no running diagnostic processes. Configure and start a new process from the
                      Configuration tab.
                    </p>
                    <Button variant="outline" className="mt-6" onClick={() => setActiveTab("config")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Go to Configuration
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {status.map((item: string, index: number) => {
                          const isStopping = item.includes("(stopping...)")
                          const target = isStopping ? item.replace(" (stopping...)", "") : item

                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {isStopping ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    >
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Stopping
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    >
                                      <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                                      Active
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{target}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => stopProcess(target)}
                                  disabled={isStopping}
                                >
                                  <Square className="h-3.5 w-3.5 mr-1" />
                                  {isStopping ? "Stopping..." : "Stop"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</div>
                <Button variant="outline" size="sm" onClick={fetchStatus} disabled={refreshing}>
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-3.5 w-3.5" />
                      Refresh
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

