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
import { devices as initialDevices, Device, DeviceType, DeviceOperation } from "@/lib/devices";

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

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<DeviceType>("sensor");
  const [formLocation, setFormLocation] = useState("");
  const [formSensorUrl, setFormSensorUrl] = useState("");
  const [formOperations, setFormOperations] = useState<DeviceOperation[]>([]);
  const [opName, setOpName] = useState("");
  const [opUrl, setOpUrl] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormType("sensor");
    setFormLocation("");
    setFormSensorUrl("");
    setFormOperations([]);
    setOpName("");
    setOpUrl("");
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
                description: `${formType.charAt(0).toUpperCase() + formType.slice(1)} – ${formLocation.trim()}`,
                apiPath: formType === "sensor" ? formSensorUrl.trim() : "",
                actionsPath: formType === "switch" && formOperations.length > 0 ? formOperations[0].url : undefined,
                operations: formType === "switch" ? formOperations : undefined,
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
        description: `${formType.charAt(0).toUpperCase() + formType.slice(1)} – ${formLocation.trim()}`,
        apiPath: formType === "sensor" ? formSensorUrl.trim() : "",
        actionsPath: formType === "switch" && formOperations.length > 0 ? formOperations[0].url : undefined,
        operations: formType === "switch" ? formOperations : undefined,
      };
      setDeviceList((prev) => [...prev, newDevice]);
    }
    resetForm();
    setDialogOpen(false);
  };

  const onlineCount = deviceList.filter((d) => d.status === "online").length;
  const offlineCount = deviceList.filter((d) => d.status === "offline").length;

  const filtered =
    filter === "all"
      ? deviceList
      : deviceList.filter((d) => d.status === filter);

  const tiles: { label: string; value: number; filterKey: Filter; icon: React.ElementType; color: string }[] = [
    { label: "All Devices", value: deviceList.length, filterKey: "all", icon: Cpu, color: "text-primary" },
    { label: "Online Now", value: onlineCount, filterKey: "online", icon: Wifi, color: "text-[hsl(var(--success))]" },
    { label: "Inactive", value: offlineCount, filterKey: "offline", icon: WifiOff, color: "text-muted-foreground" },
  ];

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-mono">IoT Edge Dashboard</h1>
              <p className="text-sm text-muted-foreground">Real-time device monitoring & control</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-full h-10 w-10">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
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
                  <Input placeholder="e.g. Lab – Zone A" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />
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
                      <div key={idx} className="flex items-center gap-2 rounded-lg border border-border p-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{op.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{op.url}</p>
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
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Operation
                      </Button>
                    </div>
                  </div>
                )}

                <Button className="w-full" onClick={handleSubmit} disabled={!formName.trim() || !formLocation.trim()}>
                  {editingDevice ? "Save Changes" : "Add Device"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                  const Icon = iconMap[device.id] || typeIconMap[device.type] || Cpu;
                  return (
                    <TableRow
                      key={device.id}
                      className="cursor-pointer group hover:bg-secondary/50 transition-colors"
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
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
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
