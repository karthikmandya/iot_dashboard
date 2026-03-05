import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Cpu,
  Wifi,
  WifiOff,
  Thermometer,
  Lightbulb,
  Radio,
  Plug,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { devices, Device } from "@/lib/devices";

type Filter = "all" | "online" | "offline";

const iconMap: Record<string, React.ElementType> = {
  "temp-sensor-1": Thermometer,
  "zigbee-bulb-1": Lightbulb,
  "humidity-sensor-1": Activity,
  "motion-sensor-1": Radio,
  "smart-plug-1": Plug,
};

const Dashboard = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const navigate = useNavigate();

  const onlineCount = devices.filter((d) => d.status === "online").length;
  const offlineCount = devices.filter((d) => d.status === "offline").length;

  const filtered =
    filter === "all"
      ? devices
      : devices.filter((d) => d.status === filter);

  const tiles: { label: string; value: number; filterKey: Filter; icon: React.ElementType; color: string }[] = [
    { label: "All Devices", value: devices.length, filterKey: "all", icon: Cpu, color: "text-primary" },
    { label: "Online Now", value: onlineCount, filterKey: "online", icon: Wifi, color: "text-[hsl(var(--success))]" },
    { label: "Inactive", value: offlineCount, filterKey: "offline", icon: WifiOff, color: "text-muted-foreground" },
  ];

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono">IoT Edge Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time device monitoring & control</p>
          </div>
        </div>

        {/* Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tiles.map((t) => (
            <Card
              key={t.filterKey}
              onClick={() => setFilter(t.filterKey)}
              className={`cursor-pointer transition-all hover:border-primary/40 ${
                filter === t.filterKey ? "border-primary ring-1 ring-primary/30" : ""
              }`}
            >
              <CardContent className="flex items-center gap-4 py-5">
                <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center`}>
                  <t.icon className={`h-5 w-5 ${t.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{t.value}</p>
                  <p className="text-xs text-muted-foreground">{t.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Device Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((device) => {
                  const Icon = iconMap[device.id] || Cpu;
                  return (
                    <TableRow
                      key={device.id}
                      className="cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => navigate(`/device/${device.id}`)}
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{device.name}</p>
                            <p className="text-xs text-muted-foreground">{device.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {device.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{device.location}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            device.status === "online"
                              ? "border-[hsl(var(--success))]/40 text-[hsl(var(--success))]"
                              : "border-muted-foreground/40 text-muted-foreground"
                          }
                        >
                          {device.status === "online" ? "● Online" : "○ Offline"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No devices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
