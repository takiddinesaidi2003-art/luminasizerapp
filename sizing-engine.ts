// Core logic for Solar PV calculations
import { z } from "zod";

// ─────────────────── السوق الجزائري ──────────────────────────────────
export const ALGERIAN_MARKET_COMPONENTS = {
  panels: [
    { brand: "Condor",      model: "CON-450W",         wattage: 450, vmp: 41.5, imp: 10.84, voc: 49.3, isc: 11.6  },
    { brand: "Condor",      model: "CON-550W",         wattage: 550, vmp: 41.9, imp: 13.13, voc: 49.8, isc: 13.9  },
    { brand: "Condor",      model: "CON-600W",         wattage: 600, vmp: 42.4, imp: 14.15, voc: 50.3, isc: 14.9  },
    { brand: "Aures Solar", model: "AS-400W",          wattage: 400, vmp: 40.1, imp:  9.98, voc: 48.5, isc: 10.5  },
    { brand: "Aures Solar", model: "AS-500W",          wattage: 500, vmp: 42.5, imp: 11.76, voc: 50.2, isc: 12.4  },
    { brand: "Aures Solar", model: "AS-545W",          wattage: 545, vmp: 41.8, imp: 13.04, voc: 49.9, isc: 13.8  },
    { brand: "Jinko Solar", model: "Tiger Pro 540W",   wattage: 540, vmp: 41.6, imp: 12.98, voc: 49.5, isc: 13.8  },
    { brand: "Jinko Solar", model: "Tiger Neo 580W",   wattage: 580, vmp: 42.1, imp: 13.78, voc: 50.1, isc: 14.6  },
    { brand: "GreenStar",   model: "GS-400M",          wattage: 400, vmp: 40.0, imp:  9.97, voc: 47.8, isc: 10.4  },
    { brand: "GreenStar",   model: "GS-500M",          wattage: 500, vmp: 41.5, imp: 12.05, voc: 49.1, isc: 12.8  },
  ],
  inverters: [
    { brand: "Growatt",      model: "SPF 5000 ES",         type: "Off-Grid/Hybrid", powerW: 5000,  efficiency: 93,   volt: 48  },
    { brand: "Growatt",      model: "SPF 3500 ES",         type: "Off-Grid",        powerW: 3500,  efficiency: 93,   volt: 48  },
    { brand: "Growatt",      model: "MIN 6000 TL-X",       type: "On-Grid",         powerW: 6000,  efficiency: 98.0, volt: 230 },
    { brand: "Solis",        model: "S5-GR1P5K",           type: "On-Grid",         powerW: 5000,  efficiency: 97.7, volt: 230 },
    { brand: "Solis",        model: "S6-GR1P3K",           type: "On-Grid",         powerW: 3000,  efficiency: 97.0, volt: 230 },
    { brand: "Solis",        model: "RHI-3K-48ES",         type: "Hybrid",          powerW: 3000,  efficiency: 97.7, volt: 48  },
    { brand: "Must",         model: "PV18-3024 VPM",       type: "Off-Grid",        powerW: 3000,  efficiency: 90,   volt: 24  },
    { brand: "Must",         model: "PV18-5248 PRO",       type: "Hybrid",          powerW: 5200,  efficiency: 93,   volt: 48  },
    { brand: "Victron",      model: "MultiPlus-II 48/5000",type: "Hybrid",          powerW: 4000,  efficiency: 95,   volt: 48  },
    { brand: "Condor",       model: "CINV-3000",           type: "Off-Grid",        powerW: 3000,  efficiency: 92,   volt: 24  },
    { brand: "Condor",       model: "CINV-5000",           type: "Hybrid",          powerW: 5000,  efficiency: 93,   volt: 48  },
    { brand: "Aures Solar",  model: "INV-AS-3K",           type: "Off-Grid",        powerW: 3000,  efficiency: 90,   volt: 24  },
    { brand: "Aures Solar",  model: "INV-AS-5K",           type: "Hybrid",          powerW: 5000,  efficiency: 94,   volt: 48  },
  ],
  regulators: [
    { brand: "Victron", model: "SmartSolar MPPT 100/30",   currentA: 30,  maxVoc: 100 },
    { brand: "Victron", model: "SmartSolar MPPT 150/70",   currentA: 70,  maxVoc: 150 },
    { brand: "Victron", model: "SmartSolar MPPT 250/100",  currentA: 100, maxVoc: 250 },
    { brand: "EPEVER",  model: "Tracer 4210AN",            currentA: 40,  maxVoc: 100 },
    { brand: "EPEVER",  model: "Tracer 10415AN",           currentA: 100, maxVoc: 150 },
    { brand: "SRNE",    model: "MC2420N10",                currentA: 20,  maxVoc: 100 },
    { brand: "SRNE",    model: "ML2440",                   currentA: 40,  maxVoc: 100 },
    { brand: "SRNE",    model: "ML4860",                   currentA: 60,  maxVoc: 150 },
    { brand: "Must",    model: "PC18-6015F",               currentA: 60,  maxVoc: 150 },
    { brand: "Must",    model: "PC18-8015F",               currentA: 80,  maxVoc: 150 },
  ],
};

