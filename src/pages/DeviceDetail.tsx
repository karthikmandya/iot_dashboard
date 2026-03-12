import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { devices, authHeaders } from "@/lib/devices";
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
  const [loading, setLoading] = useState(false);
  const [deviceOn, setDeviceOn] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [brightness, setBrightness] = useState(75);
  const [colorTemp, setColorTemp] = useState(50);

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
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back + Header */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2 -ml-2">
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
      </div>
    </div>
  );
};

export default DeviceDetail;
