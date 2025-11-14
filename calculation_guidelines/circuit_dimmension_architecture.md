# Circuit Dimmension Calculation Page Architecture Specification

## Overview
This document provides a comprehensive specification for recreating the electrical calculation page (SSAA module) of the MeCal system. The page is designed for electrical engineers to input circuit data, perform NTC-2050/RETIE calculations, and visualize results in an intuitive interface.

## Circuit Dimmension memory - Main page Layout

A Modal UI with all the project information as header and then a series of Yes/No questions with a toggle button with default option "No". The toggle buttons give bolleans their values. Each boolean activates tabs or sections in the Secondary page layout.
From question #5 on are to configure specific numeric factors with inputboxes, these values will be saved into variables to be used in the Secondary page layout.

## Questions & Boolean:

1) Does the SLD includes Non Esential panel? & NonEseBool
2) Does the SLD includes DC loads? & DCBool
3) Does the SLD includes Transfer Panel? & TranBool
4) Does the SLD includes A Generator Set? & GenBool

## Questions & Variables:

5) What is the correction factor for Nominal Current? & niFactor (placeholder 1.25) 
6) What is the aceptable %ΔV [%]? & deltaV (placeholder 5)
7) What is the aceptable % of Losses [%]? & percLoss (placeholder 3.88)

---

## Circuit Dimmension memory - Secondary page Layout

The Secondary page uses a 4-container layout system with distinct color coding and specific purposes:

```
┌─────────────────────────────────────────────────┬─────────────────┐
│   DARK BLUE                                     │   EMERALD GREEN │
│   (Header)                                      │   (Project Info)│
├─────────────────────────────────────────────────┤                 │
│   PURPLE (Tabs & Common Inputs &                │                 │
│   Equipment Table Gallery)                      │                 │
├───────────────────────────────────────────────────────────────────┤
│   WHITE (Draft Controls)                                          │
└───────────────────────────────────────────────────────────────────┘
```

---

## 1. DARK BLUE HEADER CONTAINER

**Component:** Header navigation bar
**Purpose:** System navigation and user context
**Background Color:** Dark blue/navy (`bg-slate-800`)

### Content Displayed:
- **System Logo/Brand:** "MeCalApp" application name
- **User Information:** 
  - Current user name
  - User role (Admin/Director/Employee)
- **Navigation Elements:**
  - Back to Circuit Dimmension memory - Main page button
  - Back to projects button
  - Close session button

- **Page Title:** "CDM - Circuit Dimmension memory"

### Functionality:
- User logout capability
- Navigation to Projects page and Circuit Dimmension memory - Main page 
- Display current authentication state

---

## 2. EMERALD GREEN CONTAINER (Project Info Panel)

**Component:** `ProjectInfoPanel.tsx`
**Purpose:** Display current project context and metadata
**Background Color:** Emerald green (`bg-emerald-600`)
**Position:** Right side, fixed width
**Height:** Full height to match main content area

### Content Displayed:

#### Project Information Fields:
1. **Cost Center** 🏢
   - **Type:** String
   - **Value:** Project ID (e.g., "HE-0001")
   - **Source:** `projectInfo.costCenter`

2. **Project Name** 📋
   - **Type:** String
   - **Value:** Full project name
   - **Source:** `projectInfo.projectName`

3. **Client** 🏭
   - **Type:** String
   - **Value:** Client company name
   - **Source:** `projectInfo.client`

4. **Version** 🔄
   - **Type:** Number with highlight
   - **Value:** Export version number
   - **Display:** "V{number}" with yellow ring highlight
   - **Source:** `projectInfo.version`


#### Additional Elements:
- **Company Logo Area:** Company logo display
- **AI Integration Placeholder:** Future AI assistant area (dashed border)

### Functionality:
- **Collapsible Interface:** Toggle button to expand/collapse content of Project Information Fields
- **Responsive Layout:** AI Integration Placeholder adjusts height based on collapse state
- **Auto-updating:** Reflects real-time project changes

---

## 3. PURPLE CONTAINER (Tabs & Common Inputs)

**Component:** `TabsContainer.tsx`
**Purpose:** Tab navigation and shared calculation parameters
**Background Color:** Purple (`bg-purple-500`)

### 3.1 Tab Navigation Bar

#### Available Tabs:
1. **Esential Loads** (`esential_loads`) Always visible
2. **Non Esential loads** (`non_esential_loads`) Visible if NonEseBool is true 
3. **Transfer Panels & Outputs** (`transfer_outputs`) Visible if TranBool is true
4. **DC Panel** (`dc_panel`) Visible if DCBool is true
5. **Transformers & Generators** (`transformers_&_generators`) Always visible. If GenBool is true the Generator Gallery will be visible.

#### Tab Behavior:
- **Active Tab:** Red background (`bg-red-500`), white text
- **Inactive Tabs:** Purple background (`bg-purple-400`), light text
- **Hover Effect:** Darker purple on hover
- **Responsive:** Horizontal scroll on small screens

### 3.2 Common Inputs Area (RED CONTAINER)

**Background Color:** Red (`bg-red-500`)
**Purpose:** Shared electrical parameters for all circuits in the active tab
**Collapsible:** Yes, per-tab collapse state

