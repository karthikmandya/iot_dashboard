import { useState } from "react";
import { Activity, Power, RefreshCw, Thermometer, Droplets, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface SensorData {
  temperature: number;
  humidity: number;
  pressure: number;
}

const Index = () => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [deviceOn, setDeviceOn] = useState(false);
  const [toggling, setToggling] = useState(false);

  const readSensor = async () => {
    setLoading(true);
    try {
      // TODO: Replace with your actual API endpoint
      // const res = await fetch("http://your-backend/api/sensor");
      // const data = await res.json();
      // setSensorData(data);

      // Mock data for demo
      await new Promise((r) => setTimeout(r, 800));
      setSensorData({
        temperature: +(20 + Math.random() * 15).toFixed(1),
        humidity: +(30 + Math.random() * 50).toFixed(1),
        pressure: +(1000 + Math.random() * 30).toFixed(1),
      });
      toast.success("Sensor data updated");
    } catch {
      toast.error("Failed to read sensor");
    } finally {
      setLoading(false);
    }
  };

  const toggleDevice = async (on: boolean) => {
    setToggling(true);
    try {
      // TODO: Replace with your actual API endpoint
      // await fetch("http://your-backend/api/device", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ state: on }),
      // });

      await new Promise((r) => setTimeout(r, 500));
      setDeviceOn(on);
      toast.success(`Device turned ${on ? "ON" : "OFF"}`);
    } catch {
      toast.error("Failed to toggle device");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">IoT Control Panel</h1>
            <p className="text-sm text-muted-foreground">Monitor sensors & manage devices</p>
          </div>
        </div>

        {/* Sensor Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Sensor Data</CardTitle>
            <Button onClick={readSensor} disabled={loading} size="sm" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Reading..." : "Read Sensor"}
            </Button>
          </CardHeader>
          <CardContent>
            {sensorData ? (
              <div className="grid grid-cols-3 gap-4">
                <SensorValue icon={Thermometer} label="Temp" value={`${sensorData.temperature}°C`} />
                <SensorValue icon={Droplets} label="Humidity" value={`${sensorData.humidity}%`} />
                <SensorValue icon={Gauge} label="Pressure" value={`${sensorData.pressure} hPa`} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                Press "Read Sensor" to fetch data
              </p>
            )}
          </CardContent>
        </Card>

        {/* Device Card */}
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${deviceOn ? "bg-primary/15" : "bg-secondary"}`}>
                <Power className={`h-5 w-5 transition-colors ${deviceOn ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-medium">Device Power</p>
                <p className={`text-xs font-mono ${deviceOn ? "text-success" : "text-muted-foreground"}`}>
                  {deviceOn ? "● ONLINE" : "○ OFFLINE"}
                </p>
              </div>
            </div>
            <Switch
              checked={deviceOn}
              onCheckedChange={toggleDevice}
              disabled={toggling}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function SensorValue({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 p-3 text-center">
      <Icon className="h-4 w-4 text-primary mx-auto mb-1" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-mono font-semibold mt-0.5">{value}</p>
    </div>
  );
}

export default Index;
