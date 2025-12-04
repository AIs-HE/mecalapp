/* calculations.ts - electrical calculation helpers (ampacity/resistance/Xl etc.) */

type CommonInputsState = {
    installationType: 'Conduit' | 'Exposed'
    tensionKV: number
    powerFactor: number
    conductorMaterial: 'Cu' | 'Al'
    conductorTemperature: string
    ambientTemperature: number
    conductorType: string
    conductorsPerConduit: string
    conduitMaterial: 'PVC' | 'Aluminum' | 'Steel'
}

export type EquipmentRow = any

// Lookup tables loaded from `TablasSSAA.csv` (embedded here).
// Grouping factors (NoDiv column) expressed as fraction (percent/100)
const groFacTable: Record<string, number> = {
    '1-3': 1.00,    // 100
    '4-6': 0.80,    // 80
    '7-9': 0.70,    // 70
    '10-20': 0.50,  // 50
    '21-24': 0.45,  // 45
    '25-30': 0.45,  // 45
    '31-40': 0.40,  // 40
    '41-42': 0.35,  // 35
    '43-more': 0.35 // 35 (CSV has "43-más")
}

// Temperature factors table (ambient rows) from CSV. Use `null` for N/A.
const temFacTable: { ambient: number; factors: Record<string, number | null> }[] = [
    { ambient: 10, factors: { '60': 1.29, '75': 1.20, '90': 1.15 } },
    { ambient: 15, factors: { '60': 1.22, '75': 1.15, '90': 1.12 } },
    { ambient: 20, factors: { '60': 1.15, '75': 1.11, '90': 1.08 } },
    { ambient: 25, factors: { '60': 1.08, '75': 1.05, '90': 1.04 } },
    { ambient: 30, factors: { '60': 1.00, '75': 1.00, '90': 1.00 } },
    { ambient: 35, factors: { '60': 0.91, '75': 0.94, '90': 0.96 } },
    { ambient: 40, factors: { '60': 0.82, '75': 0.88, '90': 0.91 } },
    { ambient: 45, factors: { '60': 0.71, '75': 0.82, '90': 0.87 } },
    { ambient: 50, factors: { '60': 0.58, '75': 0.75, '90': 0.82 } },
    { ambient: 55, factors: { '60': 0.41, '75': 0.67, '90': 0.76 } },
    { ambient: 60, factors: { '60': null, '75': 0.58, '90': 0.71 } },
    { ambient: 65, factors: { '60': null, '75': 0.47, '90': 0.65 } },
    { ambient: 70, factors: { '60': null, '75': 0.33, '90': 0.58 } },
    { ambient: 75, factors: { '60': null, '75': null, '90': 0.50 } },
    { ambient: 80, factors: { '60': null, '75': null, '90': 0.41 } },
    { ambient: 85, factors: { '60': null, '75': null, '90': 0.29 } },
]

