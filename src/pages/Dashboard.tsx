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
  Plus,
  Trash2,
  Pencil,
  Camera,
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
import { devices as initialDevices, Device, DeviceOperation, DeviceType } from "@/lib/devices";

type Filter = "all" | "online" | "offline";

const typeIconMap: Record<DeviceType, React.ElementType> = {
  sensor: Thermometer,
  switch: Plug,
  bulb: Lightbulb,
  camera: Camera,
};

const iconMap: Record<string, React.ElementType> = {
  "temp-sensor-1": Thermometer,
  "zigbee-bulb-1": Lightbulb,
  "humidity-sensor-1": Activity,
  "motion-sensor-1": Radio,
  "smart-plug-1": Plug,
};

const Dashboard = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const [deviceList, setDeviceList] = useState<Device[]>(initialDevices);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const navigate = useNavigate();

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<DeviceType>("sensor");
  const [formLocation, setFormLocation] = useState("");
  const [formSensorUrl, setFormSensorUrl] = useState("");
  const [formOperations, setFormOperations] = useState<DeviceOperation[]>([]);
  const [opName, setOpName] = useState("");
  const [opUrl, setOpUrl] = useState("");
  const [formStreamUrl, setFormStreamUrl] = useState("");
  const [formControlEndpoint, setFormControlEndpoint] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormType("sensor");
    setFormLocation("");
    setFormSensorUrl("");
    setFormOperations([]);
    setOpName("");
    setOpUrl("");
    setFormStreamUrl("");
    setFormControlEndpoint("");
    setEditingDevice(null);
  };

  const openEdit = (device: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDevice(device);
    setFormName(device.name);
    setFormType(device.type);
    setFormLocation(device.location);
    setFormSensorUrl(device.type === "sensor" ? device.apiPath : "");
    setFormOperations(device.operations ?? []);
    setFormStreamUrl(device.streamUrl ?? "");
    setFormControlEndpoint(device.controlEndpoint ?? "");
    setDialogOpen(true);
  };

  const addOperation = () => {
    if (!opName.trim() || !opUrl.trim()) return;
    setFormOperations((prev) => [...prev, { name: opName.trim(), url: opUrl.trim() }]);
    setOpName("");
    setOpUrl("");
  };

  const removeOperation = (idx: number) => {
    setFormOperations((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formLocation.trim()) return;

    if (editingDevice) {
      setDeviceList((prev) =>
        prev.map((d) =>
          d.id === editingDevice.id
            ? {
                ...d,
                name: formName.trim(),
                type: formType,
                location: formLocation.trim(),
                description: `${formType.charAt(0).toUpperCase() + formType.slice(1)} - ${formLocation.trim()}`,
                apiPath: formType === "sensor" ? formSensorUrl.trim() : "",
                actionsPath: formType === "switch" && formOperations.length > 0 ? formOperations[0].url : undefined,
                operations: formType === "switch" ? formOperations : undefined,
                streamUrl: formType === "camera" ? formStreamUrl.trim() : undefined,
                controlEndpoint: formType === "camera" ? formControlEndpoint.trim() : undefined,
              }
            : d
        )
      );
    } else {
      const newDevice: Device = {
        id: `device-${Date.now()}`,
        name: formName.trim(),
        type: formType,
        status: "offline",
        location: formLocation.trim(),
        description: `${formType.charAt(0).toUpperCase() + formType.slice(1)} - ${formLocation.trim()}`,
        apiPath: formType === "sensor" ? formSensorUrl.trim() : "",
        actionsPath: formType === "switch" && formOperations.length > 0 ? formOperations[0].url : undefined,
        operations: formType === "switch" ? formOperations : undefined,
        streamUrl: formType === "camera" ? formStreamUrl.trim() : undefined,
        controlEndpoint: formType === "camera" ? formControlEndpoint.trim() : undefined,
      };
      setDeviceList((prev) => [...prev, newDevice]);
    }

    resetForm();
    setDialogOpen(false);
  };

  const onlineCount = deviceList.filter((d) => d.status === "online").length;
  const offlineCount = deviceList.filter((d) => d.status === "offline").length;

  const filtered = filter === "all" ? deviceList : deviceList.filter((d) => d.status === filter);

  const tiles: { label: string; value: number; filterKey: Filter; icon: React.ElementType; color: string }[] = [
    { label: "All Devices", value: deviceList.length, filterKey: "all", icon: Cpu, color: "text-primary" },
    { label: "Online Now", value: onlineCount, filterKey: "online", icon: Wifi, color: "text-emerald-300" },
    { label: "Inactive", value: offlineCount, filterKey: "offline", icon: WifiOff, color: "text-amber-200" },
  ];

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_90px_rgba(5,10,24,0.45)] md:p-8">
          <div className="grid-noise absolute inset-0" />

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="icon" className="absolute right-6 top-6 z-10 h-11 w-11 rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(255,153,44,0.35)] hover:bg-primary/90">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="panel-shell max-h-[85vh] overflow-y-auto rounded-[1.5rem] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingDevice ? "Edit Device" : "Add New Device"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="Device name" value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formType} onValueChange={(v) => { setFormType(v as DeviceType); setFormOperations([]); setFormSensorUrl(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sensor">Sensor</SelectItem>
                      <SelectItem value="switch">Switch</SelectItem>
                      <SelectItem value="bulb">Bulb</SelectItem>
                      <SelectItem value="camera">Camera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input placeholder="e.g. Zone A" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />
                </div>

                {formType === "sensor" && (
                  <div className="space-y-2">
                    <Label>Data URL</Label>
                    <Input placeholder="URL to read sensor data" value={formSensorUrl} onChange={(e) => setFormSensorUrl(e.target.value)} />
                  </div>
                )}

                {formType === "switch" && (
                  <div className="space-y-3">
                    <Label>Operations</Label>
                    {formOperations.map((op, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-lg border border-border bg-white/[0.03] p-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{op.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{op.url}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeOperation(idx)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
                      <Input placeholder="Operation name" value={opName} onChange={(e) => setOpName(e.target.value)} />
                      <Input placeholder="Operation URL" value={opUrl} onChange={(e) => setOpUrl(e.target.value)} />
                      <Button variant="outline" size="sm" className="w-full" onClick={addOperation} disabled={!opName.trim() || !opUrl.trim()}>
                        <Plus className="mr-1 h-3.5 w-3.5" /> Add Operation
                      </Button>
                    </div>
                  </div>
                )}

                {formType === "camera" && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Stream URL</Label>
                      <Input placeholder="Live stream URL" value={formStreamUrl} onChange={(e) => setFormStreamUrl(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Control Endpoint</Label>
                      <Input placeholder="PTZ control API endpoint" value={formControlEndpoint} onChange={(e) => setFormControlEndpoint(e.target.value)} />
                    </div>
                  </div>
                )}

                <Button className="w-full" onClick={handleSubmit} disabled={!formName.trim() || !formLocation.trim()}>
                  {editingDevice ? "Save Changes" : "Add Device"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-primary">
                <span className="status-dot text-primary" />
                IoT Dashboard
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <Activity className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                    Controling Devices and Sensor value reading
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                    An Integrated dashboard for controlling various device and collecting device information
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
              <div className="metric-glow rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Fleet</p>
                <p className="mt-3 text-3xl font-bold text-foreground">{deviceList.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Registered assets</p>
              </div>
              <div className="metric-glow rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-100/70">Online</p>
                <p className="mt-3 text-3xl font-bold text-emerald-50">{onlineCount}</p>
                <p className="mt-1 text-xs text-emerald-100/70">Healthy endpoints</p>
              </div>
              <div className="metric-glow rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-amber-100/70">Attention</p>
                <p className="mt-3 text-3xl font-bold text-amber-50">{offlineCount}</p>
                <p className="mt-1 text-xs text-amber-100/70">Offline assets</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {tiles.map((t) => (
            <Card
              key={t.filterKey}
              onClick={() => setFilter(t.filterKey)}
              className={`panel-shell metric-glow cursor-pointer rounded-[1.5rem] transition-all hover:-translate-y-1 hover:border-primary/40 ${
                filter === t.filterKey ? "border-primary ring-1 ring-primary/30" : ""
              }`}
            >
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <t.icon className={`h-5 w-5 ${t.color}`} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{t.label}</p>
                  <p className="mt-2 text-3xl font-bold">{t.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="panel-shell overflow-hidden rounded-[1.75rem]">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Asset Registry</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Connected devices and controls</h2>
              </div>
              <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-muted-foreground md:block">
                Filter: <span className="ml-1 font-mono uppercase text-foreground">{filter}</span>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                  <TableHead className="pl-6">Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((device) => {
                  const Icon = iconMap[device.id] || typeIconMap[device.type] || Cpu;
                  const online = device.status === "online";

                  return (
                    <TableRow
                      key={device.id}
                      className="group cursor-pointer border-white/5 transition-colors hover:bg-white/[0.04]"
                      onClick={() => navigate(`/device/${device.id}`)}
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{device.name}</p>
                            <p className="text-xs text-muted-foreground">{device.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize border-white/10 bg-white/[0.06] text-xs text-foreground">
                          {device.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{device.location}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            online
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                              : "border-amber-200/20 bg-amber-200/10 text-amber-100"
                          }
                        >
                          {online ? "Online" : "Offline"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) => openEdit(device, e)}
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
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