// ─────────────────── السوق الدولي ────────────────────────────────────
export const INTERNATIONAL_MARKET_COMPONENTS = {
  panels: [
    { brand: "LONGi",           model: "LR5-72HIH-555M",     wattage: 555, vmp: 41.95, imp: 13.23, voc: 49.75, isc: 14.03 },
    { brand: "LONGi",           model: "Hi-MO6 610W",        wattage: 610, vmp: 43.1,  imp: 14.15, voc: 51.2,  isc: 14.97 },
    { brand: "JA Solar",        model: "JAM72D40-570/MB",    wattage: 570, vmp: 41.8,  imp: 13.63, voc: 49.8,  isc: 14.5  },
    { brand: "JA Solar",        model: "JAM54D40-440/MB",    wattage: 440, vmp: 36.4,  imp: 12.10, voc: 43.5,  isc: 12.83 },
    { brand: "Canadian Solar",  model: "CS6R-440MS",         wattage: 440, vmp: 41.8,  imp: 10.53, voc: 50.1,  isc: 11.2  },
    { brand: "Canadian Solar",  model: "CS6W-545MS",         wattage: 545, vmp: 41.4,  imp: 13.18, voc: 49.3,  isc: 13.97 },
    { brand: "Trina Solar",     model: "TSM-550DE21",        wattage: 550, vmp: 41.6,  imp: 13.22, voc: 49.8,  isc: 14.02 },
    { brand: "Trina Solar",     model: "NEG21C.20-590W",     wattage: 590, vmp: 43.4,  imp: 13.60, voc: 52.0,  isc: 14.42 },
    { brand: "REC Group",       model: "REC400AA",           wattage: 400, vmp: 34.2,  imp: 11.72, voc: 41.5,  isc: 12.3  },
    { brand: "REC Group",       model: "REC450AA Pure-R",    wattage: 450, vmp: 37.1,  imp: 12.14, voc: 44.9,  isc: 12.87 },
    { brand: "Q.CELLS",         model: "Q.PEAK DUO-G11+ 400",wattage: 400, vmp: 34.06, imp: 11.74, voc: 41.29, isc: 12.4  },
    { brand: "Q.CELLS",         model: "Q.TRON M-G2+ 430W", wattage: 430, vmp: 35.9,  imp: 11.98, voc: 43.3,  isc: 12.71 },
    { brand: "Jinko Solar",     model: "Tiger Neo 570W N",   wattage: 570, vmp: 42.10, imp: 13.54, voc: 51.00, isc: 14.38 },
    { brand: "Risen Energy",    model: "RSM40-8-410M",       wattage: 410, vmp: 34.0,  imp: 12.06, voc: 41.4,  isc: 12.78 },
    { brand: "Risen Energy",    model: "RSM150-8-500M",      wattage: 500, vmp: 41.7,  imp: 11.99, voc: 49.9,  isc: 12.72 },
    { brand: "SunPower",        model: "SPR-MAX3-400",       wattage: 400, vmp: 67.0,  imp:  5.97, voc: 80.1,  isc:  6.27 },
    { brand: "Solarwatt",       model: "Panel vision M 375W",wattage: 375, vmp: 33.5,  imp: 11.20, voc: 40.9,  isc: 11.88 },
    { brand: "Meyer Burger",    model: "White 390W",         wattage: 390, vmp: 34.7,  imp: 11.26, voc: 42.1,  isc: 11.97 },
    { brand: "Hyundai",         model: "HiE-S550VG",         wattage: 550, vmp: 41.9,  imp: 13.11, voc: 50.0,  isc: 13.9  },
    { brand: "BYD",             model: "BYD P6C-36-550W",   wattage: 550, vmp: 41.6,  imp: 13.22, voc: 49.9,  isc: 14.01 },
  ],
  inverters: [
    // On-Grid
    { brand: "SMA",              model: "Sunny Boy 5.0",        type: "On-Grid",         powerW: 5000,  efficiency: 98.1, volt: 230 },
    { brand: "SMA",              model: "Sunny Tripower 10.0",  type: "On-Grid",         powerW: 10000, efficiency: 98.4, volt: 230 },
    { brand: "Fronius",          model: "Primo 5.0-1",          type: "On-Grid",         powerW: 5000,  efficiency: 98.1, volt: 230 },
    { brand: "Fronius",          model: "Symo 10.0-3-M",       type: "On-Grid",         powerW: 10000, efficiency: 98.0, volt: 230 },
    { brand: "Huawei",           model: "SUN2000-5KTL-L1",     type: "On-Grid",         powerW: 5000,  efficiency: 98.6, volt: 230 },
    { brand: "ABB / Fimer",      model: "PVI-3.0-TL-OUTD",    type: "On-Grid",         powerW: 3000,  efficiency: 97.2, volt: 230 },
    { brand: "Sungrow",          model: "SG5.0RS",             type: "On-Grid",         powerW: 5000,  efficiency: 98.4, volt: 230 },
    { brand: "GoodWe",           model: "GW3000-NS",           type: "On-Grid",         powerW: 3000,  efficiency: 97.8, volt: 230 },
    { brand: "SolarEdge",        model: "SE5000H-RWS",         type: "On-Grid",         powerW: 5000,  efficiency: 99.2, volt: 230 },
    { brand: "Enphase",          model: "IQ8+ Micro",          type: "On-Grid",         powerW: 295,   efficiency: 97.0, volt: 230 },
    // Hybrid
    { brand: "Huawei",           model: "SUN2000-5KTL-M2",    type: "Hybrid",          powerW: 5000,  efficiency: 98.6, volt: 230 },
    { brand: "GoodWe",           model: "GW5K-ET",             type: "Hybrid",          powerW: 5000,  efficiency: 98.0, volt: 48  },
    { brand: "Sungrow",          model: "SH5.0RS",             type: "Hybrid",          powerW: 5000,  efficiency: 98.4, volt: 48  },
    { brand: "Sungrow",          model: "SH10.0RT",            type: "Hybrid",          powerW: 10000, efficiency: 98.6, volt: 48  },
    { brand: "Deye",             model: "SUN-6K-SG05LP1-EU",  type: "Hybrid",          powerW: 6000,  efficiency: 97.7, volt: 48  },
    { brand: "Deye",             model: "SUN-12K-SG04LP3-EU", type: "Hybrid",          powerW: 12000, efficiency: 97.5, volt: 48  },
    { brand: "SMA",              model: "Sunny Island 6.0H",  type: "Off-Grid/Hybrid", powerW: 6000,  efficiency: 96.0, volt: 48  },
    { brand: "Victron",          model: "Quattro 48/5000",     type: "Off-Grid/Hybrid", powerW: 5000,  efficiency: 96.0, volt: 48  },
    { brand: "Schneider",        model: "XW+ 6848NA",          type: "Off-Grid/Hybrid", powerW: 6800,  efficiency: 95.0, volt: 48  },
    { brand: "Sofar Solar",      model: "HYD 6KTL-3PH",       type: "Hybrid",          powerW: 6000,  efficiency: 98.2, volt: 48  },
    { brand: "Sol-Ark",          model: "Sol-Ark 12K",         type: "Off-Grid/Hybrid", powerW: 12000, efficiency: 97.5, volt: 48  },
    // Off-Grid
    { brand: "Victron",          model: "MultiPlus-II 24/3000",type: "Off-Grid",        powerW: 3000,  efficiency: 96.0, volt: 24  },
    { brand: "Victron",          model: "MultiPlus-II 48/10000",type: "Off-Grid/Hybrid",powerW: 10000, efficiency: 96.0, volt: 48  },
    { brand: "Outback Power",    model: "RADIAN GS8048A",     type: "Off-Grid/Hybrid", powerW: 8000,  efficiency: 96.0, volt: 48  },
    { brand: "Studer",           model: "XTM 3500-24",        type: "Off-Grid",        powerW: 3500,  efficiency: 95.5, volt: 24  },
  ],
  regulators: [
    { brand: "Victron",       model: "SmartSolar MPPT 75/15",      currentA: 15,  maxVoc: 75  },
    { brand: "Victron",       model: "SmartSolar MPPT 100/50",     currentA: 50,  maxVoc: 100 },
    { brand: "Victron",       model: "SmartSolar MPPT 150/45-MC4", currentA: 45,  maxVoc: 150 },
    { brand: "Victron",       model: "SmartSolar MPPT 150/60",     currentA: 60,  maxVoc: 150 },
    { brand: "Victron",       model: "SmartSolar MPPT 150/85",     currentA: 85,  maxVoc: 150 },
    { brand: "Victron",       model: "SmartSolar MPPT 250/60",     currentA: 60,  maxVoc: 250 },
    { brand: "Victron",       model: "SmartSolar MPPT 250/85",     currentA: 85,  maxVoc: 250 },
    { brand: "Victron",       model: "BlueSolar MPPT 150/100",     currentA: 100, maxVoc: 150 },
    { brand: "Renogy",        model: "Rover 60A MPPT",             currentA: 60,  maxVoc: 100 },
    { brand: "Renogy",        model: "Rover 100A MPPT",            currentA: 100, maxVoc: 200 },
    { brand: "Morningstar",   model: "TriStar MPPT 45A",           currentA: 45,  maxVoc: 150 },
    { brand: "Morningstar",   model: "TriStar MPPT 60A",           currentA: 60,  maxVoc: 150 },
    { brand: "Outback Power", model: "FLEXmax 60",                 currentA: 60,  maxVoc: 150 },
    { brand: "Outback Power", model: "FLEXmax 80",                 currentA: 80,  maxVoc: 150 },
    { brand: "Midnite Solar", model: "Classic 150",                currentA: 79,  maxVoc: 150 },
    { brand: "Midnite Solar", model: "Classic 200",                currentA: 79,  maxVoc: 200 },
    { brand: "MPPSOLAR",      model: "PIP-4048MS MPPT",            currentA: 80,  maxVoc: 500 },
    { brand: "Studer",        model: "VarioTrack VT-65",           currentA: 65,  maxVoc: 150 },
  ],
};

