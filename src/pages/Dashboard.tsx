import { useEffect, useMemo, useState } from "react";
import {
  CircleUserRound,
  ChevronDown,
  Camera,
  Cpu,
  Home,
  Lightbulb,
  Move,
  Plus,
  Plug,
  Radio,
  RefreshCw,
  Thermometer,
  Waves,
  Wind,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { authHeaders, devices as initialDevices, type Device } from "@/lib/devices";
import cameraLastFrame from "@/assets/camera-last-frame.png";
import homeImage from "@/assets/home.png";
import { useNavigate } from "react-router-dom";

type DeviceReading = {
  value: string;
  detail: string;
  unit?: string;
};

type DevicePlacement = {
  top: string;
  left: string;
  room: string;
  label: string;
};

type HighlightGroup = "online" | "attention" | null;

const iconMap: Record<string, React.ElementType> = {
  "temp-sensor-1": Thermometer,
  "smart-bulb-1": Lightbulb,
  "humidity-sensor-1": Waves,
  "motion-sensor-1": Radio,
  "smart-plug-1": Plug,
  "security-cam-1": Camera,
  "modbus-sensor-1": Cpu,
};

const placementMap: Record<string, DevicePlacement> = {
  "security-cam-1": { top: "66%", left: "46%", room: "Entrance", label: "Entrance camera" },
  "motion-sensor-1": { top: "61%", left: "54%", room: "Entrance", label: "Entry motion" },
  "temp-sensor-1": { top: "46%", left: "48%", room: "Living room", label: "Living room temp" },
  "humidity-sensor-1": { top: "50%", left: "40%", room: "Living room", label: "Humidity sensor" },
  "smart-bulb-1": { top: "34%", left: "57%", room: "Living room", label: "Ceiling bulb" },
  "smart-plug-1": { top: "53%", left: "77%", room: "Workspace", label: "Smart plug" },
  "modbus-sensor-1": { top: "73%", left: "25%", room: "Utility", label: "Power meter" },
};

const generateReading = (device: Device, tick: number): DeviceReading[] => {
  const stamp = (new Date().getSeconds() + tick) % 60;

  switch (device.id) {
    case "temp-sensor-1":
      return [
        { value: `${23 + (stamp % 3)}.${stamp % 10}`, unit: "C", detail: "Ambient temperature" },
        { value: `${46 + (stamp % 4)}`, unit: "%", detail: "Comfort target match" },
      ];
    case "humidity-sensor-1":
      return [
        { value: `${55 + (stamp % 5)}`, unit: "%", detail: "Relative humidity" },
        { value: `${12 + (stamp % 3)}`, unit: "g/m3", detail: "Moisture density" },
      ];
    case "motion-sensor-1":
      return [
        { value: stamp % 2 === 0 ? "No motion" : "Movement", detail: "Entry activity" },
        { value: `${4 + (stamp % 3)} sec`, detail: "Last detection window" },
      ];
    case "modbus-sensor-1":
      return [
        { value: `${228 + (stamp % 4)}`, unit: "V", detail: "Line voltage" },
        { value: `${6 + (stamp % 2)}.${stamp % 10}`, unit: "A", detail: "Load current" },
      ];
    case "security-cam-1":
      return [
        { value: "Live", detail: "Video stream status" },
        { value: "92%", detail: "Link quality" },
      ];
    case "smart-bulb-1":
      return [
        { value: "720", unit: "lm", detail: "Current output" },
        { value: "Neutral", detail: "Color mode" },
      ];
    case "smart-plug-1":
      return [
        { value: device.status === "online" ? "1.8" : "0.0", unit: "kWh", detail: "Energy use today" },
        { value: device.status === "online" ? "Standby" : "Offline", detail: "Socket state" },
      ];
    default:
      return [{ value: "Nominal", detail: "Device status" }];
  }
};

const getDeviceAccent = (device: Device) => {
  if (device.type === "camera" || device.id.includes("motion")) return "security";
  if (device.id.includes("modbus")) return "network";
  if (device.type === "switch" || device.type === "bulb") return "power";
  return "sensor";
};

const getActionLabel = (device: Device) => {
  if (device.type === "camera") return "Monitor + PTZ";
  if (device.type === "bulb") return "Lighting control";
  if (device.type === "switch") return "Power control";
  return "Live telemetry";
};

const Dashboard = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  const [devices] = useState(initialDevices);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [hoveredDeviceId, setHoveredDeviceId] = useState<string | null>(null);
  const [isDeviceListOpen, setIsDeviceListOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [highlightGroup, setHighlightGroup] = useState<HighlightGroup>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [readingTick, setReadingTick] = useState(0);
  const [deviceStates, setDeviceStates] = useState<Record<string, boolean>>({
    "smart-bulb-1": true,
    "smart-plug-1": false,
  });
  const [brightness, setBrightness] = useState(72);
  const [colorTemp, setColorTemp] = useState(4100);
  const [cameraVector, setCameraVector] = useState({ pan: 0, tilt: 0, zoom: 40 });

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId) ?? null,
    [devices, selectedDeviceId],
  );

  const onlineCount = devices.filter((device) => device.status === "online").length;
  const offlineCount = devices.length - onlineCount;
  const readings = useMemo(
    () =>
      devices.reduce<Record<string, DeviceReading[]>>((accumulator, device) => {
        accumulator[device.id] = generateReading(device, readingTick);
        return accumulator;
      }, {}),
    [devices, readingTick],
  );
  const temperatureReading = readings["temp-sensor-1"]?.[0];
  const modbusCurrentReading = readings["modbus-sensor-1"]?.find((reading) => reading.detail === "Load current");

  const openDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
  };

  const updateToggle = async (device: Device, value: boolean) => {
    if (!device.actionsPath) {
      setDeviceStates((current) => ({ ...current, [device.id]: value }));
      return;
    }

    try {
      const action = value ? "on" : "off";
      const response = await fetch(`${device.actionsPath}/${action}`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Toggle failed with status ${response.status}`);
      }

      setDeviceStates((current) => ({ ...current, [device.id]: value }));
      toast.success(`${device.name} turned ${value ? "ON" : "OFF"}`);
    } catch {
      toast.error(`Failed to toggle ${device.name}`);
    }
  };

  const nudgeCamera = (axis: "pan" | "tilt", delta: number) => {
    setCameraVector((current) => ({ ...current, [axis]: current[axis] + delta }));
  };

  const setBulbBrightness = async (device: Device, value: number) => {
    if (!device.brightnessEndpoint) return;

    try {
      const response = await fetch(device.brightnessEndpoint, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          arguments: {
            "Argument 1": {
              unit: { symbol: "1", systemName: "SI" },
              value: { value: String(Math.round((value / 100) * 254)) },
            },
            "Argument 2": 1000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Brightness failed with status ${response.status}`);
      }

      toast.success(`Brightness set to ${value}%`);
    } catch {
      toast.error("Failed to set brightness");
    }
  };

  const setBulbColorTemperature = async (device: Device, value: number) => {
    if (!device.colorTempEndpoint) return;

    try {
      const response = await fetch(device.colorTempEndpoint, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          arguments: {
            "Argument 1": {
              unit: { symbol: "K", systemName: "SI" },
              value: { value: String(value) },
            },
            "Argument 2": 1000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Color temperature failed with status ${response.status}`);
      }

      toast.success(`Color temperature set to ${value}K`);
    } catch {
      toast.error("Failed to set color temperature");
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen px-4 py-5 md:px-6 xl:px-8">
      <div className="mx-auto max-w-[1680px] space-y-5">
        <section className="space-y-5">
          <Card className="panel-shell home-hero glass-sheen overflow-hidden rounded-[32px] border-white/10">
            <CardContent className="relative p-5 md:p-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-4">
                      <Badge className="border-primary/30 bg-primary/12 text-primary">IoT Edge Home View</Badge>
                      <div>
                        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                          IoT Edge Dashboard 
                        </h1>
                        <p>   
                          Interactive Dashboard for Edge Sensors and Device Controls.
                        </p>
                      </div>
                    </div>

                    <div
                      className="header-action-group"
                    >
                      <button
                        type="button"
                        className="add-device-trigger"
                        onClick={() => toast.info("Add new device flow is not configured yet.")}
                      >
                        <span className="add-device-copy">
                          <strong>Add New Device</strong>
                          <span>Register node</span>
                        </span>
                        <Plus className="h-5 w-5 text-primary" />
                      </button>

                      <div
                        className="profile-menu-shell"
                        onMouseEnter={() => setIsProfileMenuOpen(true)}
                        onMouseLeave={() => setIsProfileMenuOpen(false)}
                      >
                        <DropdownMenu open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen}>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="profile-menu-trigger"
                              aria-label="Open profile menu"
                            >
                              <span className="profile-menu-copy">
                                <strong>Admin</strong>
                                <span>Profile</span>
                              </span>
                              <CircleUserRound className="profile-menu-icon h-5 w-5 text-primary" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            sideOffset={8}
                            className="profile-menu-content rounded-2xl border-white/10 bg-[hsl(var(--card))]/95 p-2 backdrop-blur-xl"
                          >
                            <DropdownMenuItem
                              className="rounded-xl px-3 py-2 text-sm text-foreground focus:bg-white/10"
                              onClick={() => toast.info("Edit profile action is not configured yet.")}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-xl px-3 py-2 text-sm text-foreground focus:bg-white/10"
                              onClick={() => toast.info("Settings action is not configured yet.")}
                            >
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-xl px-3 py-2 text-sm text-red-200 focus:bg-red-500/15 focus:text-red-100"
                              onClick={handleLogout}
                            >
                              Logout
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="home-shell">
                  <div className="home-plan home-plan-expanded">
                    <div className={`device-overlay-panel ${isDeviceListOpen ? "is-open" : ""}`}>
                      <button
                        type="button"
                        className="device-overlay-trigger"
                        onMouseEnter={() => setIsDeviceListOpen(true)}
                        onMouseLeave={() => setIsDeviceListOpen(false)}
                        onFocus={() => setIsDeviceListOpen(true)}
                        onBlur={() => setIsDeviceListOpen(false)}
                      >
                        <span>
                          
                          <strong>All Devices</strong>
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isDeviceListOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isDeviceListOpen ? (
                        <div
                          className="device-overlay-list"
                          onMouseEnter={() => setIsDeviceListOpen(true)}
                          onMouseLeave={() => setIsDeviceListOpen(false)}
                        >
                          {devices.map((device) => (
                            <button
                              key={device.id}
                              type="button"
                              className="device-overlay-item"
                              onMouseEnter={() => setHoveredDeviceId(device.id)}
                              onMouseLeave={() => setHoveredDeviceId((current) => (current === device.id ? null : current))}
                              onFocus={() => setHoveredDeviceId(device.id)}
                              onBlur={() => setHoveredDeviceId((current) => (current === device.id ? null : current))}
                              onClick={() => {
                                setSelectedDeviceId(device.id);
                                setIsDeviceListOpen(false);
                              }}
                            >
                              <span>
                                <strong>{device.name}</strong>
                                <span>{placementMap[device.id]?.room ?? device.location}</span>
                              </span>
                              <Badge
                                variant="outline"
                                className={
                                  device.status === "online"
                                    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                                    : "border-amber-300/25 bg-amber-300/10 text-amber-100"
                                }
                              >
                                {device.status}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="image-stats-panel">
                      <div
                        className="image-stat-card"
                        onMouseEnter={() => setHighlightGroup("online")}
                        onMouseLeave={() => setHighlightGroup((current) => (current === "online" ? null : current))}
                      >
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Devices Online</p>
                        <p className="mt-3 text-3xl font-semibold text-foreground">{onlineCount}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Connected at the edge</p>
                      </div>
                      <div
                        className="image-stat-card"
                        onMouseEnter={() => setHighlightGroup("attention")}
                        onMouseLeave={() => setHighlightGroup((current) => (current === "attention" ? null : current))}
                      >
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Attention</p>
                        <p className="mt-3 text-3xl font-semibold text-foreground">{offlineCount}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Nodes needing recovery</p>
                      </div>
                      <div className="image-stat-card">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Local Time</p>
                        <p className="mt-3 font-mono text-2xl font-semibold text-foreground">
                          {currentTime.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">Edge node clock</p>
                      </div>
                      <div className="image-stat-card">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Temperature</p>
                        <p className="mt-3 text-3xl font-semibold text-foreground">
                          {temperatureReading ? (
                            <>
                              {temperatureReading.value}
                              {temperatureReading.unit ? <span className="ml-1 text-xl text-primary">{temperatureReading.unit}</span> : null}
                            </>
                          ) : (
                            "--"
                          )}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">From temperature sensor</p>
                      </div>
                      <div className="image-stat-card">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Load Current</p>
                        <p className="mt-3 text-3xl font-semibold text-foreground">
                          {modbusCurrentReading ? (
                            <>
                              {modbusCurrentReading.value}
                              {modbusCurrentReading.unit ? <span className="ml-1 text-xl text-primary">{modbusCurrentReading.unit}</span> : null}
                            </>
                          ) : (
                            "--"
                          )}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">From Modbus sensor</p>
                      </div>
                    </div>

                    <img
                      src={homeImage}
                      alt="Isometric smart home layout"
                      className="home-plan-image"
                    />

                    {devices.map((device) => {
                      const Icon = iconMap[device.id] ?? Home;
                      const placement = placementMap[device.id];
                      const accent = getDeviceAccent(device);
                      const matchesGroup =
                        highlightGroup === "online"
                          ? device.status === "online"
                          : highlightGroup === "attention"
                            ? device.status !== "online"
                            : false;

                      if (!placement) return null;

                      return (
                        <button
                          key={device.id}
                          type="button"
                          className={`device-pin type-${accent} ${device.status === "online" ? "is-online" : "is-offline"} ${
                            hoveredDeviceId === device.id || matchesGroup ? "is-highlighted" : ""
                          } ${
                            hoveredDeviceId === device.id || matchesGroup ? "is-blinking" : ""
                          }`}
                          style={{ top: placement.top, left: placement.left }}
                          onClick={() => openDevice(device.id)}
                          onMouseEnter={() => setHoveredDeviceId(device.id)}
                          onMouseLeave={() => setHoveredDeviceId((current) => (current === device.id ? null : current))}
                          aria-label={`${device.name} in ${placement.room}`}
                        >
                          <span className="device-pin-core">
                            <Icon className="h-5 w-5" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <Dialog open={!!selectedDevice} onOpenChange={(open) => !open && setSelectedDeviceId(null)}>
        {selectedDevice ? (
          <DialogContent className="max-w-3xl border-white/10 bg-[hsl(var(--card))] p-0 sm:rounded-[28px]">
            <div className="home-dialog-grid">
              <div className={`home-dialog-side type-${getDeviceAccent(selectedDevice)}`}>
                <div className="p-6">
                  <Badge className="border-white/10 bg-white/10 text-white">{selectedDevice.type}</Badge>
                  <DialogHeader className="mt-4 text-left">
                    <DialogTitle className="text-2xl text-foreground">{selectedDevice.name}</DialogTitle>
                    <DialogDescription className="text-sm leading-6 text-white/75">
                      {selectedDevice.description}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/60">Installed In</p>
                      <p className="mt-2 text-sm text-white">{selectedDevice.location}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/60">Popup Focus</p>
                      <p className="mt-2 text-sm text-white/85">{getActionLabel(selectedDevice)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Realtime Context</p>
                    <h3 className="mt-1 text-xl font-semibold text-foreground">Device popup</h3>
                  </div>
                  <Button variant="outline" className="rounded-2xl" onClick={() => setReadingTick((value) => value + 1)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {readings[selectedDevice.id]?.map((reading) => (
                    <div key={reading.detail} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{reading.detail}</p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {reading.value}
                        {reading.unit ? <span className="ml-1 text-base text-primary">{reading.unit}</span> : null}
                      </p>
                    </div>
                  ))}
                </div>

                {selectedDevice.type === "sensor" ? (
                  <div className="rounded-[24px] border border-white/10 bg-black/10 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Sensor telemetry</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Relative readings for this room update on demand from the popup.
                        </p>
                      </div>
                      <Wind className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                ) : null}

                {selectedDevice.type === "bulb" ? (
                  <div className="space-y-4 rounded-[24px] border border-white/10 bg-black/10 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Lighting power</p>
                        <p className="text-sm text-muted-foreground">Control the bulb mounted in the living room holder.</p>
                      </div>
                      <Switch
                        checked={deviceStates[selectedDevice.id] ?? false}
                        onCheckedChange={(value) => void updateToggle(selectedDevice, value)}
                      />
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Brightness</p>
                        <span className="text-sm text-primary">{brightness}%</span>
                      </div>
                      <Slider
                        value={[brightness]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) => setBrightness(value[0])}
                        onValueCommit={(value) => void setBulbBrightness(selectedDevice, value[0])}
                      />
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Color temperature</p>
                        <span className="text-sm text-primary">{colorTemp}K</span>
                      </div>
                      <Slider
                        value={[colorTemp]}
                        min={2000}
                        max={6500}
                        step={50}
                        onValueChange={(value) => setColorTemp(value[0])}
                        onValueCommit={(value) => void setBulbColorTemperature(selectedDevice, value[0])}
                      />
                    </div>
                  </div>
                ) : null}

                {selectedDevice.type === "switch" ? (
                  <div className="space-y-4 rounded-[24px] border border-white/10 bg-black/10 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Socket power</p>
                        <p className="text-sm text-muted-foreground">Enable or isolate the utility outlet from this popup.</p>
                      </div>
                      <Switch
                        checked={deviceStates[selectedDevice.id] ?? false}
                        onCheckedChange={(value) => void updateToggle(selectedDevice, value)}
                      />
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Current state</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">
                        {deviceStates[selectedDevice.id] ? "Output Enabled" : "Output Disabled"}
                      </p>
                    </div>
                  </div>
                ) : null}

                {selectedDevice.type === "camera" ? (
                  <div className="space-y-4 rounded-[24px] border border-white/10 bg-black/10 p-5">
                    <div className="overflow-hidden rounded-[24px] border border-white/10">
                      <img src={cameraLastFrame} alt={`${selectedDevice.name} view`} className="h-56 w-full object-cover" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">PTZ controls</p>
                        <p className="text-sm text-muted-foreground">Adjust the entrance camera directly from the home map.</p>
                      </div>
                      <Move className="h-4 w-4 text-primary" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Button variant="outline" className="rounded-2xl" onClick={() => nudgeCamera("tilt", 1)}>
                        Tilt +
                      </Button>
                      <Button variant="outline" className="rounded-2xl" onClick={() => setCameraVector({ pan: 0, tilt: 0, zoom: 40 })}>
                        Center
                      </Button>
                      <Button variant="outline" className="rounded-2xl" onClick={() => nudgeCamera("pan", 1)}>
                        Pan +
                      </Button>
                      <Button variant="outline" className="rounded-2xl" onClick={() => nudgeCamera("pan", -1)}>
                        Pan -
                      </Button>
                      <Button variant="outline" className="rounded-2xl" onClick={() => setCameraVector((current) => ({ ...current, zoom: Math.max(0, current.zoom - 10) }))}>
                        Zoom -
                      </Button>
                      <Button variant="outline" className="rounded-2xl" onClick={() => setCameraVector((current) => ({ ...current, zoom: Math.min(100, current.zoom + 10) }))}>
                        Zoom +
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4 text-center">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Pan</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">{cameraVector.pan}</p>
                      </div>
                      <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4 text-center">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Tilt</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">{cameraVector.tilt}</p>
                      </div>
                      <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4 text-center">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Zoom</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">{cameraVector.zoom}%</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
};

export default Dashboard;
