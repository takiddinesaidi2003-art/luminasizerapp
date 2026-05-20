import { db } from "./db";
import { projects } from "@shared/schema";

async function seed() {
  const existing = await db.select().from(projects);
  if (existing.length === 0) {
    await db.insert(projects).values([
      {
        name: "Home Off-Grid System",
        systemType: "off-grid",
        inputs: { dailyDemand: 5000, autonomyDays: 2, systemVoltage: 48 },
        results: { panels: 12, batteryCapacity: 400, inverter: 3000 }
      },
      {
        name: "Farm Irrigation Pumping",
        systemType: "pumping",
        inputs: { pumpPower: 1500, dailyWater: 50, head: 30 },
        results: { panels: 8, mppt: 30 }
      }
    ]);
    console.log("Seeded default projects");
  } else {
    console.log("Database already seeded");
  }
}
seed().catch(console.error).finally(() => process.exit(0));