// ─────────────────── توربينات الرياح ──────────────────────────────────
export const WIND_TURBINES = [
  { brand: "Generic",        model: "Custom Turbine", ratedKW: 0,     cutInMs: 3.0, ratedMs: 12.0, cutOutMs: 25, rotorDm: 0 },
  { brand: "Superwind",      model: "350W",           ratedKW: 0.35,  cutInMs: 2.5, ratedMs: 12.5, cutOutMs: 60, rotorDm: 1.07 },
  { brand: "Air X",          model: "Land 400W",      ratedKW: 0.4,   cutInMs: 3.0, ratedMs: 12.0, cutOutMs: 60, rotorDm: 1.15 },
  { brand: "Rutland",        model: "1200 (1.2 kW)",  ratedKW: 1.2,   cutInMs: 3.5, ratedMs: 12.0, cutOutMs: 60, rotorDm: 1.84 },
  { brand: "Bergey",         model: "XL.1 (1 kW)",   ratedKW: 1.0,   cutInMs: 2.5, ratedMs: 12.0, cutOutMs: 60, rotorDm: 2.5  },
  { brand: "Windspot",       model: "3.5 kW",         ratedKW: 3.5,   cutInMs: 2.5, ratedMs: 11.0, cutOutMs: 25, rotorDm: 5.2  },
  { brand: "Windspot",       model: "7.5 kW",         ratedKW: 7.5,   cutInMs: 2.5, ratedMs: 11.0, cutOutMs: 25, rotorDm: 7.2  },
  { brand: "Bergey",         model: "Excel 10 (10 kW)",ratedKW: 10,   cutInMs: 2.5, ratedMs: 12.0, cutOutMs: 60, rotorDm: 7.0  },
  { brand: "Bergey",         model: "Excel 15 (15 kW)",ratedKW: 15,   cutInMs: 2.5, ratedMs: 12.0, cutOutMs: 60, rotorDm: 9.1  },
  { brand: "Northern Power", model: "NPS 60C (60 kW)",ratedKW: 60,   cutInMs: 3.0, ratedMs: 12.0, cutOutMs: 25, rotorDm: 20.0 },
  { brand: "Enercon",        model: "E-33 (330 kW)",  ratedKW: 330,   cutInMs: 2.0, ratedMs: 13.0, cutOutMs: 28, rotorDm: 33.4 },
  { brand: "Enercon",        model: "E-53 (800 kW)",  ratedKW: 800,   cutInMs: 2.0, ratedMs: 13.0, cutOutMs: 28, rotorDm: 52.9 },
];

