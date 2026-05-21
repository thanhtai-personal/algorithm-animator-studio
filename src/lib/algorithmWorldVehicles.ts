export type AlgorithmWorldVehicleId = "bolt" | "comet" | "rally" | "truck" | "neon" | "shadow" | "buggy" | "kart" | "van" | "drone";
export type AlgorithmWorldVehicleShape = "sport" | "formula" | "rally" | "truck" | "buggy" | "kart" | "van" | "drone";

export type AlgorithmWorldVehiclePreset = {
  id: AlgorithmWorldVehicleId;
  name: string;
  color: string;
  shape: AlgorithmWorldVehicleShape;
};

export const WORLD_VEHICLES: AlgorithmWorldVehiclePreset[] = [
  { id: "bolt", name: "Bolt GT", color: "#34d399", shape: "sport" },
  { id: "comet", name: "Comet F1", color: "#facc15", shape: "formula" },
  { id: "rally", name: "Rally Blue", color: "#38bdf8", shape: "rally" },
  { id: "truck", name: "Cargo Red", color: "#fb7185", shape: "truck" },
  { id: "neon", name: "Neon Violet", color: "#a78bfa", shape: "sport" },
  { id: "shadow", name: "Shadow Lime", color: "#bef264", shape: "formula" },
  { id: "buggy", name: "Desert Buggy", color: "#fb923c", shape: "buggy" },
  { id: "kart", name: "Pixel Kart", color: "#60a5fa", shape: "kart" },
  { id: "van", name: "Maze Van", color: "#f472b6", shape: "van" },
  { id: "drone", name: "Scout Drone", color: "#2dd4bf", shape: "drone" },
];

export function getWorldVehicle(id: AlgorithmWorldVehicleId | string | undefined) {
  return WORLD_VEHICLES.find((vehicle) => vehicle.id === id) ?? WORLD_VEHICLES[0];
}
