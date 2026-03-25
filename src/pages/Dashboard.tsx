import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Camera,
  ChevronRight,
  CloudSun,
  Cpu,
  Eye,
  Gauge,
  Lightbulb,
  Map,
  Pencil,
  Plug,
  Plus,
  Radio,
  ShieldCheck,
  Siren,
  Thermometer,
  Trash2,
  Waves,
  Wifi,
  WifiOff,
  Wind,
  Zap,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { devices as initialDevices, type Device, type DeviceType } from "@/lib/devices";

type Filter = "all" | "online" | "offline";
type DeviceAccent = "sensor" | "power" | "security" | "network";

const typeIconMap: Record<DeviceType, React.ElementType> = {
  sensor: Thermometer,
  switch: Plug,
  bulb: Lightbulb,
  camera: Camera,
};

const iconMap: Record<string, React.ElementType> = {
  "temp-sensor-1": Thermometer,
  "smart-bulb-1": Lightbulb,
  "humidity-sensor-1": Waves,
  "motion-sensor-1": Radio,
  "smart-plug-1": Plug,
  "modbus-sensor-1": Cpu,
  "security-cam-1": Camera,
};

const sectionLinks = [
  { label: "Operations", value: "all", icon: Gauge },
  { label: "Online", value: "online", icon: Wifi },
  { label: "Needs Attention", value: "offline", icon: Siren },
] as const;

const insights = [
  "Zone A thermal readings are steady and within tolerance.",
  "Perimeter camera is holding focus with strong signal integrity.",
  "Power lane remains stable, with the bulb and plug responding inside normal latency.",
  "Modbus telemetry is flowing cleanly across the field bus with low noise.",
];

const sparklineMap: Record<string, number[]> = {
  "temp-sensor-1": [42, 50, 61, 57, 68, 74, 64, 72],
  "humidity-sensor-1": [28, 34, 31, 39, 44, 48, 42, 51],
  "modbus-sensor-1": [22, 46, 33, 55, 48, 62, 58, 70],
};

const weatherStrip = [
  { label: "Ambient", value: "31 C", icon: CloudSun },
  { label: "Airflow", value: "4.8 m/s", icon: Wind },
  { label: "Network", value: "Stable", icon: Wifi },
];

const topologyNodes = [
  { label: "Zone A", accent: "sensor", style: { top: "14%", left: "10%" } },
  { label: "Zone B", accent: "power", style: { top: "14%", left: "48%" } },
  { label: "Entrance", accent: "security", style: { top: "0%", right: "0%" } },
  { label: "Rear Zone", accent: "network", style: { bottom: "18%", right: "38%" } },
] as const;

const getDeviceAccent = (device: Device): DeviceAccent => {
  if (device.type === "camera" || device.id.includes("motion")) return "security";
  if (device.id.includes("modbus")) return "network";
  if (device.type === "switch" || device.type === "bulb") return "power";
  return "sensor";
};

const getTelemetryLabel = (device: Device) => {
  if (device.id === "temp-sensor-1") return "23.8 C";
  if (device.id === "humidity-sensor-1") return "55 RH";
  if (device.id === "modbus-sensor-1") return "229 V / 6.4 A";
  if (device.type === "camera") return "Stream healthy";
  if (device.type === "bulb") return "720 lm";
  if (device.type === "switch") return "Standby";
  return "Nominal";
};

const getAttentionLabel = (device: Device) => {
  if (device.status === "offline") return "Needs attention";
  if (device.type === "camera") return "Frame sync stable";
  if (device.id === "modbus-sensor-1") return "Bus active";
  return "Nominal";
};

const MiniSparkline = ({ values }: { values: number[] }) => (
  <div className="mini-sparkline mini-sparkline-live" aria-hidden="true">
    {values.map((value, index) => (
      <span
        key={`${index}-${value}`}
        style={{ height: `${Math.max(6, value)}%`, ["--bar-index" as string]: index }}
      />
    ))}
  </div>
);