// ─────────────────── مولدات الديزل ──────────────────────────────────
export const DIESEL_GENERATORS = [
  { brand: "Grupel",       model: "GP11S (11 kVA)",    powerKW: 9,   powerKVA: 11,  fuelLph: 2.5,  fuelTankL: 60  },
  { brand: "Grupel",       model: "GP30S (30 kVA)",    powerKW: 24,  powerKVA: 30,  fuelLph: 6.5,  fuelTankL: 120 },
  { brand: "Cummins",      model: "C20D5e (20 kVA)",   powerKW: 16,  powerKVA: 20,  fuelLph: 4.1,  fuelTankL: 100 },
  { brand: "Cummins",      model: "C55D5e (55 kVA)",   powerKW: 44,  powerKVA: 55,  fuelLph: 11.1, fuelTankL: 200 },
  { brand: "Perkins",      model: "30 kVA",             powerKW: 24,  powerKVA: 30,  fuelLph: 6.3,  fuelTankL: 120 },
  { brand: "Perkins",      model: "50 kVA",             powerKW: 40,  powerKVA: 50,  fuelLph: 10.4, fuelTankL: 200 },
  { brand: "Caterpillar",  model: "DE22E2 (22 kW)",    powerKW: 22,  powerKVA: 22,  fuelLph: 5.5,  fuelTankL: 100 },
  { brand: "Caterpillar",  model: "DE50E2 (50 kW)",    powerKW: 50,  powerKVA: 50,  fuelLph: 12.3, fuelTankL: 200 },
  { brand: "Olympian",     model: "GEP44-1 (44 kVA)",  powerKW: 35,  powerKVA: 44,  fuelLph: 9.0,  fuelTankL: 150 },
  { brand: "Olympian",     model: "GEP100-1 (100 kVA)",powerKW: 80,  powerKVA: 100, fuelLph: 20.5, fuelTankL: 300 },
];

