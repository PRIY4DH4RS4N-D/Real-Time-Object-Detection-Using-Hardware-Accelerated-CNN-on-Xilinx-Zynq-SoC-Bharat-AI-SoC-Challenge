
# 🚀 KV260 DPU Demo and Execution

This repository demonstrates the **loading, execution, and verification** of a custom DPU application (`myApp`) on the Xilinx Kria KV260 Starter Kit.

---

## 📌 Overview

This project shows how to:

- List available accelerator applications  
- Unload existing applications  
- Load a custom DPU application (`myApp`)  
- Verify DPU configuration and status  

---

## ⚙️ Prerequisites

- Xilinx Kria KV260 Starter Kit  
- Linux environment with root access  
- Installed tools:
  - xmutil
  - xdputil
  - show_dpu
- Pre-built DPU application (`myApp`)

---

## ▶️ Execution Steps

### 1️⃣ List Available Applications

```bash
sudo xmutil listapps
```

#### Expected Output
```bash
Accelerator          Accel_type           Base                Base_type      #slots(PL+AIE)         Active_slot
k26-starter-kits     XRT_FLAT             k26-starter-kits    XRT_FLAT        (0+0)                  0,
myApp                XRT_FLAT             myApp               XRT_FLAT        (0+0)                  -1
```

---

### 2️⃣ Unload Current Application

```bash
sudo xmutil unloadapp
```

#### Expected Output
```bash
Accelerator successfully removed.
```

---

### 3️⃣ Load Custom Application

```bash
sudo xmutil loadapp myApp
```

#### Expected Output
```bash
Accelerator loaded to slot 0
```

---

### 4️⃣ Verify DPU Status

#### Option A: Using show_dpu

```bash
sudo show_dpu
```

#### Expected Output
```bash
device_core_id=0 device= 0 core = 0 fingerprint = 0x101000016010407 batch = 1 full_cu_name=unknown:dpu0
```

---

#### Option B: Using xdputil query

```bash
sudo xdputil query
```

#### Expected Output
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
    "libxir.so": "Xilinx xir Version: 2.5.0",
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

## ✅ Result

- Successfully loaded `myApp` onto KV260  
- DPU initialized and verified  
- System ready for AI inference execution  

---

## 📂 Folder Structure

```
kv260-dpu-demo-and-execution/
│── README.md
│── scripts/
│── app/
│── logs/
```

---

## 📌 Notes

- Always use sudo for hardware-related commands  
- Ensure `myApp` is correctly installed before loading  
- Output values may vary depending on build  

---

## 👨‍💻 Author

Developed for KV260 DPU demonstration and execution workflow.