// Ampacity table taken from the architecture spec (3.3.6 Local Data).
// Keys are the caliber strings exactly as in the CSV (e.g. '1/0').
// Columns include Can*/Lib* ampacities plus Xl and resistance columns.
const ampacityTable: Record<string, Record<string, number | null>> = {
    '16': { CanCu60: null, CanCu75: null, CanCu90: null, CanAl60: null, CanAl75: null, CanAl90: null, LibCu60: null, LibCu75: null, LibCu90: null, LibAl60: null, LibAl75: null, LibAl90: null, XlPVC: null, XlAluminum: null, XlSteel: null, CuPVC: null, CuAluminum: null, CuSteel: null, AlPVC: null, AlAluminum: null, AlSteel: null },
    '14': { CanCu60: 15, CanCu75: 20, CanCu90: 25, CanAl60: null, CanAl75: null, CanAl90: null, LibCu60: 25, LibCu75: 30, LibCu90: 35, LibAl60: null, LibAl75: null, LibAl90: null, XlPVC: 0.19, XlAluminum: 0.19, XlSteel: 0.24, CuPVC: 10.2, CuAluminum: 10.2, CuSteel: 10.2, AlPVC: null, AlAluminum: null, AlSteel: null },
    '12': { CanCu60: 20, CanCu75: 25, CanCu90: 30, CanAl60: 15, CanAl75: 20, CanAl90: 25, LibCu60: 30, LibCu75: 35, LibCu90: 40, LibAl60: 25, LibAl75: 30, LibAl90: 35, XlPVC: 0.177, XlAluminum: 0.177, XlSteel: 0.223, CuPVC: 6.6, CuAluminum: 6.6, CuSteel: 6.6, AlPVC: 10.5, AlAluminum: 10.5, AlSteel: 10.5 },
    '10': { CanCu60: 30, CanCu75: 35, CanCu90: 40, CanAl60: 25, CanAl75: 30, CanAl90: 35, LibCu60: 40, LibCu75: 50, LibCu90: 55, LibAl60: 35, LibAl75: 40, LibAl90: 45, XlPVC: 0.164, XlAluminum: 0.164, XlSteel: 0.207, CuPVC: 3.9, CuAluminum: 3.9, CuSteel: 3.9, AlPVC: 6.6, AlAluminum: 6.6, AlSteel: 6.6 },
    '8': { CanCu60: 40, CanCu75: 50, CanCu90: 55, CanAl60: 35, CanAl75: 40, CanAl90: 45, LibCu60: 60, LibCu75: 70, LibCu90: 80, LibAl60: 45, LibAl75: 55, LibAl90: 60, XlPVC: 0.171, XlAluminum: 0.171, XlSteel: 0.213, CuPVC: 2.56, CuAluminum: 2.56, CuSteel: 2.56, AlPVC: 4.3, AlAluminum: 4.3, AlSteel: 4.3 },
    '6': { CanCu60: 55, CanCu75: 65, CanCu90: 75, CanAl60: 40, CanAl75: 50, CanAl90: 55, LibCu60: 80, LibCu75: 95, LibCu90: 105, LibAl60: 60, LibAl75: 75, LibAl90: 80, XlPVC: 0.167, XlAluminum: 0.167, XlSteel: 0.21, CuPVC: 1.61, CuAluminum: 1.61, CuSteel: 1.61, AlPVC: 2.66, AlAluminum: 2.66, AlSteel: 2.66 },
    '4': { CanCu60: 70, CanCu75: 85, CanCu90: 95, CanAl60: 55, CanAl75: 65, CanAl90: 75, LibCu60: 105, LibCu75: 125, LibCu90: 140, LibAl60: 80, LibAl75: 100, LibAl90: 110, XlPVC: 0.157, XlAluminum: 0.157, XlSteel: 0.197, CuPVC: 1.02, CuAluminum: 1.02, CuSteel: 0.02, AlPVC: 1.67, AlAluminum: 1.67, AlSteel: 1.67 },
    '3': { CanCu60: 85, CanCu75: 100, CanCu90: 115, CanAl60: 65, CanAl75: 75, CanAl90: 85, LibCu60: 120, LibCu75: 145, LibCu90: 165, LibAl60: 95, LibAl75: 115, LibAl90: 130, XlPVC: 0.154, XlAluminum: 0.154, XlSteel: 0.194, CuPVC: 0.82, CuAluminum: 0.82, CuSteel: 0.82, AlPVC: 1.31, AlAluminum: 1.35, AlSteel: 1.31 },
    '2': { CanCu60: 95, CanCu75: 115, CanCu90: 130, CanAl60: 75, CanAl75: 90, CanAl90: 100, LibCu60: 140, LibCu75: 170, LibCu90: 190, LibAl60: 110, LibAl75: 135, LibAl90: 150, XlPVC: 0.148, XlAluminum: 0.148, XlSteel: 0.187, CuPVC: 0.62, CuAluminum: 0.66, CuSteel: 0.66, AlPVC: 1.05, AlAluminum: 1.05, AlSteel: 1.05 },
    '1': { CanCu60: 110, CanCu75: 130, CanCu90: 145, CanAl60: 85, CanAl75: 100, CanAl90: 115, LibCu60: 165, LibCu75: 195, LibCu90: 220, LibAl60: 130, LibAl75: 155, LibAl90: 175, XlPVC: 0.151, XlAluminum: 0.151, XlSteel: 0.187, CuPVC: 0.49, CuAluminum: 0.52, CuSteel: 0.52, AlPVC: 0.82, AlAluminum: 0.85, AlSteel: 0.82 },
    '1/0': { CanCu60: 125, CanCu75: 150, CanCu90: 170, CanAl60: 100, CanAl75: 120, CanAl90: 135, LibCu60: 195, LibCu75: 230, LibCu90: 260, LibAl60: 150, LibAl75: 180, LibAl90: 205, XlPVC: 0.144, XlAluminum: 0.144, XlSteel: 0.18, CuPVC: 0.39, CuAluminum: 0.43, CuSteel: 0.39, AlPVC: 0.66, AlAluminum: 0.69, AlSteel: 0.66 },
    '2/0': { CanCu60: 145, CanCu75: 175, CanCu90: 195, CanAl60: 115, CanAl75: 135, CanAl90: 150, LibCu60: 225, LibCu75: 265, LibCu90: 300, LibAl60: 175, LibAl75: 210, LibAl90: 235, XlPVC: 0.141, XlAluminum: 0.141, XlSteel: 0.177, CuPVC: 0.33, CuAluminum: 0.33, CuSteel: 0.33, AlPVC: 0.52, AlAluminum: 0.52, AlSteel: 0.52 },
    '3/0': { CanCu60: 165, CanCu75: 200, CanCu90: 225, CanAl60: 130, CanAl75: 155, CanAl90: 175, LibCu60: 260, LibCu75: 310, LibCu90: 350, LibAl60: 200, LibAl75: 240, LibAl90: 270, XlPVC: 0.138, XlAluminum: 0.138, XlSteel: 0.171, CuPVC: 0.253, CuAluminum: 0.269, CuSteel: 0.259, AlPVC: 0.43, AlAluminum: 0.43, AlSteel: 0.43 },
    '4/0': { CanCu60: 195, CanCu75: 230, CanCu90: 260, CanAl60: 150, CanAl75: 180, CanAl90: 205, LibCu60: 300, LibCu75: 360, LibCu90: 405, LibAl60: 235, LibAl75: 280, LibAl90: 315, XlPVC: 0.135, XlAluminum: 0.135, XlSteel: 0.167, CuPVC: 0.203, CuAluminum: 0.22, CuSteel: 0.207, AlPVC: 0.33, AlAluminum: 0.36, AlSteel: 0.33 },
    '250': { CanCu60: 215, CanCu75: 255, CanCu90: 290, CanAl60: 170, CanAl75: 205, CanAl90: 230, LibCu60: 340, LibCu75: 405, LibCu90: 455, LibAl60: 265, LibAl75: 315, LibAl90: 355, XlPVC: 0.135, XlAluminum: 0.135, XlSteel: 0.171, CuPVC: 0.171, CuAluminum: 0.187, CuSteel: 0.177, AlPVC: 0.279, AlAluminum: 0.295, AlSteel: 0.282 },
    '300': { CanCu60: 240, CanCu75: 285, CanCu90: 320, CanAl60: 195, CanAl75: 230, CanAl90: 260, LibCu60: 375, LibCu75: 445, LibCu90: 505, LibAl60: 290, LibAl75: 350, LibAl90: 395, XlPVC: 0.135, XlAluminum: 0.135, XlSteel: 0.167, CuPVC: 0.144, CuAluminum: 0.161, CuSteel: 0.148, AlPVC: 0.233, AlAluminum: 0.249, AlSteel: 0.236 },
    '350': { CanCu60: 260, CanCu75: 310, CanCu90: 350, CanAl60: 210, CanAl75: 250, CanAl90: 280, LibCu60: 420, LibCu75: 505, LibCu90: 570, LibAl60: 330, LibAl75: 395, LibAl90: 445, XlPVC: 0.131, XlAluminum: 0.131, XlSteel: 0.164, CuPVC: 0.125, CuAluminum: 0.141, CuSteel: 0.128, AlPVC: 0.2, AlAluminum: 0.217, AlSteel: 0.207 },
    '400': { CanCu60: 280, CanCu75: 335, CanCu90: 380, CanAl60: 225, CanAl75: 270, CanAl90: 305, LibCu60: 455, LibCu75: 545, LibCu90: 615, LibAl60: 355, LibAl75: 425, LibAl90: 480, XlPVC: 0.131, XlAluminum: 0.131, XlSteel: 0.161, CuPVC: 0.108, CuAluminum: 0.125, CuSteel: 0.115, AlPVC: 0.177, AlAluminum: 0.194, AlSteel: 0.18 },
    '500': { CanCu60: 320, CanCu75: 380, CanCu90: 430, CanAl60: 260, CanAl75: 310, CanAl90: 350, LibCu60: 515, LibCu75: 620, LibCu90: 700, LibAl60: 405, LibAl75: 485, LibAl90: 545, XlPVC: 0.128, XlAluminum: 0.128, XlSteel: 0.157, CuPVC: 0.089, CuAluminum: 0.105, CuSteel: 0.095, AlPVC: 0.141, AlAluminum: 0.157, AlSteel: 0.148 },
    '600': { CanCu60: 350, CanCu75: 420, CanCu90: 475, CanAl60: 285, CanAl75: 340, CanAl90: 385, LibCu60: 575, LibCu75: 690, LibCu90: 780, LibAl60: 455, LibAl75: 545, LibAl90: 615, XlPVC: 0.128, XlAluminum: 0.128, XlSteel: 0.157, CuPVC: 0.075, CuAluminum: 0.092, CuSteel: 0.082, AlPVC: 0.118, AlAluminum: 0.135, AlSteel: 0.125 },
    '700': { CanCu60: 385, CanCu75: 460, CanCu90: 520, CanAl60: 315, CanAl75: 375, CanAl90: 425, LibCu60: 630, LibCu75: 755, LibCu90: 850, LibAl60: 500, LibAl75: 595, LibAl90: 670, XlPVC: null, XlAluminum: null, XlSteel: null, CuPVC: null, CuAluminum: null, CuSteel: null, AlPVC: null, AlAluminum: null, AlSteel: null },
    '750': { CanCu60: 400, CanCu75: 475, CanCu90: 535, CanAl60: 320, CanAl75: 385, CanAl90: 435, LibCu60: 655, LibCu75: 785, LibCu90: 885, LibAl60: 515, LibAl75: 620, LibAl90: 700, XlPVC: 0.125, XlAluminum: 0.125, XlSteel: 0.157, CuPVC: 0.062, CuAluminum: 0.079, CuSteel: 0.069, AlPVC: 0.095, AlAluminum: 0.112, AlSteel: 0.102 },
    '800': { CanCu60: 410, CanCu75: 490, CanCu90: 555, CanAl60: 330, CanAl75: 395, CanAl90: 445, LibCu60: 680, LibCu75: 815, LibCu90: 920, LibAl60: 535, LibAl75: 645, LibAl90: 725, XlPVC: 0.121, XlAluminum: 0.121, XlSteel: 0.151, CuPVC: 0.049, CuAluminum: 0.062, CuSteel: 0.059, AlPVC: 0.075, AlAluminum: 0.089, AlSteel: 0.082 },
    '900': { CanCu60: 435, CanCu75: 520, CanCu90: 585, CanAl60: 355, CanAl75: 425, CanAl90: 480, LibCu60: 730, LibCu75: 870, LibCu90: 980, LibAl60: 580, LibAl75: 700, LibAl90: 790, XlPVC: null, XlAluminum: null, XlSteel: null, CuPVC: null, CuAluminum: null, CuSteel: null, AlPVC: null, AlAluminum: null, AlSteel: null },
    '1000': { CanCu60: 455, CanCu75: 545, CanCu90: 615, CanAl60: 375, CanAl75: 445, CanAl90: 500, LibCu60: 780, LibCu75: 935, LibCu90: 1055, LibAl60: 625, LibAl75: 750, LibAl90: 845, XlPVC: null, XlAluminum: null, XlSteel: null, CuPVC: null, CuAluminum: null, CuSteel: null, AlPVC: null, AlAluminum: null, AlSteel: null },
    '1250': { CanCu60: 495, CanCu75: 590, CanCu90: 665, CanAl60: 405, CanAl75: 485, CanAl90: 545, LibCu60: 890, LibCu75: 1065, LibCu90: 1200, LibAl60: 710, LibAl75: 855, LibAl90: 965, XlPVC: null, XlAluminum: null, XlSteel: null, CuPVC: null, CuAluminum: null, CuSteel: null, AlPVC: null, AlAluminum: null, AlSteel: null },
    '1500': { CanCu60: 525, CanCu75: 625, CanCu90: 705, CanAl60: 435, CanAl75: 520, CanAl90: 585, LibCu60: 980, LibCu75: 1175, LibCu90: 1325, LibAl60: 795, LibAl75: 950, LibAl90: 1070, XlPVC: null, XlAluminum: null, XlSteel: null, CuPVC: null, CuAluminum: null, CuSteel: null, AlPVC: null, AlAluminum: null, AlSteel: null },
    '1750': { CanCu60: 545, CanCu75: 650, CanCu90: 735, CanAl60: 455, CanAl75: 545, CanAl90: 615, LibCu60: 1070, LibCu75: 1280, LibCu90: 1445, LibAl60: 875, LibAl75: 1050, LibAl90: 1185, XlPVC: null, XlAluminum: null, XlSteel: null, CuPVC: null, CuAluminum: null, CuSteel: null, AlPVC: null, AlAluminum: null, AlSteel: null },
    '2000': { CanCu60: 555, CanCu75: 665, CanCu90: 750, CanAl60: 470, CanAl75: 560, CanAl90: 630, LibCu60: 1155, LibCu75: 1385, LibCu90: 1560, LibAl60: 960, LibAl75: 1150, LibAl90: 1295, XlPVC: null, XlAluminum: null, XlSteel: null, CuPVC: null, CuAluminum: null, CuSteel: null, AlPVC: null, AlAluminum: null, AlSteel: null },
}