// --- Input Schemas ---

export const loadItemSchema = z.object({
  name: z.string().min(1, "Required"),
  power: z.coerce.number().min(1),
  quantity: z.coerce.number().min(1),
  hours: z.coerce.number().min(0.1).max(24),
});

export const baseInputsSchema = z.object({
  panelWattage: z.coerce.number().min(50).max(1000).default(450),
  panelVmp: z.coerce.number().min(12).max(100).default(41.5),
  panelImp: z.coerce.number().min(1).max(30).default(10.8),
  panelVoc: z.coerce.number().min(12).max(120).default(49.5),
  peakSunHours: z.coerce.number().min(1).max(10).default(5),
  systemLosses: z.coerce.number().min(0).max(50).default(15),
});

export const onGridInputsSchema = baseInputsSchema.extend({
  monthlyConsumption: z.coerce.number().min(1).default(500),
  peakPowerKw: z.coerce.number().min(0).optional(),
  distPanelToInverter: z.coerce.number().min(1).default(20),
  distInverterToMainPanel: z.coerce.number().min(1).default(5),
});

export const offGridInputsSchema = baseInputsSchema.extend({
  loads: z.array(loadItemSchema).default([]),
  daysOfAutonomy: z.coerce.number().min(1).max(10).default(2),
  batteryDOD: z.coerce.number().min(10).max(100).default(80),
  batteryUnitVoltage: z.coerce.number().default(12),
  batteryUnitCapacityAh: z.coerce.number().default(200),
  inverterEfficiency: z.coerce.number().min(50).max(100).default(95),
  hasDcDcConverter: z.boolean().default(false),
  distPanelToRegulator: z.coerce.number().min(1).default(10),
  distRegulatorToBattery: z.coerce.number().min(1).default(2),
  distBatteryToInverter: z.coerce.number().min(0.5).default(1),
  distInverterToLoad: z.coerce.number().min(1).default(10),
  distBatteryToDcDc: z.coerce.number().min(0.5).default(1),
});

export const hybridInputsSchema = offGridInputsSchema.extend({
  gridVoltage:        z.enum(["230", "400"]).default("230"),
  gridFrequency:      z.enum(["50", "60"]).default("50"),
  gridExportEnabled:  z.boolean().default(true),
  gridExportLimitW:   z.coerce.number().min(0).default(0),
  gridCharging:       z.boolean().default(false),
  priorityMode:       z.enum(["solar-first", "grid-first", "battery-first"]).default("solar-first"),
  // Wind energy
  windEnabled:        z.boolean().default(false),
  windTurbineModel:   z.string().optional().default(""),
  windTurbineCustomKw: z.coerce.number().min(0.01).max(10000).optional().default(1),
  windSpeedMps:       z.coerce.number().min(0).max(30).default(5),
  windTurbineCount:   z.coerce.number().min(1).max(50).default(1),
  // Diesel backup
  dieselEnabled:      z.boolean().default(false),
  dieselGeneratorModel: z.string().optional().default(""),
  dieselHoursPerDay:  z.coerce.number().min(0).max(24).default(4),
  dieselGeneratorCount: z.coerce.number().min(1).max(20).default(1),
});

export const pumpingInputsSchema = baseInputsSchema.extend({
  dailyWaterM3: z.coerce.number().min(1).default(20),
  totalHeadM: z.coerce.number().min(1).default(50),
  pumpEfficiency: z.coerce.number().min(10).max(100).default(60),
});

// --- Calculation Functions ---

function calculateStrings(totalPanels: number, vmp: number, voc: number) {
  // Simple heuristic for common inverters (e.g., 150V-450V MPPT)
  const maxV = 450;
  const panelsInSeries = Math.min(totalPanels, Math.floor(maxV / voc));
  const strings = Math.ceil(totalPanels / (panelsInSeries || 1));
  return { series: panelsInSeries, parallel: strings };
}

