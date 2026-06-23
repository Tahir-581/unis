export type FieldDomain = "computer_science" | "engineering" | "mathematics";

export type StudyCategory =
  | "informatics"
  | "cs_engineering"
  | "data_science"
  | "ai"
  | "cybersecurity"
  | "software"
  | "other"
  | "power_engineering"
  | "electronics"
  | "telecommunications"
  | "computer_engineering"
  | "control_systems"
  | "instrumentation"
  | "mechatronics"
  | "robotics"
  | "embedded_systems"
  | "signal_processing"
  | "renewable_energy"
  | "automation"
  | "biomedical"
  | "avionics"
  | "vlsi_microelectronics"
  | "pure_mathematics"
  | "applied_mathematics"
  | "statistics"
  | "computational_mathematics";

export const FIELD_DOMAINS: { id: FieldDomain | "all"; label: string }[] = [
  { id: "all", label: "All fields" },
  { id: "computer_science", label: "Computer Science" },
  { id: "engineering", label: "Engineering" },
  { id: "mathematics", label: "Mathematics" },
];

export const DOMAIN_LABELS: Record<FieldDomain, string> = {
  computer_science: "Computer Science",
  engineering: "Engineering",
  mathematics: "Mathematics",
};

export const CATEGORY_LABELS: Record<StudyCategory, string> = {
  informatics: "Informatics",
  cs_engineering: "CS Engineering",
  data_science: "Data Science",
  ai: "Artificial Intelligence",
  cybersecurity: "Cybersecurity",
  software: "Software",
  other: "Other",
  power_engineering: "Power Engineering",
  electronics: "Electronics",
  telecommunications: "Telecommunications",
  computer_engineering: "Computer Engineering",
  control_systems: "Control Systems",
  instrumentation: "Instrumentation",
  mechatronics: "Mechatronics",
  robotics: "Robotics",
  embedded_systems: "Embedded Systems",
  signal_processing: "Signal Processing",
  renewable_energy: "Renewable Energy",
  automation: "Automation",
  biomedical: "Biomedical Engineering",
  avionics: "Avionics",
  vlsi_microelectronics: "VLSI & Microelectronics",
  pure_mathematics: "Pure Mathematics",
  applied_mathematics: "Applied Mathematics",
  statistics: "Statistics",
  computational_mathematics: "Computational Mathematics",
};

export const DOMAIN_CATEGORIES: Record<FieldDomain, StudyCategory[]> = {
  computer_science: [
    "informatics",
    "cs_engineering",
    "data_science",
    "ai",
    "cybersecurity",
    "software",
    "other",
  ],
  engineering: [
    "power_engineering",
    "electronics",
    "telecommunications",
    "computer_engineering",
    "control_systems",
    "instrumentation",
    "mechatronics",
    "robotics",
    "embedded_systems",
    "signal_processing",
    "renewable_energy",
    "automation",
    "biomedical",
    "avionics",
    "vlsi_microelectronics",
  ],
  mathematics: [
    "pure_mathematics",
    "applied_mathematics",
    "statistics",
    "computational_mathematics",
  ],
};

export function categoryLabel(category: string | null | undefined): string {
  if (!category) return "";
  return CATEGORY_LABELS[category as StudyCategory] ?? category.replace(/_/g, " ");
}

export function domainLabel(domain: string | null | undefined): string {
  if (!domain) return "";
  return DOMAIN_LABELS[domain as FieldDomain] ?? domain.replace(/_/g, " ");
}