// Export available calibers (AWG/kcmil and numeric sizes) used to populate select lists
export const caliberOptions = [
    '16', '14', '12', '10', '8', '6', '4', '3', '2', '1',
    '1/0', '2/0', '3/0', '4/0', '250', '300', '350', '400', '500', '600', '700', '750', '800', '900', '1000', '1250', '1500', '1750', '2000'
]

// Suggest a caliber based on protectionCurrent and common inputs.
// Returns the lowest caliber (from `caliberOptions` order) whose ampacity
// in the selected column is greater than `protectionCurrent`. Returns empty
// string when no suggestion available.
// caliberFromTable removed to revert POC suggestion helper

function lookupGroupingFac(conductorsPerConduit: string) {
    return groFacTable[conductorsPerConduit] ?? 1.0
}

function lookupTempFac(ambientTemperature: number, conductorTemperature: string) {
    const t = String(conductorTemperature).replace('°C', '')
    // find closest ambient row <= ambientTemperature
    let row = temFacTable.slice().reverse().find(r => ambientTemperature >= r.ambient)
    if (!row) row = temFacTable[0]
    return (row && row.factors && (row.factors as any)[t]) || 1.0
}

function ampacityFromTable(caliber: string, installationType: 'Conduit' | 'Exposed', conductorMaterial: 'Cu' | 'Al', conductorTemperature: string) {
    if (!caliber) return 0
    const row = ampacityTable[String(caliber)]
    if (!row) return 0
    const temp = String(conductorTemperature).replace('°C', '')
    const colPrefix = installationType === 'Conduit' ? 'Can' : 'Lib'
    const mat = conductorMaterial === 'Cu' ? 'Cu' : 'Al'
    const col = `${colPrefix}${mat}${temp}`
    const val = row[col]
    if (val === null || val === undefined) return 0
    return Number(val)
}