export function calculateOffGrid(inputs: any) {
  // Calculate Load
  const dailyLoadWh = inputs.loads.reduce((acc: number, l: any) => acc + (l.power * l.quantity * l.hours), 0);
  const peakLoadW = inputs.loads.reduce((acc: number, l: any) => acc + (l.power * l.quantity), 0);

  const dailyEnergyReqWh = dailyLoadWh / (inputs.inverterEfficiency / 100) / (1 - inputs.systemLosses / 100);
  
  // Peak Power (Wp) calculation based on daily energy and PSH
  const peakPowerWp = dailyEnergyReqWh / inputs.peakSunHours;
  const numberOfPanels = Math.ceil(peakPowerWp / inputs.panelWattage);
  
  // System Voltage (Vsys) auto-selection based on Peak Power (Wp)
  // Rule: < 500Wp -> 12V, 500-2000Wp -> 24V, 2000-10000Wp -> 48V, > 10000Wp -> 96V
  let systemVoltage = 12;
  if (peakPowerWp > 10000) systemVoltage = 96;
  else if (peakPowerWp > 2000) systemVoltage = 48;
  else if (peakPowerWp >= 500) systemVoltage = 24;

  const strings = calculateStrings(numberOfPanels, inputs.panelVmp, inputs.panelVoc);

  // Battery sizing
  const totalAhReq = (dailyLoadWh * inputs.daysOfAutonomy) / (systemVoltage * (inputs.batteryDOD / 100));
  const batteriesInSeries = systemVoltage / inputs.batteryUnitVoltage;
  const batteriesInParallel = Math.ceil(totalAhReq / inputs.batteryUnitCapacityAh);
  const totalBatteries = batteriesInSeries * batteriesInParallel;

  // MPPT and Inverter
  const mpptRatingA = (peakPowerWp / systemVoltage) * 1.25;
  const inverterCapacityW = peakLoadW * 1.25;

  // Recommended Components from Market
  const recommendedInverters = ALGERIAN_MARKET_COMPONENTS.inverters
    .filter(inv => inv.powerW >= inverterCapacityW && (inv.type.includes("Off-Grid") || inv.type.includes("Hybrid")))
    .slice(0, 10);

  const recommendedRegulators = ALGERIAN_MARKET_COMPONENTS.regulators
    .filter(reg => reg.currentA >= mpptRatingA)
    .slice(0, 10);

  // Cable Sizing
  const rho = 0.0172; // Copper resistivity
  const vDropMax = 0.03; // 3% max voltage drop

  // 1. DC Cable: Panels to Regulator
  const vDc1 = inputs.panelVmp * strings.series;
  const iDc1 = inputs.panelImp * strings.parallel;
  const sDc1 = (2 * inputs.distPanelToRegulator * iDc1 * rho) / (vDc1 * vDropMax);
  const dcCablePanelToReg = [4, 6, 10, 16, 25, 35, 50, 70].find(s => s >= sDc1) || 70;

  // 2. DC Cable: Regulator to Battery
  const iDc2 = mpptRatingA;
  const sDc2 = (2 * inputs.distRegulatorToBattery * iDc2 * rho) / (systemVoltage * vDropMax);
  const dcCableRegToBatt = [4, 6, 10, 16, 25, 35, 50, 70].find(s => s >= sDc2) || 70;

  // 3. DC Cable: Battery to Inverter
  const iDc3 = peakLoadW / systemVoltage;
  const sDc3 = (2 * inputs.distBatteryToInverter * iDc3 * rho) / (systemVoltage * vDropMax);
  const dcCableBattToInv = [6, 10, 16, 25, 35, 50, 70, 95].find(s => s >= sDc3) || 95;

  // 4. AC Cable: Inverter to Load
  const iAc = inverterCapacityW / 230;
  const sAc = (2 * inputs.distInverterToLoad * iAc * rho) / (230 * vDropMax);
  const acCableInvToLoad = [1.5, 2.5, 4, 6, 10, 16].find(s => s >= sAc) || 16;

  // 5. DC Cable: Battery to DC-DC (Optional)
  let dcCableBattToDcDc = null;
  const dcDcConverter = inputs.hasDcDcConverter ? {
    ratingA: Math.ceil(peakLoadW / systemVoltage * 1.25),
    voltage: `${systemVoltage}V to 12V/24V`
  } : null;

  if (dcDcConverter) {
    const sDc5 = (2 * inputs.distBatteryToDcDc * dcDcConverter.ratingA * rho) / (systemVoltage * vDropMax);
    dcCableBattToDcDc = [2.5, 4, 6, 10, 16].find(s => s >= sDc5) || 16;
  }

  return {
    peakPowerWp: Number(peakPowerWp.toFixed(0)),
    systemCapacitykW: Number(((numberOfPanels * inputs.panelWattage) / 1000).toFixed(2)),
    numberOfPanels,
    panelsInSeries: strings.series,
    panelsInParallel: strings.parallel,
    systemVoltage,
    batteryCapacityAh: Number(totalAhReq.toFixed(0)),
    totalBatteries,
    batteriesInSeries,
    batteriesInParallel,
    inverterCapacityW: Number(inverterCapacityW.toFixed(0)),
    mpptRatingA: Number(mpptRatingA.toFixed(0)),
    recommendedInverters,
    recommendedRegulators,
    dcDcConverter,
    cables: {
      panelToReg: dcCablePanelToReg,
      regToBatt: dcCableRegToBatt,
      battToInv: dcCableBattToInv,
      invToLoad: acCableInvToLoad,
      battToDcDc: dcCableBattToDcDc
    }
  };
}