#### Header:
- **Title:** "📊 Common data - {Tab Label}"
- **Toggle Button:** Expand/collapse arrow icon
- **Color:** White text on red background

#### Common Input Fields (for Esential Loads, Non Esential loads and Transfer Panels & Outputs tabs):

1. **Type of instalation** (`instalationType`)
   - **Type:** Select dropdown
   - **Options:** "Conduit" | "Exposed"
   - **Default:** "Conduit"

2. **Tension (kV)** (`tensionKV`)
   - **Type:** Number input
   - **Format:** Decimal up to 3 places
   - **Default:** "0.480"
   - **Validation:** Must be > 0

3. **Power Factor** (`powerFactor`)
   - **Type:** Number input
   - **Format:** Decimal 0-1, up to 2 places
   - **Default:** "1.00"
   - **Validation:** Must be between 0 and 1

4. **Conductor Material** (`conductorMaterial`)
   - **Type:** Select dropdown
   - **Options:** "Cu" (Copper) | "Al" (Aluminum)
   - **Default:** "Cu"

5. **Conductor Temperature** (`conductorTemperature`)
   - **Type:** Select dropdown
   - **Options:** "60°C" | "75°C" | "90°C"
   - **Default:** "75°C"

6. **Ambient Temperature** (`ambientTemperature`)
   - **Type:** Number input
   - **Format:** Integer -20 to 100
   - **Default:** "30"
   - **Unit:** °C

7. **Conductor Type** (`conductorType`)
   - **Type:** Select dropdown
   - **Options:** Dynamic based on installation/material/temperature
   - **Source:** NTC-2050/RETIE conductor table
   - **Auto-update:** Changes when conditions change (1, 4, & 5 - previous inputs provide different array options - Ref Ampacity tables NPFA)

8. **Number of Conductors per Conduit** (`conductorsPerConduit`)
   - **Type:** Select dropdown
   - **Options:** "1-3" | "4-6" | "7-9" | "10-20" | "21-24" | "25-30" | "31-40" | "41-42" | "43-more"
   - **Default:** "1-3"

9. **Conduit Material** (`conduitMaterial`)
   - **Type:** Select dropdown
   - **Options:** "PVC" | "Aluminum" | "Steel"
   - **Default:** "PVC"

#### Special Case - DC Panel Inputs:
When `activeTab === 'dc_panel'`, different inputs are shown:

1. **Type of instalation** (`dcinstalationType`)
   - **Type:** Select dropdown
   - **Options:** "Conduit" | "Exposed"
   - **Default:** "Conduit"

2. **Nominal Tension (V)** (`busVoltageV`)
   - **Type:** Number input
   - **Format:** Integer > 0
   - **Unit:** Volts
   - **Example:** 48

3. **Conductor Material** (`dcconductorMaterial`)
   - **Type:** Select dropdown
   - **Options:** "Cu" (Copper) | "Al" (Aluminum)
   - **Default:** "Cu"
   
4. **Conductor Temperature** (`dcconductorTemperature`)
   - **Type:** Select dropdown
   - **Options:** "60°C" | "75°C" | "90°C"
   - **Default:** "75°C"

5. **Ambient Temperature** (`dcambientTemperature`)
   - **Type:** Number input
   - **Format:** Integer -20 to 100
   - **Default:** "30"
   - **Unit:** °C

6. **Number of Conductors per Conduit** (`dcconductorsPerConduit`)
   - **Type:** Select dropdown
   - **Options:** "1-3" | "4-6" | "7-9" | "10-20" | "21-24" | "25-30" | "31-40" | "41-42" | "43-more"
   - **Default:** "1-3"

7. **Conductor Type** (`dcconductorType`)
   - **Type:** Select dropdown
   - **Options:** Dynamic based on installation/material/temperature
   - **Source:** NTC-2050/RETIE conductor table
   - **Auto-update:** Changes when conditions change (1, 4, & 5 - previous inputs provide different array options - Ref Ampacity tables NPFA)

#### Special Case - Transformers & Generators Inputs:
When `activeTab === 'transformers_&_generators'`, no Common Inputs Area (RED CONTAINER) visible

### Functionality:
- **Real-time Validation:** Input validation with error messages
- **Dynamic Dependencies:** Conductor type updates based on conditions
- **Auto-save:** Changes automatically saved to draft state
- **Collapse State:** Per-tab memory of expanded/collapsed state

---

## 3.3 GRAY CONTAINER (Equipment Table Gallery)

**Component:** `EquipmentTableGallery.tsx`
**Purpose:** Display and edit individual circuit/equipment data
**Background Color:** Gray (`bg-gray-700`)

### 3.3.1 Header Section

#### Title Bar:
- **Text:** "⚡ Circuits ({count})" where count is the number of equipments
- **Color:** White text
- **Add Button:** "➕ Add equipment" (green background, hover effects)

#### Validation Warning (when applicable):
- **Background:** Yellow warning (`bg-yellow-100`)
- **Icon:** ⚠️ warning symbol
- **Message:** Displays common inputs validation issues
- **Visibility:** Only shown when common inputs are incomplete/invalid

### 3.3.2 Equipment Table

#### Table Structure:
- **Header:** Dark gray (`bg-gray-800`), sticky positioning
- **Rows:** Alternating backgrounds, hover effects
- **Scroll:** Both horizontal and vertical scrolling
- **Responsive:** Minimum widths for each column