export function inductiveReactanceFromTable(caliber: string, conduitMaterial: 'PVC' | 'Aluminum' | 'Steel') {
    if (!caliber) return 0
    const row = ampacityTable[String(caliber)]
    if (!row) return 0
    const key = `Xl${conduitMaterial}`
    const val = (row as any)[key]
    if (val === null || val === undefined) return 0
    return Number(val)
}

export function resistanceFromTable(caliber: string, conductorMaterial: 'Cu' | 'Al', conduitMaterial: 'PVC' | 'Aluminum' | 'Steel') {
    if (!caliber) return 0
    const row = ampacityTable[String(caliber)]
    if (!row) return 0
    const mat = conductorMaterial === 'Cu' ? 'Cu' : 'Al'
    const key = `${mat}${conduitMaterial}`
    const val = (row as any)[key]
    if (val === null || val === undefined) return 0
    return Number(val)
}

export function calculateDemandedPower(installedPower: number, usageFactor: number) {
    return (installedPower || 0) * (usageFactor ?? 1)
}

export function calculateINominalx125(installedPower: number, tensionKV: number, phases: number, niFactor = 1.25) {
    if (!tensionKV || tensionKV === 0) return 0
    if (phases === 1) return (niFactor * (installedPower || 0)) / tensionKV
    return (niFactor * (installedPower || 0)) / (tensionKV * Math.sqrt(3))
}

