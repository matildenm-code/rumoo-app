// RUMOO CERTIFICATE ENGINE V0 - TYPE DEFINITIONS
// Single source of truth for certificate JSON structure

// ============================================================================
// BASE TYPES (Used in both Normal and Pro)
// ============================================================================

export type CertificateTier = 'normal' | 'pro';
export type CertificateStatus = 'pending' | 'processing' | 'done' | 'error';

export type ExperienceState = 'Balanced' | 'Fragile' | 'Strong';
export type ExperienceTrajectory = 'Improving' | 'Stable' | 'Declining';
export type SignalState = 'positive' | 'neutral' | 'sensitive';

// ============================================================================
// CERTIFICATE META
// ============================================================================

export interface CertificateMeta {
  id: string;
  tier: CertificateTier;
  version: string;
  generated_at: string; // ISO 8601 timestamp
}

// ============================================================================
// PROPERTY IDENTITY
// ============================================================================

export interface PropertyIdentity {
  title: string; // e.g., "T1 in Arroios"
  city: string;
  property_type: string; // T0, T1, T2, Studio, etc.
  area_m2: number;
  floor: string; // ground, 1, 2, attic, etc.
}

// ============================================================================
// EXPERIENCE BAROMETER
// ============================================================================

export interface ExperienceBarometer {
  state: ExperienceState;
  trajectory: ExperienceTrajectory;
  one_sentence: string; // LLM-generated editorial line
}

// ============================================================================
// EXPERIENCE CAPITAL
// ============================================================================

export interface ExperienceCapital {
  generating: string[]; // What this space gives you
  preserving: string[]; // What makes it stable/reliable
  draining: string[];   // What costs energy/comfort
}

// ============================================================================
// SIGNALS
// ============================================================================

export interface Signal {
  name: string;
  state: SignalState;
  short_explanation: string; // 1-2 sentences max
}

// ============================================================================
// BASE CERTIFICATE (NORMAL TIER)
// ============================================================================

export interface BaseCertificate {
  meta: CertificateMeta;
  property_identity: PropertyIdentity;
  experience_barometer: ExperienceBarometer;
  experience_capital: ExperienceCapital;
  signals: Signal[]; // Max 5-6
  editorial_summary: string; // LLM-generated paragraph
}

// ============================================================================
// PRO TIER EXTENSIONS (Only present when tier = "pro")
// ============================================================================

export interface SilenceAndDrift {
  missing_elements: string[]; // What's not shown in listing
  hidden_risks: string[];      // Non-obvious problems
  overlooked_opportunities: string[]; // What buyers might miss
}

export interface PeerGravity {
  comparable_segment: string;  // "Mid-sized central apartments"
  perceived_position: string;  // "Premium positioned"
  explanation: string;         // Why it's positioned this way
}

export interface ExperienceTension {
  compensations: string[];     // What you accept to get something else
  dependencies: string[];      // What this space needs to work
}

export interface StrategicRisk {
  risk: string;
  severity: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface StrategicRisks {
  risks: StrategicRisk[];
}

export interface Evidence {
  photo_observations: string[];   // What we saw in photos
  listing_observations: string[]; // What listing revealed
}

export interface ProExtensions {
  silence_and_drift: SilenceAndDrift;
  peer_gravity: PeerGravity;
  experience_tension: ExperienceTension;
  strategic_risks: StrategicRisks;
  evidence: Evidence;
}

// ============================================================================
// COMPLETE CERTIFICATES (Type-safe union)
// ============================================================================

export type NormalCertificate = BaseCertificate & {
  meta: CertificateMeta & { tier: 'normal' };
};

export type ProCertificate = BaseCertificate & ProExtensions & {
  meta: CertificateMeta & { tier: 'pro' };
};

export type Certificate = NormalCertificate | ProCertificate;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isProCertificate(cert: Certificate): cert is ProCertificate {
  return cert.meta.tier === 'pro';
}

export function isNormalCertificate(cert: Certificate): cert is NormalCertificate {
  return cert.meta.tier === 'normal';
}

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

export interface Space {
  id: string;
  name: string;
  address_label: string;
  city: string;
  country: string;
  neighborhood: string | null;
  property_type: string;
  floor: string;
  area_m2: number;
  listing_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface CertificateRecord {
  id: string;
  space_id: string;
  tier: CertificateTier;
  status: CertificateStatus;
  version: string;
  certificate_json: Certificate;
  source_inputs_json: Record<string, any> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// ============================================================================
// GENERATOR INPUTS
// ============================================================================

export interface GeneratorInputs {
  space: Space;
  tier: CertificateTier;
  
  // Optional overrides for testing/debugging
  overrides?: {
    state?: ExperienceState;
    trajectory?: ExperienceTrajectory;
  };
}

// ============================================================================
// GENERATOR OUTPUTS
// ============================================================================

export interface GeneratorResult {
  success: boolean;
  certificate?: Certificate;
  error?: string;
}