#### Column Configuration (for Esential Loads and Non Esential loads tabs):

| # | Column | Field | Type | Width | Editable | Description | Format | 
|---|--------|-------|------|-------|----------|-------------|--------|
| 1 | Out | `output` | Text | 50px | ✅ | Circuit ID | Alphanumeric |
| 2 | Name | `name` | Text | 120px | ✅ | Circuit name | Alphanumeric |
| 3 | Pha.Qty. | `phases` | Select | 60px | ✅ | 1 or 3 phases | Default "3" |
| 4 | I.P.[kVA] | `installedPower` | Number | 80px | ✅ | Installed power | Decimal up to 2 places > 0|
| 5 | U.F. | `usageFactor` | Number | 60px | ✅ | Utilization factor | Decimal up to 2 places, between 0 and 1  |
| 6 | Dem.P. | `demandedPowerCal` | Number | 80px | ❌ | Calculated demand | Decimal up to 2 places |
| 7 | Inx1.25 | `iNominalx125` | Number | 80px | ❌ | Nominal current × 1.25 | Decimal up to 2 places |
| 8 | Prot.I | `protectionCurrent` | Number | 70px | ✅ | Protection current | Integer > 0 |
| 9 | CxPha | `conductorsPerPhase` | Number | 60px | ✅ | Conductors per phase | Integer > 0 |
| 10 | Cal | `caliber` | Select | 70px | ✅ | Wire calibers | Column AWGKcmil row values in ampacityTable - 3.3.6 Local Data |
| 11 | xN | `calculatedAmpacity` | Number | 60px | ❌ | Calculated ampacity | Integer |
| 12 | xN.Fac | `calculatedAmpacityFac` | Number | 80px | ❌ | Factored current capacity | Integer |
| 13 | L[km] | `conductorLenght` | Number | 70px | ✅ | Conductor length | Decimal up to 2 places > 0 |
| 14 | R[Ω/km] | `resistance` | Number | 80px | ✅ | Resistance | Decimal up to 3 places > 0|
| 15 | Xl[Ω/km] | `inductiveReactance` | Number | 80px | ✅ | Inductive reactance | Decimal up to 3 places > 0|
| 16 | REG | `regulation` | Number | 50px | ❌ | Regulation verification | % up to 2 places|
| 17 | LOS | `lossesPerc` | Number | 50px | ❌ | Loss verification | % up to 2 places|
| 18 | Del | - | Button | 50px | ❌ | Delete button (🗑️) | N/A|

#### Columns Function Calculations:
variables are calculated from functions in 5.3 Calculation Engine - Electrical Calculations

- **demandedPowerCal:** calculateDemandedPower() 
- **iNominalx125:** calculateINominalx125()
- **calculatedAmpacity:** calculateAmpacity()
- **calculatedAmpacityFac:** calculateAmpacityFactored()
- **regulation:** calculateRegulation()
- **lossesPerc:** calculateLossesPerc()

#### Column Configuration (for Transfer Panels & Outputs tab):

| # | Column | Field | Type | Width | Editable | Description | Format | 
|---|--------|-------|------|-------|----------|-------------|--------|
| 1 | Out | `output` | Text | 50px | ✅ | Circuit ID | Alphanumeric |
| 2 | Name | `name` | Text | 120px | ✅ | Circuit name | Alphanumeric |
| 3 | Pha.Qty. | `phases` | Select | 60px | ✅ | 1 or 3 phases | Default "3" |
| 4 | I.P.[kVA] | `installedPower` | Number | 80px | ✅ | Installed power | Decimal up to 2 places > 0|
| 5 | U.F. | `usageFactor` | Number | 60px | ❌ | Calculated Utilization factor | Decimal up to 2 places, between 0 and 1  |
| 6 | Dem.P. | `demandedPower` | Select | 80px | ✅ | ["Ese", "NonEse", "Ese & NonEse"] | When selected it displays the sumation of all Esential, Non Esential or Esential and Non Esential loads with format: Decimal up to 2 places |
| 7 | Inx1.25 | `iNominalx125` | Number | 80px | ❌ | Nominal current × 1.25 | Decimal up to 2 places |
| 8 | Prot.I | `protectionCurrent` | Number | 70px | ✅ | Protection current | Integer > 0 |
| 9 | CxPha | `conductorsPerPhase` | Number | 60px | ✅ | Conductors per phase | Integer > 0 |
| 10 | Cal | `caliber` | Select | 70px | ✅ | Wire calibers | Column AWGKcmil row values in ampacityTable - 3.3.6 Local Data |
| 11 | xN | `calculatedAmpacity` | Number | 60px | ❌ | Calculated ampacity | Integer > 0 |
| 12 | xN.Fac | `calculatedAmpacityFac` | Number | 80px | ❌ | Factored current capacity | |
| 13 | L[km] | `conductorLenght` | Number | 70px | ✅ | Conductor length | Decimal up to 2 places > 0 |
| 14 | R[Ω/km] | `resistance` | Number | 80px | ✅ | Resistance | Decimal up to 3 places > 0|
| 15 | Xl[Ω/km] | `inductiveReactance` | Number | 80px | ✅ | Inductive reactance | Decimal up to 3 places > 0|
| 16 | REG | `regulation` | Number | 50px | ❌ | Regulation verification | % up to 2 places |
| 17 | LOS | `lossesPerc` | Number | 50px | ❌ | Loss verification | % up to 2 places|
| 18 | Del | - | Button | 50px | ❌ | Delete button (🗑️) | N/A|

