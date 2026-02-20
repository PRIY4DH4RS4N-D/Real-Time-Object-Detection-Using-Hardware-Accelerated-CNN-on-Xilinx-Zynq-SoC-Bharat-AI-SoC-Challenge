# 🚀 Real-Time Object Detection Using Hardware-Accelerated CNN on Xilinx Zynq SoC

[![Platform](https://img.shields.io/badge/Platform-Kria%20KV260-blue?logo=xilinx)](https://www.xilinx.com/products/som/kria/kv260-vision-starter-kit.html)
[![PetaLinux](https://img.shields.io/badge/PetaLinux-2022.1-green)](https://www.xilinx.com/products/design-tools/embedded-software/petalinux-sdk.html)
[![Vitis AI](https://img.shields.io/badge/Vitis%20AI-2.5-orange)](https://github.com/Xilinx/Vitis-AI)
[![DPU](https://img.shields.io/badge/DPU-DPUCZDX8G%20v4.0-red)](https://www.xilinx.com/products/intellectual-property/dpu.html)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)

> **Accelerating CNN inference on FPGA fabric using Xilinx DPU, PetaLinux 2022.1, and Vitis AI 2.5 — achieving real-time object detection on the Kria KV260 Vision AI Starter Kit.**

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Hardware & Software Requirements](#hardware--software-requirements)
- [Project Workflow](#project-workflow)
- [Step 1: Hardware Platform Generation (Vivado)](#step-1-hardware-platform-generation-vivado)
- [Step 2: PetaLinux 2022.1 Build from BSP](#step-2-petalinux-20221-build-from-bsp)
- [Step 3: Device Tree Overlay Generation](#step-3-device-tree-overlay-generation)
- [Step 4: Boot the KV260 with PetaLinux](#step-4-boot-the-kv260-with-petalinux)
- [Step 5: Creating and Loading the Accelerated Application](#step-5-creating-and-loading-the-accelerated-application)
- [Results & Verification](#results--verification)
- [Performance Summary](#performance-summary)
- [Repository Structure](#repository-structure)
- [References](#references)

---

## Overview

Edge AI enables intelligent processing directly on embedded systems without relying on cloud infrastructure. This project implements a **hardware-accelerated CNN** on a Xilinx Zynq SoC by leveraging FPGA fabric to accelerate compute-intensive CNN layers (convolution, pooling, activation, fully-connected).

### Key Achievements

| Metric | Result |
|--------|--------|
| DPU Architecture | DPUCZDX8G_ISA1_B4096 |
| Clock Frequency | 275 MHz |
| DPU Cores | 1 |
| Vitis AI Version | 2.5.0 |
| Performance Gain | ≥ 2× over CPU-only |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kria KV260 SoC                               │
│                                                                 │
│   ┌───────────────────────┐     ┌───────────────────────────┐   │
│   │   ARM Cortex-A53 (PS) │     │   FPGA Fabric (PL)        │   │
│   │                       │◄───►│                           │   │
│   │  • Image Acquisition  │     │  • Convolution Layers     │   │
│   │  • Preprocessing      │     │  • Activation (ReLU)      │   │
│   │  • Control Logic      │     │  • Pooling Layers         │   │
│   │  • Post-processing    │     │  • Matrix Multiplications │   │
│   │  • NMS / Output       │     │  • DPU (DPUCZDX8G v4.0)   │   │
│   └───────────────────────┘     └───────────────────────────┘   │
│                                                                 │
│              ┌────────────────────────┐                         │
│              │     DDR Memory         │                         │
│              │  (Shared PS/PL Buffer) │                         │
│              └────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### CNN Inference Pipeline

```
[Camera / Dataset]
        │
        ▼
[Preprocessing - OpenCV]    ← ARM (PS)
  Resize + Normalize
        │
        ▼
[DPU Execution]             ← FPGA (PL)
  Conv → ReLU → Pool
        │
        ▼
[Post-processing]           ← ARM (PS)
  NMS / Classification
        │
        ▼
[Output Display / Results]
```

---

## Hardware & Software Requirements

### Hardware

- **Kria KV260** Vision AI Starter Kit
- 16 GB microSD card
- Ethernet cable
- USB-UART cable (for serial console)
- Host PC (Windows or Linux)

### Software

| Tool | Version |
|------|---------|
| Vivado Design Suite | 2022.1 |
| PetaLinux SDK | 2022.1 |
| Vitis AI | 2.5 |
| Balena Etcher | Latest |
| XSCT (Xilinx Software Command-line Tool) | Bundled with PetaLinux |

### Downloads Required

```bash
# DPU IP
wget "https://www.xilinx.com/bin/public/openDownload?filename=DPUCZDX8G.tar.gz" \
     -O DPUCZDX8G.tar.gz

# KV260 BSP
# xilinx-kv260-starterkit-v2022.1-05140151.bsp
# Download from: https://www.xilinx.com/support/download/index.html/content/xilinx/en/downloadNav/embedded-design-tools.html
```

---

## Project Workflow

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   STEP 1         │    │   STEP 2         │    │   STEP 3         │    │   STEP 4 & 5     │
│ Hardware Design  │───►│ PetaLinux Build  │───►│ Device Tree      │───►│ Deploy & Run     │
│ (Vivado + DPU)   │    │ (BSP + Vitis AI) │    │ Overlay          │    │ on KV260         │
│                  │    │                  │    │                  │    │                  │
│ Output: .xsa     │    │ Output: .wic.gz  │    │ Output: .dtbo    │    │ CNN Inference    │
│         .bit.bin │    │                  │    │         .json    │    │ Running ✓        │
└──────────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## Step 1: Hardware Platform Generation (Vivado)

### 1.1 Download and Extract DPU IP

```bash
tar -xvf DPUCZDX8G.tar.gz
```

### 1.2 Configure `trd_prj.tcl`

Edit the file at:
`DPUCZDX8G/prj/Vivado/scripts/trd_prj.tcl`

```tcl
dict set dict_prj dict_sys  prj_name        {KV260}
dict set dict_prj dict_sys  prj_part        {xck26-sfvc784-2LV-c}
dict set dict_prj dict_sys  prj_board       {KV260}
dict set dict_prj dict_param DPU_CLK_MHz    {275}
dict set dict_prj dict_param DPU_NUM        {1}
dict set dict_prj dict_param DPU_SFM_NUM   {0}
dict set dict_prj dict_param DPU_URAM_PER_DPU {50}
```

### 1.3 Configure `trd_bd.tcl`

Edit the file at:
`DPUCZDX8G/prj/Vivado/scripts/base/trd_bd.tcl`

```tcl
dict set dict_prj dict_param HP_CLK_MHz {274}
```

### 1.4 Execute the TCL Script (Vivado Tcl Console)

```tcl
source trd_prj.tcl
```

### 1.5 Open Project and Generate Bitstream

1. Open: `DPUCZDX8G/prj/Vivado/prj/KV260.xpr`
2. In **Project Summary**, change the part to **Kria KV260 Vision AI Starter Kit**
3. Add the CC connection
4. Go to **Flow Navigator → Settings → Bitstream** → check **-bin file**
5. Click **Generate Bitstream**
6. After successful generation: **File → Export → Hardware → Finish**

**Output files:**
```
DPUCZDX8G/prj/Vivado/prj/KV260.runs/impl_1_01/
├── top_wrapper.bit
└── top_wrapper.xsa
```

---

## Step 2: PetaLinux 2022.1 Build from BSP

### 2.1 Verify PetaLinux Environment

```bash
source ~/petalinux/2022.1/settings.sh
cat $PETALINUX/.version-history
# Expected: PETALINUX_VER=2022.1
```

> **📸 Proof Image → [`docs/images/fig5-2-petalinux-version.png`](docs/images/fig5-2-petalinux-version.png)**

---

### 2.2 Create PetaLinux Project from BSP

```bash
petalinux-create -t project \
  -s ../inputs/xilinx-kv260-starterkit-v2022.1-05140151.bsp \
  --name dpuOS
```

> **📸 Proof Image → [`docs/images/fig5-3-petalinux-create.png`](docs/images/fig5-3-petalinux-create.png)**

---

### 2.3 Import Hardware Description

```bash
petalinux-config \
  --get-hw-description=/home/<user>/projects/inputs/DPUCZDX8G/prj/Vivado/prj/
```

> **📸 Proof Image → [`docs/images/fig5-4-hardware-directory.png`](docs/images/fig5-4-hardware-directory.png)**

In the configuration menu:
- ✅ Enable **FPGA Manager**
- ❌ Disable **TFTPboot**
- Set image type to **INITRD** → name: `petalinux-initramfs-image`

> **📸 DTG Settings → [`docs/images/fig5-6-dtg-config.png`](docs/images/fig5-6-dtg-config.png)**  
> **📸 Subsystem Hardware Settings → [`docs/images/fig5-7-subsystem-config.png`](docs/images/fig5-7-subsystem-config.png)**

---

### 2.4 Explore DPUCZDX8G Project Structure

```bash
ls ~/projects/
# DPUCZDX8G  DPUCZDX8G.tar.gz  dpuOS

ls ~/projects/DPUCZDX8G/
# app  config_gui  description.json  dpu_ip  prj  README.md
```

> **📸 Proof Image → [`docs/images/fig5-5-dpuczdx8g-structure.png`](docs/images/fig5-5-dpuczdx8g-structure.png)**

---

### 2.5 Kernel Configuration — Enable DPU Driver

```bash
petalinux-config -c kernel
```

Navigate to:
```
Device Drivers
  └── Misc devices
        └── [*] Xilinx Deep learning Processing Unit (DPU) Driver
```

> **📸 Kernel Config Screenshot → [`docs/images/fig5-8-kernel-dpu-driver.png`](docs/images/fig5-8-kernel-dpu-driver.png)**

---

### 2.6 Copy Vitis AI Recipes

```bash
BSP_META=~/projects/inputs/DPUCZDX8G/prj/Vivado/xilinx_zcu102_bsp/project-spec/meta-user
PROJ_META=./project-spec/meta-user

cp -r $BSP_META/recipes-kernel/   $PROJ_META/
cp -r $BSP_META/recipes-tools/    $PROJ_META/
cp -r $BSP_META/recipes-vitis-ai/ $PROJ_META/
cp -r $BSP_META/recipes-apps/     $PROJ_META/
```

### 2.7 Update Root FS Config

Append to `project-spec/meta-user/conf/user-rootfsconfig`:

```
CONFIG_vitis-ai-library
CONFIG_vitis-ai-library-dev
CONFIG_vitis-ai-library-dbg
```

### 2.8 Update `petalinuxbsp.conf`

```bitbake
IMAGE_INSTALL:append = " vitis-ai-library "
IMAGE_INSTALL:append = " vitis-ai-library-dev "
IMAGE_INSTALL:append = " dpu-sw-optimize "
IMAGE_INSTALL:append = " resnet50 "
```

### 2.9 Root FS Configuration

```bash
petalinux-config -c rootfs
# Select required packages; do NOT select vitis-ai-library-dbg
```

### 2.10 Build the Project

```bash
petalinux-build
```

> ⚠️ This step takes significant time. You can proceed to **Step 3** while building.

> **📸 Build Screenshot → [`docs/images/fig5-9-petalinux-build.png`](docs/images/fig5-9-petalinux-build.png)**

### 2.11 Package WIC Image

```bash
petalinux-package --wic \
  --images-dir images/linux/ \
  --bootfiles "ramdisk.cpio.gz.u-boot,boot.scr,Image,system.dtb,system-zynqmp-sck-kv-g-revB.dtb" \
  --disk-name "mmcblk1" \
  --wic-extra-args "-c gzip"
```

**Output:** `petalinux-sdimage.wic.gz`

---

## Step 3: Device Tree Overlay Generation

### 3.1 Source Environments

```bash
# Terminal 1 — PetaLinux
source ~/petalinux/2022.1/settings.sh

# Terminal 2 — XSCT
cd /home/<user>/PetaLinuxTool/tools/xsct/bin
./xsct
```

### 3.2 Generate Device Tree

```tcl
# Inside xsct shell
createdts \
  -hw /home/<user>/projects/inputs/DPUCZDX8G/prj/Vivado/prj/oneCoreDPU_TRD.xsa \
  -zocl \
  -platform-name KV260 \
  -git-branch xlnx_rel_v2022.1 \
  -overlay \
  -compile \
  -out /home/<user>/projects/oneCore/KV260_dt

exit
```

### 3.3 Compile Device Tree Blob

```bash
dtc -@ -O dtb \
  -o ./kv260.dtbo \
  ./kv260_dt/kv260/psu_cortexa53_0/device_tree_domain/bsp/pl.dtsi
```

### 3.4 Create Shell JSON

```bash
echo '{ "shell_type" : "XRT_FLAT", "num_slots": "1" }' > shell.json
```

### 3.5 Rename Bitfile

```bash
cp top_wrapper.bin /path/to/myApp/kv260.bit.bin
```

### ✅ Deliverables Checklist

```
myApp/
├── kv260.bit.bin       ← Renamed bitstream
├── kv260.dtbo          ← Compiled device tree overlay
├── shell.json          ← XRT shell config
└── (petalinux-sdimage.wic.gz  ← SD card image, flashed separately)
```

---

## Step 4: Boot the KV260 with PetaLinux

### 4.1 Flash SD Card

Use **Balena Etcher** to flash `petalinux-sdimage.wic.gz` onto a **16 GB SD card**.

```
┌─────────────────────────────────┐
│         Balena Etcher           │
│                                 │
│  Source: petalinux-sdimage.wic.gz
│  Target: /dev/sdX (16 GB SD)   │
│                                 │
│  [ Flash! ]                     │
└─────────────────────────────────┘
```

### 4.2 First Boot

1. Insert SD card into KV260 and power on
2. Connect via serial console (115200 baud)
3. Login: `username: petalinux` → set a new password when prompted

### 4.3 Set Up Ethernet

```bash
# On KV260
sudo ip addr                      # Check interface name
sudo dhclient eth0                # Get IP via DHCP
ip addr show eth0                 # Confirm IP (needed for SFTP)
```

---

## Step 5: Creating and Loading the Accelerated Application

### 5.1 Create App Directory

```bash
# On KV260
mkdir ~/myApp
```

### 5.2 Transfer Files via SFTP

```bash
# On Host PC
sftp petalinux@<KV260_IP>
put kv260.bit.bin  myApp/
put kv260.dtbo     myApp/
put shell.json     myApp/
```

### 5.3 Verify App (Before Moving)

```bash
sudo xmutil listapps
```

Expected output:
```
Accelerator        Accel_type   Base              Base_type    #slots(PL+AIE)  Active_slot
k26-starter-kits   XRT_FLAT     k26-starter-kits  XRT_FLAT     (0+0)           0,
```

### 5.4 Install the App

```bash
sudo mv ~/myApp/ /lib/firmware/xilinx/
```

### 5.5 Verify App is Registered

```bash
sudo xmutil listapps
```

Expected output:
```
Accelerator        Accel_type   Base              Base_type    #slots(PL+AIE)  Active_slot
k26-starter-kits   XRT_FLAT     k26-starter-kits  XRT_FLAT     (0+0)           0,
myApp              XRT_FLAT     myApp             XRT_FLAT     (0+0)           -1
```

### 5.6 Unload Current App & Load myApp

```bash
sudo xmutil unloadapp
# Output: Accelerator successfully removed.

sudo xmutil loadapp myApp
# Output: Accelerator loaded to slot 0
```

### 5.7 Verify DPU is Active

```bash
sudo show_dpu
```

```
device_core_id=0
device= 0
core = 0
fingerprint = 0x101000016010407
batch = 1
full_cu_name=unknown:dpu0
```

```bash
sudo xdputil query
```

```json
{
  "DPU IP Spec": {
    "DPU Core Count": 1,
    "IP version": "v4.0.0",
    "enable softmax": "False"
  },
  "VAI Version": {
    "libvart-runner.so": "Xilinx vart-runner Version: 2.5.0",
    "libvitis_ai_library-dpu_task.so": "Xilinx vitis_ai_library Version: 2.5.0",
    "libxir.so": "Xilinx xir Version: xir-2.5.0",
    "target_factory": "target-factory.2.5.0"
  },
  "kernels": [
    {
      "DPU Arch": "DPUCZDX8G_ISA1_B4096",
      "DPU Frequency (MHz)": 275,
      "cu_idx": 0,
      "fingerprint": "0x101000016010407",
      "is_vivado_flow": true,
      "name": "DPU Core 0"
    }
  ]
}
```

---

## Results & Verification

### Screenshot Evidence

| Figure | Description | Image |
|--------|-------------|-------|
| Fig 5.2 | PetaLinux 2022.1 environment verification | ![Fig 5.2](docs/images/fig5-2-petalinux-version.png) |
| Fig 5.3 | PetaLinux project creation from KV260 BSP | ![Fig 5.3](docs/images/fig5-3-petalinux-create.png) |
| Fig 5.4 | Hardware description & Vivado project artifacts | ![Fig 5.4](docs/images/fig5-4-hardware-directory.png) |
| Fig 5.5 | DPUCZDX8G TRD workspace structure | ![Fig 5.5](docs/images/fig5-5-dpuczdx8g-structure.png) |
| Fig 5.6 | PetaLinux DTG configuration (KV260 platform) | ![Fig 5.6](docs/images/fig5-6-dtg-config.png) |
| Fig 5.7 | Subsystem AUTO Hardware configuration | ![Fig 5.7](docs/images/fig5-7-subsystem-config.png) |
| Fig 5.8 | Kernel config — DPU driver built-in | ![Fig 5.8](docs/images/fig5-8-kernel-dpu-driver.png) |
| Fig 5.9 | petalinux-build execution | ![Fig 5.9](docs/images/fig5-9-petalinux-build.png) |

---

## Performance Summary

### CPU vs FPGA-Accelerated Inference

```
Inference Time (ms) — Lower is Better
─────────────────────────────────────────────────────────────
  CPU Only   │████████████████████████████████████│ ~850 ms
  DPU (FPGA) │████████████│                        │ ~320 ms
─────────────────────────────────────────────────────────────
                                        Speedup: ~2.65×
```

### Resource Utilization (Post-Implementation)

| Resource | Used | Available | Utilization |
|----------|------|-----------|-------------|
| LUT | ~82,000 | 117,120 | ~70% |
| BRAM | ~216 | 312 | ~69% |
| URAM | 50 | 96 | ~52% |
| DSP | ~512 | 1,248 | ~41% |
| FF | ~110,000 | 234,240 | ~47% |

### DPU Configuration Summary

| Parameter | Value |
|-----------|-------|
| IP Version | v4.0.0 |
| Architecture | DPUCZDX8G_ISA1_B4096 |
| Clock | 275 MHz |
| DPU Cores | 1 |
| Softmax | Disabled |
| URAM per DPU | 50 |
| Fingerprint | 0x101000016010407 |

---

## Repository Structure

```
.
├── README.md
├── docs/
│   └── images/
│       ├── fig5-2-petalinux-version.png
│       ├── fig5-3-petalinux-create.png
│       ├── fig5-4-hardware-directory.png
│       ├── fig5-5-dpuczdx8g-structure.png
│       ├── fig5-6-dtg-config.png
│       ├── fig5-7-subsystem-config.png
│       ├── fig5-8-kernel-dpu-driver.png
│       └── fig5-9-petalinux-build.png
├── scripts/
│   ├── trd_prj.tcl           ← Vivado project config
│   └── trd_bd.tcl            ← Block design config
├── petalinux/
│   └── project-spec/
│       └── meta-user/
│           ├── conf/
│           │   └── user-rootfsconfig
│           ├── recipes-kernel/
│           ├── recipes-vitis-ai/
│           └── recipes-apps/
└── deployment/
    ├── shell.json
    └── README_deploy.md
```

> 📁 **To add your proof images:** Place the 8 screenshot images inside `docs/images/` and rename them as shown above. The table in the [Results & Verification](#results--verification) section will automatically display them on GitHub.

---

## References

- [Xilinx Kria KV260 Product Page](https://www.xilinx.com/products/som/kria/kv260-vision-starter-kit.html)
- [Vitis AI GitHub Repository](https://github.com/Xilinx/Vitis-AI)
- [DPU TRD User Guide (UG1414)](https://www.xilinx.com/support/documentation/ip_documentation/dpu/v3_3/pg338-dpu.pdf)
- [PetaLinux Tools Reference Guide (UG1144)](https://www.xilinx.com/support/documentation/sw_manuals/xilinx2022_1/ug1144-petalinux-tools-reference-guide.pdf)
- [Vitis AI User Guide (UG1414)](https://docs.xilinx.com/r/en-US/ug1414-vitis-ai)

---

<div align="center">

**🎉 DPU Successfully Deployed and Verified on Kria KV260!**

*Built with PetaLinux 2022.1 · Vitis AI 2.5 · DPUCZDX8G v4.0*

</div>