export function calculateOnGrid(inputs: any) {
  const dailyEnergyReqkWh = (inputs.monthlyConsumption / 30) / (1 - inputs.systemLosses / 100);
  // Use directly entered peak power if provided, else derive from monthly consumption
  const peakPowerWp = (inputs.peakPowerKw && inputs.peakPowerKw > 0)
    ? inputs.peakPowerKw * 1000
    : (dailyEnergyReqkWh * 1000) / inputs.peakSunHours;
  const numberOfPanels = Math.ceil(peakPowerWp / inputs.panelWattage);
  const actualCapacitykW = (numberOfPanels * inputs.panelWattage) / 1000;
  
  const strings = calculateStrings(numberOfPanels, inputs.panelVmp, inputs.panelVoc);

  const rho = 0.0172;
  const vDropMax = 0.03;

  // 1. DC Cable: Panel to Inverter
  const vDc = inputs.panelVmp * strings.series;
  const iDc = inputs.panelImp * strings.parallel;
  const sDc = (2 * inputs.distPanelToInverter * iDc * rho) / (vDc * vDropMax);
  const dcCableSize = [4, 6, 10, 16, 25].find(s => s >= sDc) || 25;

  // 2. AC Cable: Inverter to Main Panel
  const iAc = (actualCapacitykW * 1000) / 230;
  const sAc = (2 * inputs.distInverterToMainPanel * iAc * rho) / (230 * vDropMax);
  const acCableSize = [2.5, 4, 6, 10, 16, 25].find(s => s >= sAc) || 25;

  const recommendedInverters = ALGERIAN_MARKET_COMPONENTS.inverters
    .filter(inv => inv.powerW >= actualCapacitykW * 1000 && inv.type.includes("On-Grid"))
    .slice(0, 10);

  return {
    peakPowerWp: Number(peakPowerWp.toFixed(0)),
    systemCapacitykW: Number(actualCapacitykW.toFixed(2)),
    numberOfPanels,
    panelsInSeries: strings.series,
    panelsInParallel: strings.parallel,
    inverterCapacitykW: Number((actualCapacitykW * 1.1).toFixed(2)),
    dailyProductionkWh: Number((actualCapacitykW * inputs.peakSunHours * (1 - inputs.systemLosses / 100)).toFixed(2)),
    recommendedInverters,
    cables: {
      panelToInv: dcCableSize,
      invToMain: acCableSize
    }
  };
}

export function calculatePumping(inputs: any) {
  const dailyEnergyReqWh = (inputs.dailyWaterM3 * inputs.totalHeadM * 2.725) / (inputs.pumpEfficiency / 100);
  const peakPowerWp = (dailyEnergyReqWh / inputs.peakSunHours) / (1 - inputs.systemLosses / 100);
  const numberOfPanels = Math.ceil(peakPowerWp / inputs.panelWattage);
  const pumpPowerW = (inputs.dailyWaterM3 / inputs.peakSunHours) * inputs.totalHeadM * 2.725 / (inputs.pumpEfficiency / 100);
  const strings = calculateStrings(numberOfPanels, inputs.panelVmp, inputs.panelVoc);
  const mpptRatingA = (peakPowerWp / (inputs.panelVmp * strings.series)) * 1.25;

  return {
    peakPowerWp: Number(peakPowerWp.toFixed(0)),
    systemCapacitykW: Number(((numberOfPanels * inputs.panelWattage) / 1000).toFixed(2)),
    numberOfPanels,
    panelsInSeries: strings.series,
    panelsInParallel: strings.parallel,
    pumpPowerW: Number(pumpPowerW.toFixed(0)),
    pumpPowerHp: Number((pumpPowerW / 746).toFixed(2)),
    mpptRatingA: Number(mpptRatingA.toFixed(0)),
    totalHeadM: inputs.totalHeadM,
    dailyWaterM3: inputs.dailyWaterM3,
  };
}