#### Columns Calculations:
- **usageFactor:** calculateUsageFactor()
- **demandedPower:** calculateSumationDemandedPower()
- **iNominalx125:** calculateINominalx125()
- **calculatedAmpacity:** calculateAmpacity()
- **calculatedAmpacityFac:** calculateAmpacityFactored()
- **regulation:** calculateRegulation()
- **lossesPerc:** calculateLossesPerc()

#### Column Configuration (for DC Panel Tab):

| # | Column | Field | Type | Width | Editable | Description | Format |
|---|--------|-------|------|-------|----------|-------------|--------|
| 1 | Out | `dcoutput` | Text | 50px | ✅ | Circuit ID | Alphanumeric |
| 2 | Name | `dcname` | Text | 120px | ✅ | Circuit name | Alphanumeric |
| 3 | T. Charge | `chargeType` | Select | 60px | ✅ | ["Con", "Mom"] | Default "Con" |
| 4 | Equ.Qty. | `equipmentNumber` | Number | 70px | ✅ | Equipment quantity | Integer > 0  |
| 5 | U.I.P. | `unitInstalledPower` | Number | 90px | ✅ | Unit installed power | Integer > 0  |
| 6 | Dem.F. | `demandedPowerFactor` | Number | 60px | ✅ | Demand factor | Decimal up to 2 places, between 0 and 1 |
| 7 | Nom.CxF | `InFac` | Number | 90px | ❌ | Corrected nominal current | Decimal up to 2 places > 0 |
| 8 | Prot.I | `dcprotectionCurrent` | Number | 70px | ✅ | Protection current | Integer > 0 |
| 9 | CxPha | `dcconductorsPerPhase` | Number | 60px | ✅ | Conductors per phase | Integer > 0 |
| 10 | Cal | `dccaliber` | Select | 60px | ✅ | Wire caliber | Column AWGKcmil row values in ampacityTable - 3.3.6 Local Data |
| 11 | xN | `dccalculatedAmpacity` | Number | 60px | ❌ | Calculated ampacity | Integer |
| 12 | L[km] | `dcconductorLenght` | Number | 70px | ✅ | Conductor length | Decimal up to 2 places > 0 |
| 13 | R[Ω/km] | `dcresistance` | Number | 80px | ✅ | Resistance |  Decimal up to 3 places > 0 |
| 14 | REG | `dcregulation` | Percent | 60px | ❌ | Regulation verification | % up to 2 places |
| 15 | LOS | `dclossesPerc` | Number | 60px | ❌ | Losses verification | % up to 2 places |
| 16 | Del | - | Button | 50px | ❌ | Delete button (🗑️) | N/A |

#### Columns Calculations:
will be specified in the future.

#### Column Configuration (for Transformers & Generators Tab):
will be specified in the future.

### 3.3.3 Calculations:

#### Update:
- **Trigger:** Any modified input will trigger calculation and update calculated values
- **Effect:** Activates the Row Color Coding and Special Caliber Column in 3.3.4 Editing system

#### Parallel Calculations:
- **ampacityValue:** ampacityFromTable()
- **temperatureFac:** tempFacFromTable()
- **groupingFac:** groupingFacFromTable()
- **activePower:** calculateActivePower()
- **voltageDrop:** calculateVoltageDrop()
- **Losses:** calculateLosses()
- **ICBBool:** verifyICB()
- **REGBool:** verifyREG()
- **LOSBool:** verifyLOS()

#### Placeholder Calculations:
- **Trigger:** Any Inline Editing described in 3.3.4 Editing System - Inline Editing.
- **caliberPlaHol:** Placeholder text for caliber not selected rows = caliberFromTable() 
- **ResistancePlaHol:** Placeholder text for resistance empty rows = resistanceFromTable()
- **inductiveReactancePlaHol:** Placeholder text for inductiveReactance empty rows = inductiveReactanceFromTable()

### 3.3.4 Editing System

#### Inline Editing:
- **Trigger:** Double-click on editable cells
- **Visual:** Blue background (`bg-blue-100`), border highlight
- **Input Types:** Text, number, select dropdown based on field
- **Validation:** Real-time validation with error messages
- **Save:** Enter key or click outside
- **Cancel:** Escape key

#### Editable Fields Logic:
- **Text Fields:** `output`, `name`
- **Number Fields:** `installedPower`, `usageFactor`, `protectionCurrent`, etc.
- **Select Fields:** `phases` (1/3), `caliber` (wire calibers), `chargeType` (Con/Mom)
- **Calculated Fields:** Read-only, display with blue background

#### Row Color Coding:
- **Green (`bg-green-100`):** All verifications passed (ICBBool, REGBool, LOSBool = true)
- **Red (`bg-red-50`):** Any verification failed (ICBBool, REGBool, or PERBool = false)
- **White (`bg-white`):** Default state, no verification results
- **Honeydew (`bg-green-50`):** Currently selected/editing row

#### Special Caliber Column:
- **Color Coding:** 
  - **Green:** ICBBool = true
  - **Red:** ICBBool = false