export function calculateAmpacity(caliber: string, conductorsPerPhase: number, common?: CommonInputsState) {
    const base = common ? ampacityFromTable(caliber, common.installationType, common.conductorMaterial, common.conductorTemperature) : (ampacityFromTable(caliber, 'Conduit', 'Cu', '75°C') || 0)
    return (base || 0) * (conductorsPerPhase || 1)
}

// Suggest the smallest caliber that makes the ICB condition true
export function suggestCaliber(protectionCurrent: number, iNominalx125: number, conductorsPerPhase: number, common?: CommonInputsState) {
    if (!protectionCurrent || protectionCurrent <= 0) return ''
    for (const cal of caliberOptions) {
        const calculatedAmpacity = calculateAmpacity(cal, conductorsPerPhase || 1, common)
        const calculatedAmpacityFac = calculateAmpacityFactored(calculatedAmpacity, common?.ambientTemperature ?? 30, common?.conductorTemperature ?? '75°C', common?.conductorsPerConduit ?? '1-3')
        if (verifyICB(protectionCurrent, iNominalx125, calculatedAmpacityFac)) {
            return cal
        }
    }
    return ''
}

export function calculateAmpacityFactored(calculatedAmpacity: number, ambientTemperature: number, conductorTemperature: string, conductorsPerConduit: string) {
    const tempFac = lookupTempFac(ambientTemperature, conductorTemperature)
    const groupingFac = lookupGroupingFac(conductorsPerConduit)
    return calculatedAmpacity * tempFac * groupingFac
}

