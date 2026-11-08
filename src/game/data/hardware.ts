import type { Hardware } from '../types';

export interface HwTier {
  name: string;
  price: number;
  spec: string;
  value: number; // velocidade / MB / banda / SO-tier
  extra?: number;
}

export const CPU_TIERS: HwTier[] = [
  { name: 'Pentium-S 1.6 GHz', price: 0, spec: '1 núcleo · 1.6 GHz', value: 1.0 },
  { name: 'Core i3-Q 2.4 GHz', price: 450, spec: '2 núcleos · 2.4 GHz', value: 1.5 },
  { name: 'Ryzen-X 6C 3.4 GHz', price: 1800, spec: '6 núcleos · 3.4 GHz', value: 2.2 },
  { name: 'Quantum Core 12C', price: 6500, spec: '12 núcleos · 4.6 GHz', value: 3.4 },
  { name: 'Neuron Array 32C', price: 22000, spec: '32 núcleos · 5.8 GHz', value: 5.2 },
];

export const RAM_TIERS: HwTier[] = [
  { name: 'DDR2 2 GB', price: 0, spec: '2 GB · 667 MHz', value: 2048 },
  { name: 'DDR3 4 GB', price: 300, spec: '4 GB · 1333 MHz', value: 4096 },
  { name: 'DDR4 8 GB', price: 1200, spec: '8 GB · 3200 MHz', value: 8192 },
  { name: 'DDR5 16 GB', price: 4200, spec: '16 GB · 5600 MHz', value: 16384 },
  { name: 'DDR5 ECC 32 GB', price: 14000, spec: '32 GB · 6400 MHz', value: 32768 },
];

export const STORAGE_TIERS: HwTier[] = [
  { name: 'HDD IDE 8 GB', price: 0, spec: '8 GB · 5400 rpm', value: 8192 },
  { name: 'SSD SATA 32 GB', price: 250, spec: '32 GB · SATA', value: 32768 },
  { name: 'SSD SATA 128 GB', price: 1000, spec: '128 GB · SATA III', value: 131072 },
  { name: 'NVMe 512 GB', price: 3600, spec: '512 GB · NVMe', value: 524288 },
  { name: 'NVMe 2 TB', price: 12000, spec: '2 TB · NVMe Gen5', value: 2097152 },
];

export const NIC_TIERS: HwTier[] = [
  { name: 'Modem Dial-Sim 56k', price: 0, spec: '1x · 56 kbps virtual', value: 1 },
  { name: 'ADSL-Sim 8M', price: 350, spec: '2x · 8 Mbps virtual', value: 2 },
  { name: 'Fibra-Sim 100M', price: 1500, spec: '4x · 100 Mbps virtual', value: 4 },
  { name: 'Fibra-Sim 1G', price: 5200, spec: '8x · 1 Gbps virtual', value: 8 },
  { name: 'QuantumLink 10G', price: 18000, spec: '16x · 10 Gbps virtual', value: 16 },
];

export const OS_TIERS: HwTier[] = [
  { name: 'LegacyOS 1.2', price: 0, spec: 'Básico · sem monitor de recursos', value: 2200 },
  { name: 'CyberCore OS 2.0', price: 500, spec: 'Libera monitor, gerenciador de recursos', value: 2800 },
  { name: 'NightShell Pro 4', price: 2400, spec: 'Ferramentas avançadas, sandbox', value: 3600 },
  { name: 'Sentinel OS 7', price: 9000, spec: 'Ambiente blindado, ferramentas de elite', value: 4800 },
];

export const HW_TABLES: Record<keyof Hardware, HwTier[]> = {
  cpu: CPU_TIERS,
  ram: RAM_TIERS,
  storage: STORAGE_TIERS,
  nic: NIC_TIERS,
  os: OS_TIERS,
};

export const HW_LABEL: Record<keyof Hardware, string> = {
  cpu: 'Processador',
  ram: 'Memória RAM',
  storage: 'Armazenamento',
  nic: 'Placa de rede',
  os: 'Sistema operacional',
};

export const START_HW: Hardware = { cpu: 0, ram: 0, storage: 0, nic: 0, os: 0 };