#### Special LOS Column:
- **Color Coding:** 
  - **Green:** LOSBool = true
  - **Red:** LOSBool = false

#### Special REG Column:
- **Color Coding:** 
  - **Green:** REGBool = true
  - **Red:** REGBool = false

### 3.3.5 Equipment Management

#### Add Equipment:
- **Button:** "➕ Agregar Equipo" (top-right)
- **Action:** Creates new equipment with default values
- **Auto-assignment:** Generates unique ID and output

#### Delete Equipment:
- **Trigger:** Click 🗑️ button in last column
- **Confirmation:** Modal dialog "¿De verdad quieres borrar este circuito?"
- **Options:** "No" (cancel) / "Yes" (confirm delete)

#### Empty State:
- **Message:** "No hay equipos agregados. Haz clic en 'Agregar Equipo' para comenzar."
- **Span:** Full table width
- **Style:** Centered, gray text

### 3.3.6 Local Data:
CSV data that will be save in a JSON file locally for reference

- **groFacTable:**
Value obtained from the NoDiv column. In the future we will differentiate between NoDiv and Div with a new component.

Conductores por Canalización,NoDiv,Div
1-3,100,N/A
4-6,80,80
7-9,70,70
10-20,50,70
21-24,45,70
25-30,45,60
31-40,40,60
41-42,35,60
43-más,35,50

- **temFacTable:**
Value obtained using the ambientTemperature and conductorTemperature.

Temperatura Ambiente,60,75,90
10,1.29,1.2,1.15
15,1.22,1.15,1.12
20,1.15,1.11,1.08
25,1.08,1.05,1.04
30,1,1,1
35,0.91,0.94,0.96
40,0.82,0.88,0.91
45,0.71,0.82,0.87
50,0.58,0.75,0.82
55,0.41,0.67,0.76
60,N/A,0.58,0.71
65,N/A,0.47,0.65
70,N/A,0.33,0.58
75,N/A,N/A,0.5
80,N/A,N/A,0.41
85,N/A,N/A,0.29

- **ampacityTable:**
   - **ampacityValue:** Use the header to obtain the corresponding value using the caliber selected. "Can" for Conduit, "Lib" for Exposed; "Cu" or "Al for the conductorMaterial and the next two digit number for the conductorTemperature. i.e.: CanCu75 is for instalationType = Conduit, conductorMaterial = Cu and conductorTemperature = 75. 
   - **Resistance:** The headers of the last six columns are used with the choosen caliber to obtain the resistance value. Using the conductorMaterial and conduitMaterial. i.e.: CuSteel means conductorMaterial = Cu and conductorMaterial = Steel.
   - **inductiveReactance:** The columns with headers starting in Xl are for the placeholder values of inductiveReactance in the Equipment Table using caliber and conduitMaterial. 

AWGKcmil,mm2,CanCu60,CanCu75,CanCu90,CanAl60,CanAl75,CanAl90,LibCu60,LibCu75,LibCu90,LibAl60,LibAl75,LibAl90,XlPVC,XlAluminum,XlSteel,CuPVC,CuAluminum,CuSteel,AlPVC,AlAluminum,AlSteel
16,1.31,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A
14,2.08,15,20,25,N/A,N/A,N/A,25,30,35,N/A,N/A,N/A,0.19,0.19,0.24,10.2,10.2,10.2,N/A,N/A,N/A
12,3.3,20,25,30,15,20,25,30,35,40,25,30,35,0.177,0.177,0.223,6.6,6.6,6.6,10.5,10.5,10.5
10,5.25,30,35,40,25,30,35,40,50,55,35,40,45,0.164,0.164,0.207,3.9,3.9,3.9,6.6,6.6,6.6
8,8.36,40,50,55,35,40,45,60,70,80,45,55,60,0.171,0.171,0.213,2.56,2.56,2.56,4.3,4.3,4.3
6,13.29,55,65,75,40,50,55,80,95,105,60,75,80,0.167,0.167,0.21,1.61,1.61,1.61,2.66,2.66,2.66
4,21.14,70,85,95,55,65,75,105,125,140,80,100,110,0.157,0.157,0.197,1.02,1.02,0.02,1.67,1.67,1.67
3,26.66,85,100,115,65,75,85,120,145,165,95,115,130,0.154,0.154,0.194,0.82,0.82,0.82,1.31,1.35,1.31
2,33.62,95,115,130,75,90,100,140,170,190,110,135,150,0.148,0.148,0.187,0.62,0.66,0.66,1.05,1.05,1.05
1,42.2,110,130,145,85,100,115,165,195,220,130,155,175,0.151,0.151,0.187,0.49,0.52,0.52,0.82,0.85,0.82
1/0,53.5,125,150,170,100,120,135,195,230,260,150,180,205,0.144,0.144,0.18,0.39,0.43,0.39,0.66,0.69,0.66
2/0,67.44,145,175,195,115,135,150,225,265,300,175,210,235,0.141,0.141,0.177,0.33,0.33,0.33,0.52,0.52,0.52
3/0,85.02,165,200,225,130,155,175,260,310,350,200,240,270,0.138,0.138,0.171,0.253,0.269,0.259,0.43,0.43,0.43
4/0,107.21,195,230,260,150,180,205,300,360,405,235,280,315,0.135,0.135,0.167,0.203,0.22,0.207,0.33,0.36,0.33
250,126.67,215,255,290,170,205,230,340,405,455,265,315,355,0.135,0.135,0.171,0.171,0.187,0.177,0.279,0.295,0.282
300,152.01,240,285,320,195,230,260,375,445,505,290,350,395,0.135,0.135,0.167,0.144,0.161,0.148,0.233,0.249,0.236
350,177.34,260,310,350,210,250,280,420,505,570,330,395,445,0.131,0.131,0.164,0.125,0.141,0.128,0.2,0.217,0.207
400,202.68,280,335,380,225,270,305,455,545,615,355,425,480,0.131,0.131,0.161,0.108,0.125,0.115,0.177,0.194,0.18
500,253.35,320,380,430,260,310,350,515,620,700,405,485,545,0.128,0.128,0.157,0.089,0.105,0.095,0.141,0.157,0.148
600,304.02,350,420,475,285,340,385,575,690,780,455,545,615,0.128,0.128,0.157,0.075,0.092,0.082,0.118,0.135,0.125
700,354.69,385,460,520,315,375,425,630,755,850,500,595,670,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A
750,380.02,400,475,535,320,385,435,655,785,885,515,620,700,0.125,0.125,0.157,0.062,0.079,0.069,0.095,0.112,0.102
800,405.36,410,490,555,330,395,445,680,815,920,535,645,725,0.121,0.121,0.151,0.049,0.062,0.059,0.075,0.089,0.082
900,456.03,435,520,585,355,425,480,730,870,980,580,700,790,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A
1000,506.7,455,545,615,375,445,500,780,935,1055,625,750,845,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A
1250,633.38,495,590,665,405,485,545,890,1065,1200,710,855,965,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A
1500,760.05,525,625,705,435,520,585,980,1175,1325,795,950,1070,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A
1750,886.73,545,650,735,455,545,615,1070,1280,1445,875,1050,1185,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A
2000,1013.4,555,665,750,470,560,630,1155,1385,1560,960,1150,1295,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A