export function calculateVoltageDrop(activePower: number, phases: number) {
    if (phases === 1) return activePower * 2
    // For three-phase systems the line voltage drop is sqrt(3) * I * (R cosφ + X sinφ) * L
    // The previous implementation divided by sqrt(3) which produced a value 1/3 of the correct
    // three-phase line-to-line voltage drop. Multiply by sqrt(3) to correct this.
    return activePower * Math.sqrt(3)
}

export function calculateRegulation(voltageDrop: number, tensionKV: number) {
    if (!tensionKV) return 0
    // Return regulation as a percentage (ΔV / V_nominal * 100)
    return (voltageDrop / (tensionKV * 1000)) * 100
}

export function calculateLossesPerc(losses: number, powerFactor: number, installedPower: number) {
    if (!powerFactor || !installedPower) return 0
    // Return losses as a percentage of delivered power (percent = 100 * losses / (PF * P_installed[kW]))
    return (losses / (powerFactor * installedPower * 1000)) * 100
}

export function calculateActivePower(iNominalx125: number, niFactor: number, conductorLength: number, resistance: number, inductiveReactance: number, powerFactor: number) {
    const inom = (iNominalx125 || 0) / (niFactor || 1)
    const cosphi = Math.cos(Math.acos(powerFactor || 1))
    const sinphi = Math.sin(Math.acos(powerFactor || 1))
    return (inom * conductorLength || 0) * ((resistance || 0) * cosphi + (inductiveReactance || 0) * sinphi)
}