// Wind turbine power at a given wind speed using simplified power curve
function windPowerAtSpeed(turbine: typeof WIND_TURBINES[0], windSpeedMs: number): number {
  const { ratedKW, cutInMs, ratedMs, cutOutMs } = turbine;
  if (windSpeedMs < cutInMs || windSpeedMs > cutOutMs) return 0;
  if (windSpeedMs >= ratedMs) return ratedKW * 1000;
  const frac = Math.pow((windSpeedMs - cutInMs) / (ratedMs - cutInMs), 3);
  return ratedKW * 1000 * frac;
}

export function calculateHybrid(inputs: any) {
  // Wind energy contribution (daily Wh)
  let windDailyWh = 0;
  let windConfig = null;
  if (inputs.windEnabled && inputs.windTurbineModel) {
    const isGeneric = inputs.windTurbineModel === "Generic||Custom Turbine";
    const turbine = isGeneric
      ? { brand: "Generic", model: "Custom Turbine", ratedKW: inputs.windTurbineCustomKw || 1, cutInMs: 3.0, ratedMs: 12.0, cutOutMs: 25, rotorDm: 0 }
      : WIND_TURBINES.find(t => `${t.brand}||${t.model}` === inputs.windTurbineModel);
    if (turbine) {
      const powerW = isGeneric
        ? (inputs.windTurbineCustomKw || 1) * 1000
        : windPowerAtSpeed(turbine, inputs.windSpeedMps || 5);
      const count = inputs.windTurbineCount || 1;
      windDailyWh = powerW * 24 * count;
      windConfig = {
        model: isGeneric ? `Generic (${inputs.windTurbineCustomKw || 1} kW)` : `${turbine.brand} ${turbine.model}`,
        count,
        ratedKW: turbine.ratedKW,
        windSpeedMs: inputs.windSpeedMps,
        actualPowerW: Math.round(powerW),
        dailyKwh: Number((windDailyWh / 1000).toFixed(2)),
      };
    }
  }

  // Diesel energy contribution (daily Wh)
  let dieselDailyWh = 0;
  let dieselConfig = null;
  if (inputs.dieselEnabled && inputs.dieselGeneratorModel) {
    const gen = DIESEL_GENERATORS.find(g => `${g.brand}||${g.model}` === inputs.dieselGeneratorModel);
    if (gen) {
      const count = inputs.dieselGeneratorCount || 1;
      const hours = inputs.dieselHoursPerDay || 4;
      dieselDailyWh = gen.powerKW * 1000 * hours * count;
      dieselConfig = {
        model: `${gen.brand} ${gen.model}`,
        count,
        powerKW: gen.powerKW,
        hoursPerDay: hours,
        fuelLph: gen.fuelLph,
        dailyFuelL: Number((gen.fuelLph * hours * count).toFixed(1)),
        dailyKwh: Number((dieselDailyWh / 1000).toFixed(2)),
      };
    }
  }

  // Reduce solar requirement by wind + diesel contribution
  const altEnergyWh = windDailyWh + dieselDailyWh;
  const adjustedInputs = { ...inputs };
  if (altEnergyWh > 0 && inputs.loads?.length > 0) {
    const totalLoadWh = inputs.loads.reduce((acc: number, l: any) => acc + (l.power * l.quantity * l.hours), 0);
    const solarFraction = Math.max(0, (totalLoadWh - altEnergyWh / (inputs.inverterEfficiency / 100 || 0.95)) / totalLoadWh);
    adjustedInputs.loads = inputs.loads.map((l: any) => ({
      ...l,
      hours: l.hours * solarFraction,
    }));
  }

  const base = calculateOffGrid(adjustedInputs);

  return {
    ...base,
    windConfig,
    dieselConfig,
    gridConfig: {
      voltage:       inputs.gridVoltage      ?? "230",
      frequency:     inputs.gridFrequency    ?? "50",
      exportEnabled: inputs.gridExportEnabled ?? true,
      exportLimitW:  inputs.gridExportLimitW  ?? 0,
      gridCharging:  inputs.gridCharging     ?? false,
      priorityMode:  inputs.priorityMode     ?? "solar-first",
    }
  };
}

export function calculateSystem(type: string, inputs: any) {
  switch (type) {
    case 'on-grid':  return calculateOnGrid(inputs);
    case 'off-grid': return calculateOffGrid(inputs);
    case 'hybrid':   return calculateHybrid(inputs);
    case 'pumping':  return calculatePumping(inputs);
    default: throw new Error("Unknown system type");
  }
}