---

## 4. WHITE CONTAINER (Draft Controls)

**Component:** `DraftControls.tsx`
**Purpose:** Data persistence and synchronization controls
**Background Color:** White (`bg-white`)
**Position:** Full-width bottom bar

### 4.1 Status Indicators

#### Change Status:
- **Unsaved Changes:** 
  - **Indicator:** Amber dot (`bg-amber-500`) with pulse animation
  - **Text:** "New changes without saving"
  - **Warning:** "⚠️ Draft Mode: All changes are saved automatically..."

- **Saved State:**
  - **Indicator:** Green dot (`bg-green-500`)
  - **Text:** "All changes have been saved"

#### Timestamps:
- **Last Modified:** Real-time timestamp of last change
- **Last Saved:** Timestamp of last database save
- **Format:** `DD/MM/YY HH:mm:ss` local time

### 4.2 Action Buttons

#### Primary Actions:
1. **Guardar en DB**
   - **Function:** `onPushToDatabase()`
   - **Style:** Blue button, prominent
   - **Confirmation:** "Are you sure you want to proceed with overriding the DB data?"

2. **Cargar desde DB**
   - **Function:** `onLoadFromDatabase()`
   - **Style:** Standard button
   - **Confirmation:** "Are you sure you want to proceed with overriding the current data?"


#### Secondary Actions:
3. **Exportar a Word**
   - **Function:** `onExport()`
   - **Style:** Green button
   - **Loading State:** Shows "Generando..." with spinner
   - **Disabled:** When exporting is in progress. Will be implemented in the future.

### 4.3 Draft System Architecture

#### Dual-Array System:
- **dbArray:** Current database state
- **draftArray:** Working draft state
- **Change Detection:** JSON.stringify comparison
- **Auto-save:** localStorage persistence with timestamps

---

## 5. DATA FLOW AND STATE MANAGEMENT

### 5.1 Component Hierarchy
```
Circuit Dimmension Calculation (Main Container)
├── Header (Dark Blue - Navigation)
├── ProjectInfoPanel (Emerald Green - Project Context)
├── TabsContainer (Purple - Tab Navigation & Common Inputs)
│   ├── Common Inputs (Red - Collapsible Form)
│   └── EquipmentTableGallery (Gray - Equipment Data Table)
└── DraftControls (White - Data Persistence)
```

### 5.2 Data Types

