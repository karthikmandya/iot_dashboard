export type DeviceType = "sensor" | "switch" | "bulb" | "camera";
export type DeviceStatus = "online" | "offline";

export interface DeviceOperation {
  name: string;
  url: string;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location: string;
  description: string;
  /** API path fragment used to build the full URL */
  apiPath: string;
  /** For switches: the actions sub-path */
  actionsPath?: string;
  /** For switches: named operations */
  operations?: DeviceOperation[];
  /** For cameras: live stream URL */
  streamUrl?: string;
  /** For cameras: PTZ control endpoint */
  controlEndpoint?: string;
  /** For bulbs: brightness control endpoint */
  brightnessEndpoint?: string;
  /** For bulbs: color temperature control endpoint */
  colorTempEndpoint?: string;
}

export const AUTH_HEADER = "Basic " + btoa("admin:CcX1Hx?92)[6|Mym8W@b");
export const authHeaders = { Authorization: AUTH_HEADER };

export const devices: Device[] = [
  {
    id: "temp-sensor-1",
    name: "Temperature Sensor",
    type: "sensor",
    status: "online",
    location: "Lab – Zone A",
    description: "ZigBee temperature sensor monitoring lab environment",
    apiPath:
      "/api/bosch/rs/gdm/devices/mprm.osgi.device/remote.manager.controlled/components/mprm.osgi.fi.com.prosyst.mbs.services.da.items.Sensor/da%3Aitem%3AZigBee%3A286d97000115b3b3%231%233%3ASensor/state-vars/value",
  },
 /* {
    id: "zigbee-bulb-1",
    name: "Zigbee Bulb",
    type: "switch",
    status: "online",
    location: "Lab – Zone B",
    description: "ZigBee smart bulb for lab lighting control",
    apiPath:
      "/api/bosch/rs/gdm/devices/mprm.osgi.device/remote.manager.controlled/components/mprm.osgi.fi.com.prosyst.mbs.services.da.items.Switch/da:item:ZigBee:001788010eb1c51f%2311%232:Switch/actions",
    actionsPath: 
      "/api/bosch/rs/gdm/devices/mprm.osgi.device/remote.manager.controlled/components/mprm.osgi.fi.com.prosyst.mbs.services.da.items.Switch/da:item:ZigBee:001788010eb1c51f%2311%232:Switch/actions",
    brightnessEndpoint:
      "/api/bosch/rs/gdm/devices/mprm.osgi.device/remote.manager.controlled/components/mprm.osgi.fi.com.prosyst.mbs.services.da.items.TransitionActuator/da:item:ZigBee:001788010eb1c51f%2311%233:TransitionActuator/actions/start",
    colorTempEndpoint:
      "/api/bosch/rs/gdm/devices/mprm.osgi.device/remote.manager.controlled/components/mprm.osgi.fi.com.prosyst.mbs.services.da.items.TransitionActuator/da:item:ZigBee:001788010eb1c51f%2311%235:TransitionActuator/actions/start",
  },*/
  {
    id: "humidity-sensor-1",
    name: "Humidity Sensor",
    type: "sensor",
    status: "offline",
    location: "Lab – Zone A",
    description: "Environmental humidity monitoring sensor",
    apiPath: "",
  },
  {
    id: "motion-sensor-1",
    name: "Motion Detector",
    type: "sensor",
    status: "offline",
    location: "Lab – Entrance",
    description: "PIR motion detection sensor at lab entrance",
    apiPath: "",
  },
  {
    id: "smart-plug-1",
    name: "Smart Plug",
    type: "switch",
    status: "offline",
    location: "Lab – Zone C",
    description: "Controllable smart power plug",
    apiPath: "",
  },
  {
    id: "smart-bulb-1",
    name: "Zigbee Bulb",
    type: "bulb",
    status: "online",
    location: "Lab – Zone B",
    description: "Smart RGB bulb with brightness and color temperature control",
    apiPath:
      "/api/bosch/rs/gdm/devices/mprm.osgi.device/remote.manager.controlled/components/mprm.osgi.fi.com.prosyst.mbs.services.da.items.Switch/da:item:ZigBee:001788010eb1c51f%2311%232:Switch/actions",
    actionsPath: "/api/bosch/rs/gdm/devices/mprm.osgi.device/remote.manager.controlled/components/mprm.osgi.fi.com.prosyst.mbs.services.da.items.Switch/da:item:ZigBee:001788010eb1c51f%2311%232:Switch/actions",
    brightnessEndpoint:
      "/api/bosch/rs/gdm/devices/mprm.osgi.device/remote.manager.controlled/components/mprm.osgi.fi.com.prosyst.mbs.services.da.items.TransitionActuator/da:item:ZigBee:001788010eb1c51f%2311%233:TransitionActuator/actions/start",
    colorTempEndpoint:
      "/api/bosch/rs/gdm/devices/mprm.osgi.device/remote.manager.controlled/components/mprm.osgi.fi.com.prosyst.mbs.services.da.items.TransitionActuator/da:item:ZigBee:001788010eb1c51f%2311%235:TransitionActuator/actions/start",
  },
  {
    id: "security-cam-1",
    name: "Bosch AUTODOME Camera",
    type: "camera",
    status: "online",
    location: "Lab – Entrance",
    description: "HD security camera with PTZ control",
    apiPath: "",
    streamUrl: "https://DUMMYURL/DUMMYPATH",
    controlEndpoint: "/api/bosch/camera/ptz",
  },
];