const renderDeviceAvatar = (device: Device, Icon: React.ElementType) => {
  if (device.id === "temp-sensor-1") {
    return (
      <div className="device-avatar-shell thermo-shell">
        <div className="thermo-column">
          <div className="thermo-fill" />
        </div>
        <div className="thermo-bulb" />
        <Thermometer className="relative z-10 h-5 w-5 text-primary" />
      </div>
    );
  }

  if (device.id === "smart-bulb-1") {
    return (
      <div className="device-avatar-shell bulb-pulse-loop">
        <div className="bulb-pulse-glow" />
        <Lightbulb className="relative z-10 h-5 w-5 text-primary" />
      </div>
    );
  }

  if (device.id === "humidity-sensor-1") {
    return (
      <div className="device-avatar-shell spark-track-shell">
        <Waves className="relative z-10 h-5 w-5 text-primary" />
        <div className="spark-travel" />
      </div>
    );
  }

  if (device.id === "motion-sensor-1") {
    return (
      <div className="device-avatar-shell">
        <Radio className="motion-vibrate h-5 w-5 text-primary" />
      </div>
    );
  }

  if (device.id === "smart-plug-1") {
    return (
      <div className="device-avatar-shell plug-shell">
        <div className="plug-current-ring" />
        <Plug className="relative z-10 h-5 w-5 text-primary" />
      </div>
    );
  }

  if (device.id === "security-cam-1") {
    return (
      <div className="device-avatar-shell camera-shell">
        <div className="camera-scan-beam" />
        <Camera className="relative z-10 h-5 w-5 text-primary" />
      </div>
    );
  }

  if (device.id === "modbus-sensor-1") {
    return (
      <div className="device-avatar-shell modbus-shell">
        <div className="modbus-bars">
          <span />
          <span />
          <span />
        </div>
        <Cpu className="relative z-10 h-5 w-5 text-primary" />
      </div>
    );
  }

  return (
    <div className="device-avatar-shell">
      <Icon className="h-5 w-5 text-primary" />
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [activeInsight, setActiveInsight] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "sensor" as DeviceType,
    status: "online" as Device["status"],
    location: "",
    description: "",
  });

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const rotation = window.setInterval(() => {
      setActiveInsight((value) => (value + 1) % insights.length);
    }, 4200);
    return () => window.clearInterval(rotation);
  }, []);

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesFilter = filter === "all" ? true : device.status === filter;
      const query = search.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        device.name.toLowerCase().includes(query) ||
        device.location.toLowerCase().includes(query) ||
        device.description.toLowerCase().includes(query);

      return matchesFilter && matchesQuery;
    });
  }, [devices, filter, search]);

  const onlineCount = devices.filter((device) => device.status === "online").length;
  const offlineCount = devices.length - onlineCount;
  const signalStrength = 92;

  const resetForm = () => {
    setFormData({
      name: "",
      type: "sensor",
      status: "online",
      location: "",
      description: "",
    });
    setEditingDeviceId(null);
  };

  const openCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (device: Device) => {
    setEditingDeviceId(device.id);
    setFormData({
      name: device.name,
      type: device.type,
      status: device.status,
      location: device.location,
      description: device.description,
    });
    setIsDialogOpen(true);
  };

  const saveDevice = () => {
    if (!formData.name.trim() || !formData.location.trim()) {
      return;
    }

    if (editingDeviceId) {
      setDevices((current) =>
        current.map((device) =>
          device.id === editingDeviceId
            ? {
                ...device,
                ...formData,
              }
            : device,
        ),
      );
    } else {
      const nextId = `${formData.type}-${Date.now()}`;
      setDevices((current) => [
        ...current,
        {
          id: nextId,
          ...formData,
          apiPath: "",
        },
      ]);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const deleteDevice = (deviceId: string) => {
    setDevices((current) => current.filter((device) => device.id !== deviceId));
  };

  return (
    <div className="min-h-screen px-4 py-5 md:px-6 xl:px-8">
      <div className="mx-auto grid max-w-[1680px] gap-5 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside
          className="stagger-fade xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]"
          style={{ ["--stagger-delay" as string]: "40ms" }}
        >
          <Card className="panel-shell glass-sheen grid-noise h-full rounded-[28px] border-white/10">
            <CardContent className="flex h-full flex-col gap-6 p-5">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-primary/80">IoT Dashboard</p>
                <h1 className="mt-2 text-2xl font-semibold text-foreground">Snug Hub</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Workspace supervision, control and monitoring
                </p>
              </div>

              <div className="space-y-2">
                {sectionLinks.map(({ label, value, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                      filter === value
                        ? "border-primary/35 bg-primary/12 text-foreground"
                        : "border-white/8 bg-white/[0.02] text-muted-foreground hover:border-white/15 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{label}</span>
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </div>

              <div className="grid gap-3">
                <div className="type-panel type-sensor rounded-2xl border bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <span className="type-chip rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">
                      Sensors
                    </span>
                    <Thermometer className="h-4 w-4 text-[hsl(var(--type-accent))]" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Environmental lanes balanced across Zone A.</p>
                </div>

                <div className="type-panel type-security rounded-2xl border bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <span className="type-chip rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">
                      Security
                    </span>
                    <ShieldCheck className="h-4 w-4 text-[hsl(var(--type-accent))]" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Perimeter watch is active with low incident volume.</p>
                </div>
              </div>

              <div className="mt-auto rounded-[22px] border border-amber-300/15 bg-amber-300/8 p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Attention Queue</p>
                    <p className="text-xs text-muted-foreground">{offlineCount} devices require operator review.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0 space-y-5">
          <section className="stagger-fade" style={{ ["--stagger-delay" as string]: "120ms" }}>
            <Card className="panel-shell glass-sheen overflow-hidden rounded-[30px] border-white/10">
              <CardContent className="relative overflow-hidden p-0">
                <div className="absolute inset-0 panel-highlight opacity-80" />
                <div className="relative grid gap-5 p-6 lg:grid-cols-[1.5fr_1fr]">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className="border-primary/30 bg-primary/12 text-primary">IoT Dashboard</Badge>
                    </div>

                    <div>
                      <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                        Controlling Devices, Real time monitoring.
                      </h2>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {weatherStrip.map(({ label, value, icon: Icon }, index) => (
                        <div
                          key={label}
                          className="stagger-fade rounded-2xl border border-white/10 bg-black/20 p-4"
                          style={{ ["--stagger-delay" as string]: `${160 + index * 80}ms` }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <p className="mt-3 text-xl font-semibold text-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Local Time</p>
                      <p className="mt-3 font-mono text-4xl font-semibold text-foreground">
                        {currentTime.toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {currentTime.toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-cyan-300/15 bg-cyan-300/8 p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">Insights</p>
                        <Eye className="h-4 w-4 text-cyan-200" />
                      </div>
                      <p className="mt-3 min-h-[72px] text-sm leading-6 text-cyan-50/90">
                        {insights[activeInsight]}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Active Devices", value: `${onlineCount}/${devices.length}`, note: "currently reporting", icon: Activity },
              { label: "Attention Needed", value: `${offlineCount}`, note: "offline or stale", icon: AlertTriangle },
              { label: "Field Signal", value: `${signalStrength}%`, note: "camera and bus integrity", icon: Zap },
            ].map(({ label, value, note, icon: Icon }, index) => (
              <Card
                key={label}
                className="panel-shell glass-sheen metric-glow stagger-fade rounded-[26px] border-white/10"
                style={{ ["--stagger-delay" as string]: `${220 + index * 90}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
                      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{note}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="stagger-fade" style={{ ["--stagger-delay" as string]: "380ms" }}>
            <Card className="panel-shell rounded-[30px] border-white/10">
              <CardContent className="space-y-5 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Registry</p>
                    <h3 className="mt-1 text-2xl font-semibold text-foreground">Devices and sensors</h3>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by name, zone, or description"
                      className="h-11 min-w-[260px] rounded-2xl border-white/10 bg-white/[0.03]"
                    />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={openCreate} className="h-11 rounded-2xl">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Device
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-white/10 bg-[hsl(var(--card))] sm:rounded-[24px]">
                        <DialogHeader>
                          <DialogTitle>{editingDeviceId ? "Edit device" : "Add device"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="device-name">Name</Label>
                            <Input
                              id="device-name"
                              value={formData.name}
                              onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="device-location">Location</Label>
                            <Input
                              id="device-location"
                              value={formData.location}
                              onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select
                              value={formData.type}
                              onValueChange={(value: DeviceType) =>
                                setFormData((current) => ({ ...current, type: value }))
                              }
                            >
                              <SelectTrigger className="rounded-2xl border-white/10 bg-white/[0.03]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sensor">Sensor</SelectItem>
                                <SelectItem value="switch">Switch</SelectItem>
                                <SelectItem value="bulb">Bulb</SelectItem>
                                <SelectItem value="camera">Camera</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(value: Device["status"]) =>
                                setFormData((current) => ({ ...current, status: value }))
                              }
                            >
                              <SelectTrigger className="rounded-2xl border-white/10 bg-white/[0.03]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="online">Online</SelectItem>
                                <SelectItem value="offline">Offline</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="device-description">Description</Label>
                            <Input
                              id="device-description"
                              value={formData.description}
                              onChange={(event) =>
                                setFormData((current) => ({ ...current, description: event.target.value }))
                              }
                            />
                          </div>
                          <Button onClick={saveDevice} className="rounded-2xl">
                            {editingDeviceId ? "Save changes" : "Create device"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[26px] border border-white/10 bg-black/10">
                  <Table>
                    <TableHeader className="bg-white/[0.04]">
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead>Device</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Telemetry</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDevices.length === 0 ? (
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableCell colSpan={6} className="p-10">
                            <div className="text-center">
                              <div className="offline-illustration" />
                              <Badge className="border-amber-300/25 bg-amber-300/10 text-amber-100">
                                Needs attention
                              </Badge>
                              <p className="mt-4 text-lg font-medium text-foreground">No devices match this view</p>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Try another status filter or adjust the search term to bring systems back into focus.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDevices.map((device, index) => {
                          const Icon = iconMap[device.id] || typeIconMap[device.type] || Activity;
                          const accent = getDeviceAccent(device);
                          const sparkline = sparklineMap[device.id];

                          return (
                            <TableRow
                              key={device.id}
                              className="stagger-fade border-white/10 hover:bg-white/[0.04]"
                              style={{ ["--stagger-delay" as string]: `${460 + index * 70}ms` }}
                            >
                              <TableCell>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/device/${device.id}`)}
                                  className="flex items-center gap-3 text-left"
                                >
                                  {renderDeviceAvatar(device, Icon)}
                                  <div>
                                    <p className="font-medium text-foreground">{device.name}</p>
                                    <p className="text-xs text-muted-foreground">{device.description}</p>
                                  </div>
                                </button>
                              </TableCell>
                              <TableCell>
                                <div className={`type-${accent}`}>
                                  <span className="type-chip rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">
                                    {accent}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className={`type-${accent} flex items-center gap-4`}>
                                  {sparkline ? (
                                    <MiniSparkline values={sparkline} />
                                  ) : (
                                    <div className="mini-sparkline opacity-25">
                                      <span style={{ height: "40%" }} />
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{getTelemetryLabel(device)}</p>
                                    <p className="text-xs text-muted-foreground">{getAttentionLabel(device)}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    device.status === "online"
                                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                                      : "border-amber-300/25 bg-amber-300/10 text-amber-100"
                                  }
                                >
                                  {device.status === "online" ? "Online" : "Offline"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{device.location}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => openEdit(device)} className="rounded-xl">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteDevice(device.id)}
                                    className="rounded-xl text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
        <aside className="space-y-5">
          <Card
            className="panel-shell glass-sheen stagger-fade rounded-[28px] border-white/10"
            style={{ ["--stagger-delay" as string]: "180ms" }}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Camera Atmosphere</p>
                  <h3 className="mt-1 text-xl font-semibold text-foreground">Perimeter visual node</h3>
                </div>
                <Camera className="h-5 w-5 text-primary" />
              </div>

              <div className="relative mt-5 aspect-video overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(92,225,255,0.12),transparent_35%),linear-gradient(180deg,rgba(8,14,28,0.95),rgba(14,20,36,0.92))]">
                <div className="camera-atmosphere" />
                <div className="camera-scan-overlay" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="device-avatar-shell camera-shell h-16 w-16 rounded-2xl">
                    <div className="camera-scan-beam" />
                    <Camera className="relative z-10 h-7 w-7 text-primary" />
                  </div>
                </div>
                <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-cyan-100">
                  Signal {signalStrength}%
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-2xl border border-white/10 bg-black/45 px-3 py-2 text-xs text-muted-foreground">
                  <span>Last frame received 02s ago</span>
                  <span className="flex items-center gap-2 text-emerald-200">
                    <span className="status-dot text-emerald-300" />
                    Live
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="panel-shell stagger-fade rounded-[28px] border-white/10"
            style={{ ["--stagger-delay" as string]: "260ms" }}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Zone Map</p>
                  <h3 className="mt-1 text-xl font-semibold text-foreground">Topology overview</h3>
                </div>
                <Map className="h-5 w-5 text-primary" />
              </div>

              <div className="topology-grid type-network mt-5 border border-white/10">
                {topologyNodes.map((node) => (
                  <div key={node.label} className={`topology-node type-${node.accent}`} style={node.style}>
                    {node.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card
            className="panel-shell stagger-fade rounded-[28px] border-white/10"
            style={{ ["--stagger-delay" as string]: "340ms" }}
          >
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Operational Feed</p>
                  <h3 className="mt-1 text-xl font-semibold text-foreground">Live context</h3>
                </div>
                <Eye className="h-5 w-5 text-primary" />
              </div>

              {[
                { label: "Sensor mesh", note: "Zone A reporting every 5s", accent: "sensor", icon: Activity },
                { label: "Power lane", note: "Bulb response latency 160 ms", accent: "power", icon: Lightbulb },
                { label: "Security ring", note: "Camera sweep synchronized", accent: "security", icon: ShieldCheck },
                { label: "Field bus", note: "Modbus frame checksum stable", accent: "network", icon: Cpu },
              ].map(({ label, note, accent, icon: Icon }) => (
                <div key={label} className={`type-${accent} type-panel rounded-2xl border bg-white/[0.03] p-4`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <Icon className="h-4 w-4 text-[hsl(var(--type-accent))]" />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
                </div>
              ))}

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Offline systems</p>
                  <WifiOff className="h-4 w-4 text-amber-200" />
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Motion detector, humidity sensor, and smart plug are dimmed until telemetry resumes.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