#### Core Interfaces:
```typescript
interface ProjectInfo {
  costCenter: string;
  projectName: string;
  version: number;
  client: string;
  companyLogo?: string;
  lastModified: string;
}

interface CommonCargasInputs {
  installationType: 'Conduit' | 'Exposed';
  tensionKV: number;
  powerFactor: number;
  conductorType: string;
  conductorMaterial: 'Cu' | 'Al';
  conductorTemperature: '60°C' | '75°C' | '90°C';
  ambientTemperature: string;
  conductorsPerConduit: string;
  conduitMaterial: 'PVC' | 'Aluminum' | 'Steel';
}

interface Equipment {
  id: string;
  output, dcoutput: string;
  name, dcname: string;
  phases: 1 | 3;
  installedPower: number;
  usageFactor: number;
  protectionCurrent, dcprotectionCurrent: number;
  caliber, dccaliber: string;
  conductorsPerPhase, dcconductorsPerPhase: number;
  conductorLength, dcconductorLength: number;
  resistance, dcresistance: number;
  inductiveReactance: number;
  chargeType: "Con" | "Mom";
  equiptmentNumber: number;
  unitInstalledPower: number;
  demandedPowerFactor: number;
   
  // Calculated fields (read-only)
  demandedPower?: number | null;
  iNominalx125?: number | null;
  calculatedAmpacity?, dccalculatedAmpacity?: number | null;
  calculatedAmpacityFac?: number | null;
  regulation?, dcregulation?: number | null
  losses?, dclosses?: number | null
  ICBBool?: boolean | null;
  REGBool?: boolean | null;
  PERBool?: boolean | null;
  InFac?: number | null;

  
  type: 'esential_loads' | 'non_esential_loads' | 'transfer_panel' | 'dc_panel' | 'transformers_&_generators';
}
```

### 5.3 Calculation Engine

#### Electrical Calculations:
- **NTC-2050/RETIE Standards:** Colombian electrical code compliance
- **Real-time Updates:** Calculations run on every input change
- **Functions:**
  - `calculateDemandedPower()` returns demandedPowerCal = installedPower * usageFactor
  - `calculateINominalx125()` returns iNominalx125 = if (phases = 1) then  niFactor * installedPower / tensionKV; elseif (phases = 3) then niFactor * installedPower / ( tensionKV * sqrt(3))
  - `calculateAmpacity()` returns calculatedAmpacity = ampacityValue * conductorsPerPhase; ampacityValue is obtained with  ampacityFromTable() function
  - `calculateAmpacityFactored()` returns calculatedAmpacityFac = calculatedAmpacity * temperatureFac * groupingFac; groupingFac and temperatureFac are obtained with tempFacFromTable() and groupingFacFromTable() functions
  - `calculateRegulation()` returns regulation = voltageDrop / (tensionKV * 1000); voltageDrop is calculated with calculateVoltageDrop() function
  - `calculateLossesPerc()` returns lossesPerc = losses / (powerFactor * installedPower * 1000); losses is calculated with calculateLosses() function
  - `calculateUsageFactor()` returns usageFactor = demandedPower / installedPower
  - `calculateSumationDemandedPower()` returns demandedPower = sumation of either all demanded powers of Esential loads or all demanded powers of Non Esential loads or all demanded powers of Esential and Non Esential loads 
  - `calculateActivePower()` returns activePower = (iNominalx125 / niFactor) * conductorLenght * (resistance * cos(acos(powerFactor)) + inductiveReactance * sin(acos(powerFactor)))
  - `calculateVoltageDrop()` returns voltageDrop = if (phases = 1) then activePower * 2; elseif (phases = 3) then activePower / sqrt(3)
  - `calculateLosses()` returns losses = if (phases = 1) then 2 * ((iNominalx125 / niFactor) ^ 2) * resistance * conductorLenght; elseif (phases = 3) then 3 * ((iNominalx125 / niFactor) ^ 2) * resistance * conductorLenght
  - `ampacityFromTable()` returns ampacityValue = Obtained from ampacityTable described in 3.3.6 Local Data using caliber, tensionKV, conductorMaterial and conductorTemperature values
  - `tempFacFromTable()` returns temperatureFac = Obtained from temFacTable described in 3.3.6 Local Data using ambientTemperature value
  - `groupingFacFromTable()` returns groupingFac Obtained from groFacTable described in 3.3.6 Local Data using conductorsPerConduit value
  - `caliberFromTable()` returns caliberPlaHol = Using the installationType, conductorMaterial and conductorTemperature to select the column of the ampacityTable in 3.3.6 Local Data, obtain the lowest caliber value which's ampacityValue (from the selected column) is greater than the protectionCurrent value. If function returns error or null caliberPlaHol = "".
  - `resistanceFromTable()` returns resistancePlaHol = using the caliber, conductorMaterial and conduitMaterial obtain the value of resistance from ampacityTable 3.3.6 Local Data. If function returns error or null resistancePlaHol = "".
  - `inductiveReactanceFromTable()` returns inductiveReactancePlaHol = using the caliber and conduitMaterial obtain the value of inductiveReactance from ampacityTable 3.3.6 Local Data. If function returns error or null inductiveReactancePlaHol = "".
  - `verifyICB()` returns ICBBool = true if ((protectionCurrent > iNominalx125) and (xN.Fac > protectionCurrent)), everything else will give false
  - `verifyREG()` returns REGBool = true if deltaV > regulation value, else is false
  - `verifyLOS()` returns LOSBool = true if percLoss > losses value, else is false

#### Validation System:
- **Common Inputs Validation:** Ensures all required fields are complete
- **Equipment Validation:** Field-specific validation with error messages
- **Visual Feedback:** Color coding, warning messages, and icons

---

## 6. RESPONSIVE DESIGN AND INTERACTIONS

### 6.1 Layout Responsiveness
- **Grid System:** CSS Grid for main 4-container layout
- **Flexible Heights:** Containers adjust to content and viewport
- **Horizontal Scrolling:** Tables scroll horizontally on narrow screens
- **Mobile Considerations:** Touch-friendly button sizes

