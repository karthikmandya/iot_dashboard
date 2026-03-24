import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Thermometer,
  Power,
  RefreshCw,
  Activity,
  Lightbulb,
  Radio,
  Plug,
  Camera,
  Sun,
  SunDim,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { devices, authHeaders, type SensorEndpoint } from "@/lib/devices";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";

const typeIconMap: Record<string, React.ElementType> = {
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
  "modbus-sensor-1": Activity,
};

interface SensorData {
  value: string;
  unit: string;
}

/** Generate mock sensor history for the last 24 hours */
const generateSensorHistory = (deviceId: string) => {
  const now = Date.now();
  const points: { time: string; value: number }[] = [];
  const baseValue = deviceId === "temp-sensor-1" ? 22 : deviceId === "humidity-sensor-1" ? 55 : 0;
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now - i * 3600000);
    const hour = t.getHours().toString().padStart(2, "0") + ":00";
    points.push({
      time: hour,
      value: +(baseValue + (Math.random() - 0.5) * 6).toFixed(1),
    });
  }
  return points;
};

/** Generate mock online/offline timeline for the last 24 hours */
const generateSwitchHistory = (deviceId: string) => {
  const now = Date.now();
  const points: { time: string; status: number; label: string }[] = [];
  let online = deviceId === "zigbee-bulb-1";
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now - i * 3600000);
    const hour = t.getHours().toString().padStart(2, "0") + ":00";
    // Randomly toggle with 20% chance
    if (Math.random() < 0.2) online = !online;
    points.push({
      time: hour,
      status: online ? 1 : 0,
      label: online ? "Online" : "Offline",
    });
  }
  return points;
};