export function calculateLosses(iNominalx125: number, niFactor: number, resistance: number, conductorLength: number, phases: number) {
    const base = Math.pow(((iNominalx125 || 0) / (niFactor || 1)), 2) * (resistance || 0) * (conductorLength || 0)
    if (phases === 1) return 2 * base
    return 3 * base
}

export function verifyICB(protectionCurrent: number, iNominalx125: number, calculatedAmpacityFac: number) {
    return (protectionCurrent || 0) > (iNominalx125 || 0) && (calculatedAmpacityFac || 0) > (protectionCurrent || 0)
}

export function verifyREG(deltaVPerc: number, regulation: number) {
    // Reverted to original comparison logic
    return (deltaVPerc || 0) > (regulation || 0)
}

export function verifyLOS(percLoss: number, losses: number) {
    // Reverted to original comparison logic
    return (percLoss || 0) > (losses || 0)
}

// High-level helper to compute calculated fields for an equipment row
export function computeCalculatedFields(eq: EquipmentRow, common: CommonInputsState, niFactor = 1.25, deltaV = 5, percLoss = 3.88) {
    const installedPower = Number(eq.installedPower || 0)
    const usageFactor = Number(eq.usageFactor ?? 1)
    const phases = Number(eq.phases || 3)
    const conductorLength = Number(eq.conductorLength || 0)
    const resistance = Number(eq.resistance || 0)
    const inductiveReactance = Number(eq.inductiveReactance || 0)
    const protectionCurrent = Number(eq.protectionCurrent || 0)
    const conductorsPerPhase = Number(eq.conductorsPerPhase || 1)

    const demandedPower = calculateDemandedPower(installedPower, usageFactor)
    const iNominalx125 = calculateINominalx125(installedPower, common.tensionKV, phases, niFactor)
    const caliberNorm = String(eq.caliber || '') === '--' ? '' : String(eq.caliber || '')
    const calculatedAmpacity = calculateAmpacity(caliberNorm, conductorsPerPhase, common)
    const calculatedAmpacityFac = calculateAmpacityFactored(calculatedAmpacity, common.ambientTemperature, common.conductorTemperature, common.conductorsPerConduit)

    const resistanceVal = resistance || resistanceFromTable(caliberNorm, common.conductorMaterial, common.conduitMaterial)
    const inductiveReactanceVal = inductiveReactance || inductiveReactanceFromTable(caliberNorm, common.conduitMaterial)
    const activePower = calculateActivePower(iNominalx125, niFactor, conductorLength, resistanceVal, inductiveReactanceVal, common.powerFactor)
    const voltageDrop = calculateVoltageDrop(activePower, phases)
    const regulation = calculateRegulation(voltageDrop, common.tensionKV)
    const losses = calculateLosses(iNominalx125, niFactor, resistanceVal, conductorLength, phases)
    const lossesPerc = calculateLossesPerc(losses, common.powerFactor, installedPower)

    const ICBBool = verifyICB(protectionCurrent, iNominalx125, calculatedAmpacityFac)
    const REGBool = verifyREG(deltaV, regulation)
    const LOSBool = verifyLOS(percLoss, lossesPerc)

    return {
        ...eq,
        demandedPower,
        iNominalx125,
        calculatedAmpacity,
        calculatedAmpacityFac,
        regulation,
        lossesPerc,
        ICBBool,
        REGBool,
        LOSBool,
    }
}