### 6.2 User Interactions
- **Double-click Editing:** Inline editing for table cells
- **Keyboard Navigation:** Enter/Escape for save/cancel
- **Collapsible Sections:** Common inputs and project info can collapse
- **Hover Effects:** Visual feedback on interactive elements

### 6.3 Error Handling
- **Validation Messages:** Real-time validation feedback
- **Network Error Handling:** Graceful degradation when offline
- **Confirmation Dialogs:** Destructive actions require confirmation
- **Toast Notifications:** Success/error messages for user actions

---

## 7. STYLING AND VISUAL DESIGN

### 7.1 Color Palette
- **Dark Blue Header:** `bg-slate-800` - Navigation/branding
- **Emerald Green:** `bg-emerald-600` - Project information
- **Purple:** `bg-purple-500` - Tab container
- **Red:** `bg-red-500` - Common inputs area
- **Gray:** `bg-gray-700` - Equipment table
- **White:** `bg-white` - Draft controls

### 7.2 Typography
- **Headers:** Bold, white text on colored backgrounds
- **Body Text:** Standard weights, high contrast
- **Icons:** Emoji and SVG icons for visual clarity
- **Monospace:** Numbers in tables for alignment

### 7.3 Spacing and Layout
- **Padding:** Consistent 4-6 spacing units (`p-4`, `p-6`)
- **Margins:** Standard spacing between sections
- **Border Radius:** Rounded corners (`rounded-lg`) for modern look
- **Shadows:** Subtle shadows for depth (`shadow-lg`)

---

## 8. TECHNICAL REQUIREMENTS

### 8.1 Dependencies
- **React 19+:** Component framework
- **Next.js 15+:** App router and SSR
- **TypeScript:** Type safety
- **Tailwind CSS 4+:** Styling system

### 8.2 State Management
- **Custom Hook:** `useDraftManager()` for dual-array system
- **React Context:** Authentication and user state
- **Local Storage:** Draft persistence between sessions

### 8.3 Data Persistence
- **API Integration:** RESTful backend communication
- **Auto-save:** Real-time draft saving to localStorage
- **Manual Save:** User-triggered database persistence
- **Conflict Resolution:** Handles concurrent edits

---

## 9. IMPLEMENTATION NOTES

### 9.1 Key Considerations
- **Performance:** Calculations run efficiently on large equipment lists
- **Data Integrity:** Validation prevents invalid electrical configurations
- **User Experience:** Immediate feedback and intuitive workflows
- **Accessibility:** Keyboard navigation and screen reader support

### 9.2 Extension Points
- **Additional Tabs:** Easy to add new calculation types
- **Custom Validations:** Extensible validation system
- **Export Formats:** Pluggable export system
- **Calculation Engines:** Swappable calculation libraries

### 9.3 Testing Strategy
- **Unit Tests:** Individual calculation functions
- **Integration Tests:** Component interactions
- **E2E Tests:** Full user workflows
- **Validation Tests:** Data integrity checks

---

This specification provides all necessary information to recreate the electrical calculation page with full functionality, proper styling, and appropriate user interactions. The modular component design allows for easy maintenance and extension of features.

---

## Implementation Status (2025-11-14)

The following items document the current implementation present in the repository (branch: `circuit-dimension-memory`). Keep this section as a short, living summary of what was built and where to look in the codebase.

- **Circuit Dimension Main Page:** Implemented at `/calc/circuit-dimension-main` — a full-page route that hosts the configuration modal and loads project + memory context from query parameters.
- **Modal Configuration UI:** A 7-question modal (4 boolean toggles + 3 numeric inputs) was added. Defaults: `NonEseBool=false`, `DCBool=false`, `TranBool=false`, `GenBool=false`, `niFactor=1.25`, `deltaV=5`, `percLoss=3.88`.
- **Navigation:** `components/MemoryCard.jsx` was updated to handle `memory_type: 'circuit'` and route users to the Circuit Dimension main page. This fixed an earlier redirect issue where `memory_type` values did not match the frontend expectation.
- **Configuration Persistence:** Modal values are saved to `localStorage` so the Secondary page layout can read and apply them immediately without a DB round-trip. This supports optimistic UX and draft workflows.
- **Secondary Layout (scaffold):** A 4-container secondary layout is present to accept configuration and display the calculation UI (Dark Blue header, Emerald Green project info, Purple tabs & gallery, White draft controls). Calculation engines and per-row functions are documented in this spec and are ready to be wired into the secondary layout.

Where to look (code pointers):

- `pages/calc/circuit-dimension-main.jsx` — main page + modal wiring and localStorage persistence
- `components/MemoryCard.jsx` — navigation logic to route `memory_type='circuit'` to the configuration page
- `lib/cache.js` — local staging + ops queue used across POC components
- `calculation_guidelines/circuit_dimmension_architecture.md` — this conceptual and component-level specification

Next recommended steps:

1. Commit and push these documentation updates and any related code changes on branch `circuit-dimension-memory`.
2. Wire the documented calculation functions (section 5.3) into the Secondary layout components and add unit tests for the calculation engine.
3. Review naming consistency: consider renaming internal occurrences of "Dimmension" → "Dimension" if desired (note: file and path names contain the current spelling and renaming is optional and potentially breaking).

If you want, I can commit and push these documentation edits now, and open a PR — tell me to proceed and I'll run the Git commands.