const DeviceDetail = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const device = devices.find((d) => d.id === deviceId);

  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [multiSensorData, setMultiSensorData] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [deviceOn, setDeviceOn] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [brightness, setBrightness] = useState(127);
  const [colorTemp, setColorTemp] = useState(4000);
  const [zoom, setZoom] = useState(50);
  const [cameraCoords, setCameraCoords] = useState({ x: 0, y: 0, z: 0 });
  const [sending, setSending] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  // Auto-refresh camera snapshot every 5 seconds via proxy (proxy injects auth)
  useEffect(() => {
    if (device?.type !== "camera" || !device.streamUrl) return;
    let revokePrev: string | null = null;

    const fetchSnapshot = async () => {
      try {
        const res = await fetch(device.streamUrl, { cache: "no-store" });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (revokePrev) URL.revokeObjectURL(revokePrev);
        revokePrev = url;
        setSnapshotUrl(url);
      } catch {
        // silently retry on next interval
      }
    };

    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 5000);
    return () => {
      clearInterval(interval);
      if (revokePrev) URL.revokeObjectURL(revokePrev);
    };
  }, [device?.type, device?.streamUrl]);

  const sendCameraCommand = useCallback(
    async (dx: number, dy: number, dz: number) => {
      const newCoords = {
        x: cameraCoords.x + dx,
        y: cameraCoords.y + dy,
        z: cameraCoords.z + dz,
      };
      setCameraCoords(newCoords);

      if (!device?.controlEndpoint) {
        toast.info(`Coordinates: X=${newCoords.x}, Y=${newCoords.y}, Z=${newCoords.z}`);
        return;
      }

      setSending(true);
      try {
        await fetch(device.controlEndpoint, {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify(newCoords),
        });
        toast.success(`Sent: X=${newCoords.x}, Y=${newCoords.y}, Z=${newCoords.z}`);
      } catch {
        toast.error("Failed to send camera command");
      } finally {
        setSending(false);
      }
    },
    [cameraCoords, device?.controlEndpoint]
  );

  const sensorHistory = useMemo(
    () => (device?.type === "sensor" ? generateSensorHistory(device.id) : []),
    [device?.id, device?.type]
  );

  const switchHistory = useMemo(
    () => (device?.type === "switch" ? generateSwitchHistory(device.id) : []),
    [device?.id, device?.type]
  );

  if (!device) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Device not found</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const Icon = iconMap[device.id] || typeIconMap[device.type] || Activity;
  const hasApi = !!device.apiPath;

  const readSensor = async () => {
    // Multi-endpoint sensor (e.g. Modbus)
    if (device.sensorEndpoints && device.sensorEndpoints.length > 0) {
      setLoading(true);
      try {
        const results: Record<string, string> = {};
        for (const ep of device.sensorEndpoints) {
          const headers: Record<string, string> = {};
          if (ep.authHeader) headers["Authorization"] = ep.authHeader;
          const res = await fetch(ep.url, { headers });
          const data = await res.json();
          const val = typeof data === "number" || typeof data === "string"
            ? String(data)
            : data?.value !== undefined
              ? String(data.value)
              : JSON.stringify(data);
          results[ep.label] = val;
        }
        setMultiSensorData(results);
        toast.success("Sensor data updated");
      } catch {
        toast.error("Failed to read sensor");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!device.apiPath) return;
    setLoading(true);
    try {
      const res = await fetch(device.apiPath, { headers: authHeaders });
      const data = await res.json();
      setSensorData({
        value: data.value.value.value,
        unit: data.value.unit.symbol,
      });
      toast.success("Sensor data updated");
    } catch {
      toast.error("Failed to read sensor");
    } finally {
      setLoading(false);
    }
  };

  const toggleDevice = async (on: boolean) => {
    if (!device.actionsPath) return;
    setToggling(true);
    try {
      const action = on ? "on" : "off";
      await fetch(`${device.actionsPath}/${action}`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
      });
      setDeviceOn(on);
      toast.success(`Device turned ${on ? "ON" : "OFF"}`);
    } catch {
      toast.error("Failed to toggle device");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back + Header */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>

        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">{device.name}</h1>
            <p className="text-sm text-muted-foreground">{device.location}</p>
          </div>
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
        </div>

        {/* Info Card */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Type</p>
                <p className="font-medium capitalize">{device.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Location</p>
                <p className="font-medium">{device.location}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{device.description}</p>
          </CardContent>
        </Card>

        {/* Sensor Control */}
        {device.type === "sensor" && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">Sensor Reading</CardTitle>
                <Button onClick={readSensor} disabled={loading || !hasApi} size="sm" className="gap-2">
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Reading..." : "Get Data"}
                </Button>
              </CardHeader>
              <CardContent>
                {!hasApi ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    This sensor is not connected to a live API endpoint
                  </p>
                ) : device.sensorEndpoints && multiSensorData ? (
                  <div className="flex justify-center gap-4 flex-wrap">
                    {device.sensorEndpoints.map((ep) => (
                      <div key={ep.label} className="rounded-lg bg-secondary/50 p-4 text-center min-w-[120px]">
                        <Activity className="h-5 w-5 text-primary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">{ep.label}</p>
                        <p className="text-lg font-mono font-bold mt-0.5">
                          {multiSensorData[ep.label] ?? "–"} {ep.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : sensorData ? (
                  <div className="flex justify-center">
                    <div className="rounded-lg bg-secondary/50 p-4 text-center min-w-[120px]">
                      <Thermometer className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Value</p>
                      <p className="text-lg font-mono font-bold mt-0.5">
                        {sensorData.value}{sensorData.unit}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Press "Get Data" to fetch current reading
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Sensor History Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Value Over Time (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sensorHistory}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                        interval={3}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "hsl(var(--primary))" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Switch Control */}
        {device.type === "switch" && (
          <>
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                      deviceOn ? "bg-primary/15" : "bg-secondary"
                    }`}
                  >
                    <Power className={`h-5 w-5 transition-colors ${deviceOn ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Power Control</p>
                    <p className={`text-xs font-mono ${deviceOn ? "text-[hsl(var(--success))]" : "text-muted-foreground"}`}>
                      {deviceOn ? "● ON" : "○ OFF"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={deviceOn}
                  onCheckedChange={toggleDevice}
                  disabled={toggling || !hasApi}
                />
              </CardContent>
            </Card>

            {/* Switch Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Online / Offline Timeline (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={switchHistory}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                        interval={3}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                        domain={[0, 1]}
                        ticks={[0, 1]}
                        tickFormatter={(v) => (v === 1 ? "Online" : "Offline")}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [value === 1 ? "Online" : "Offline", "Status"]}
                      />
                      <Bar dataKey="status" radius={[4, 4, 0, 0]}>
                        {switchHistory.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.status === 1 ? "hsl(var(--success))" : "hsl(var(--muted-foreground))"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Bulb Control */}
        {device.type === "bulb" && (
          <>
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                      deviceOn ? "bg-primary/15" : "bg-secondary"
                    }`}
                  >
                    <Power className={`h-5 w-5 transition-colors ${deviceOn ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Power Control</p>
                    <p className={`text-xs font-mono ${deviceOn ? "text-[hsl(var(--success))]" : "text-muted-foreground"}`}>
                      {deviceOn ? "● ON" : "○ OFF"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={deviceOn}
                  onCheckedChange={toggleDevice}
                  disabled={toggling || !hasApi}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Brightness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <SunDim className="h-5 w-5 text-muted-foreground shrink-0" />
                  <Slider
                    value={[brightness]}
                    onValueChange={(v) => setBrightness(v[0])}
                    onValueCommit={async (v) => {
                      if (!device.brightnessEndpoint) return;
                      try {
                        await fetch(device.brightnessEndpoint, {
                          method: "POST",
                          headers: { ...authHeaders, "Content-Type": "application/json" },
                          body: JSON.stringify({
                            arguments: {
                              "Argument 1": {
                                unit: { symbol: "1", systemName: "SI" },
                                value: { value: String(v[0]) },
                              },
                              "Argument 2": 1000,
                            },
                          }),
                        });
                        toast.success(`Brightness set to ${Math.round((v[0] / 254) * 100)}%`);
                      } catch {
                        toast.error("Failed to set brightness");
                      }
                    }}
                    min={0}
                    max={254}
                    step={1}
                    className="flex-1"
                  />
                  <Sun className="h-5 w-5 text-primary shrink-0" />
                </div>
                <p className="text-center text-sm font-mono font-medium">{Math.round((brightness / 254) * 100)}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Color Temperature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-amber-500 shrink-0">Warm</span>
                  <div className="flex-1 relative">
                    <div
                      className="absolute inset-0 rounded-full h-2 top-1/2 -translate-y-1/2"
                      style={{
                        background: "linear-gradient(to right, #f59e0b, #fbbf24, #fde68a, #e0f2fe, #bae6fd, #7dd3fc)",
                      }}
                    />
                    <Slider
                      value={[colorTemp]}
                      onValueChange={(v) => setColorTemp(v[0])}
                      onValueCommit={async (v) => {
                        if (!device.colorTempEndpoint) return;
                        try {
                          await fetch(device.colorTempEndpoint, {
                            method: "POST",
                            headers: { ...authHeaders, "Content-Type": "application/json" },
                            body: JSON.stringify({
                              arguments: {
                                "Argument 1": {
                                  unit: { symbol: "K", systemName: "SI" },
                                  value: { value: String(v[0]) },
                                },
                                "Argument 2": 1000,
                              },
                            }),
                          });
                          toast.success(`Color temperature set to ${v[0]}K`);
                        } catch {
                          toast.error("Failed to set color temperature");
                        }
                      }}
                      min={2000}
                      max={6535}
                      step={1}
                      className="relative"
                    />
                  </div>
                  <span className="text-xs font-medium text-sky-400 shrink-0">Cool</span>
                </div>
                <p className="text-center text-sm font-mono font-medium">
                  {colorTemp}K – {colorTemp < 3500 ? "Warm White" : colorTemp < 5000 ? "Neutral White" : "Cool Daylight"}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Camera Control */}
        {device.type === "camera" && (
          <>
            {/* Live Stream Link */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Live Stream</CardTitle>
              </CardHeader>
              <CardContent>
                {device.streamUrl ? (
                  <div className="space-y-3">
                    <div className="relative w-full rounded-lg overflow-hidden bg-black aspect-video">
                      {snapshotUrl ? (
                        <img
                          src={snapshotUrl}
                          alt={`${device.name} live stream`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                          Loading snapshot…
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        LIVE
                      </div>
                    </div>
                    <a
                      href={device.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open in new tab
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No stream URL configured. Edit this device to add one.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* PTZ D-Pad Controller */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Camera PTZ Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-8 justify-center">
                  {/* D-Pad */}
                  <div className="flex flex-col items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-lg"
                      disabled={sending}
                      onClick={() => sendCameraCommand(0, 1, 0)}
                    >
                      <ChevronUp className="h-6 w-6" />
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-lg"
                        disabled={sending}
                        onClick={() => sendCameraCommand(-1, 0, 0)}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
                        <Camera className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-lg"
                        disabled={sending}
                        onClick={() => sendCameraCommand(1, 0, 0)}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-lg"
                      disabled={sending}
                      onClick={() => sendCameraCommand(0, -1, 0)}
                    >
                      <ChevronDown className="h-6 w-6" />
                    </Button>
                  </div>

                  {/* Zoom Slider (vertical) */}
                  <div className="flex flex-col items-center gap-3 pt-1">
                    <ZoomIn className="h-4 w-4 text-primary shrink-0" />
                    <div className="h-[140px] flex items-center">
                      <Slider
                        orientation="vertical"
                        value={[zoom]}
                        onValueChange={(v) => {
                          const dz = v[0] - zoom;
                          setZoom(v[0]);
                          sendCameraCommand(0, 0, dz);
                        }}
                        min={0}
                        max={100}
                        step={5}
                        className="h-full"
                      />
                    </div>
                    <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-xs font-mono text-muted-foreground">{zoom}%</p>
                  </div>
                </div>

                {/* Coordinates Display */}
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">X</p>
                    <p className="text-sm font-mono font-bold">{cameraCoords.x}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Y</p>
                    <p className="text-sm font-mono font-bold">{cameraCoords.y}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Z</p>
                    <p className="text-sm font-mono font-bold">{cameraCoords.z}</p>
                  </div>
                </div>

                {device.controlEndpoint && (
                  <p className="text-xs text-muted-foreground text-center">
                    Endpoint: {device.controlEndpoint}
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default DeviceDetail;
