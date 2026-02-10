// RUMOO CERTIFICATE ENGINE V0 - GENERATOR
// Deterministic rule-based generation with minimal LLM usage

import type {
  Space,
  Certificate,
  NormalCertificate,
  ProCertificate,
  CertificateTier,
  ExperienceState,
  ExperienceTrajectory,
  SignalState,
  GeneratorInputs,
  GeneratorResult,
} from './types/certificate';

// ============================================================================
// RULE-BASED ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Calculate experience state based on space attributes
 * Rules:
 * - Strong: Ground floor OR (high floor + large area) OR (central location + bright)
 * - Fragile: Small area + high floor OR basement OR noisy location
 * - Balanced: Everything else
 */
function calculateExperienceState(space: Space): ExperienceState {
  const isGroundFloor = space.floor === 'ground';
  const isHighFloor = ['4', '5', '6+', 'attic'].includes(space.floor);
  const isBasement = space.floor === 'basement';
  const isLargeArea = space.area_m2 > 60;
  const isSmallArea = space.area_m2 < 35;
  const isCentral = ['Baixa', 'Chiado', 'Santos', 'Príncipe Real'].includes(space.neighborhood || '');
  
  // Fragile conditions
  if (isBasement) return 'Fragile';
  if (isSmallArea && isHighFloor) return 'Fragile';
  
  // Strong conditions
  if (isGroundFloor && isLargeArea) return 'Strong';
  if (isCentral && isLargeArea) return 'Strong';
  if (isGroundFloor && isCentral) return 'Strong';
  
  // Default: Balanced
  return 'Balanced';
}

/**
 * Calculate experience trajectory
 * Rules based on property type, area, and floor
 */
function calculateTrajectory(space: Space): ExperienceTrajectory {
  const isModern = space.property_type === 'Loft' || space.property_type === 'Studio';
  const isGoodArea = space.area_m2 > 50;
  const isGroundOrLow = ['ground', '1', '2'].includes(space.floor);
  
  // Improving: Modern types with good fundamentals
  if (isModern && isGoodArea) return 'Improving';
  
  // Declining: Small high-floor apartments
  if (space.area_m2 < 35 && !isGroundOrLow) return 'Declining';
  
  // Default: Stable
  return 'Stable';
}

/**
 * Generate Experience Capital based on space attributes
 */
function generateExperienceCapital(space: Space) {
  const generating: string[] = [];
  const preserving: string[] = [];
  const draining: string[] = [];
  
  // GENERATING (positive attributes)
  if (space.floor === 'ground') {
    generating.push('Direct street access');
  }
  if (space.area_m2 > 60) {
    generating.push('Generous living space');
  }
  if (['Loft', 'Duplex'].includes(space.property_type)) {
    generating.push('Vertical living flexibility');
  }
  if (['Baixa', 'Chiado', 'Santos'].includes(space.neighborhood || '')) {
    generating.push('Central urban energy');
  }
  
  // PRESERVING (stable attributes)
  if (['T1', 'T2'].includes(space.property_type)) {
    preserving.push('Standard layout familiarity');
  }
  if (space.area_m2 >= 40 && space.area_m2 <= 70) {
    preserving.push('Manageable maintenance scale');
  }
  if (['1', '2', '3'].includes(space.floor)) {
    preserving.push('Mid-level privacy balance');
  }
  
  // DRAINING (negative attributes)
  if (space.area_m2 < 35) {
    draining.push('Spatial compression');
  }
  if (['6+', 'attic'].includes(space.floor)) {
    draining.push('Vertical access dependency');
  }
  if (space.floor === 'basement') {
    draining.push('Natural light scarcity');
  }
  
  // Ensure at least one item in each category
  if (generating.length === 0) generating.push('Location accessibility');
  if (preserving.length === 0) preserving.push('Established neighborhood character');
  if (draining.length === 0) draining.push('Urban density trade-offs');
  
  return { generating, preserving, draining };
}

/**
 * Generate Signals (max 5-6)
 * Each signal has name, state, and short explanation
 */
function generateSignals(space: Space) {
  const signals: Array<{
    name: string;
    state: SignalState;
    short_explanation: string;
  }> = [];
  
  // Signal 1: Floor Position
  if (space.floor === 'ground') {
    signals.push({
      name: 'Ground-Level Living',
      state: 'positive',
      short_explanation: 'Direct access eliminates vertical dependency. Supports immediate street connection.'
    });
  } else if (['6+', 'attic'].includes(space.floor)) {
    signals.push({
      name: 'Elevated Access',
      state: 'sensitive',
      short_explanation: 'Requires consistent lift availability. Daily vertical navigation shapes routine.'
    });
  } else {
    signals.push({
      name: 'Mid-Floor Positioning',
      state: 'neutral',
      short_explanation: 'Balanced between ground accessibility and upper privacy. Standard urban experience.'
    });
  }
  
  // Signal 2: Spatial Capacity
  if (space.area_m2 > 70) {
    signals.push({
      name: 'Room to Breathe',
      state: 'positive',
      short_explanation: 'Space permits functional separation and storage flexibility. Supports multi-activity living.'
    });
  } else if (space.area_m2 < 35) {
    signals.push({
      name: 'Compact Footprint',
      state: 'sensitive',
      short_explanation: 'Every square meter counts. Requires disciplined organization and selective furniture.'
    });
  } else {
    signals.push({
      name: 'Standard Dimensions',
      state: 'neutral',
      short_explanation: 'Typical urban scale. Supports basic living functions without excess.'
    });
  }
  
  // Signal 3: Neighborhood Character
  const isCentral = ['Baixa', 'Chiado', 'Santos', 'Príncipe Real'].includes(space.neighborhood || '');
  if (isCentral) {
    signals.push({
      name: 'Central Gravity',
      state: 'positive',
      short_explanation: 'Walking distance to cultural and commercial infrastructure. Urban energy proximity.'
    });
  } else {
    signals.push({
      name: 'Residential Calm',
      state: 'neutral',
      short_explanation: 'Quieter neighborhood positioning. Prioritizes residential rhythm over immediate amenity access.'
    });
  }
  
  // Signal 4: Type-Specific
  if (space.property_type === 'Studio') {
    signals.push({
      name: 'Open-Plan Living',
      state: 'neutral',
      short_explanation: 'Single-space lifestyle. Requires intentional zoning through furniture and lighting.'
    });
  } else if (['T3', 'T4'].includes(space.property_type)) {
    signals.push({
      name: 'Room Abundance',
      state: 'positive',
      short_explanation: 'Multiple private zones enable household flexibility. Supports work-from-home and guests.'
    });
  }
  
  // Signal 5: Market Position (if listing price available)
  if (space.listing_price) {
    const pricePerSqm = space.listing_price / space.area_m2;
    if (pricePerSqm > 6000) {
      signals.push({
        name: 'Premium Positioning',
        state: 'sensitive',
        short_explanation: 'Price signals high market expectations. Property must deliver exceptional fundamentals.'
      });
    } else if (pricePerSqm < 3500) {
      signals.push({
        name: 'Value Entry Point',
        state: 'positive',
        short_explanation: 'Below-median pricing creates opportunity. May indicate negotiation flexibility.'
      });
    }
  }
  
  // Limit to 6 signals max
  return signals.slice(0, 6);
}

// ============================================================================
// PRO TIER EXTENSIONS (Rule-based)
// ============================================================================

function generateProExtensions(space: Space) {
  // Silence and Drift
  const silence_and_drift = {
    missing_elements: [
      'Actual light conditions across seasons',
      'Neighbor proximity and soundproofing quality',
      'Building maintenance history and upcoming works'
    ],
    hidden_risks: [
      space.floor === 'ground' ? 'Street-level noise and privacy exposure' : 'Lift dependency and breakdown response time',
      'Heating/cooling efficiency in actual use',
      'Storage limitations with typical furniture'
    ],
    overlooked_opportunities: [
      'Renovation potential within building regulations',
      'Comparable sales momentum in immediate area',
      'Neighborhood infrastructure development plans'
    ]
  };
  
  // Peer Gravity
  const peer_gravity = {
    comparable_segment: `${space.property_type} apartments in ${space.city} central areas`,
    perceived_position: space.area_m2 > 60 ? 'Premium positioned' : space.area_m2 < 40 ? 'Entry-level positioned' : 'Mid-market positioned',
    explanation: `Property competes with similar ${space.property_type} units. ${space.floor === 'ground' ? 'Ground access adds differentiation.' : 'Floor position is typical for segment.'}`
  };
  
  // Experience Tension
  const experience_tension = {
    compensations: [
      space.floor === 'ground' ? 'Ground access traded for reduced privacy' : 'Upper-floor privacy traded for lift dependency',
      space.area_m2 < 40 ? 'Compact scale traded for maintenance simplicity' : 'Larger space traded for higher utility costs'
    ],
    dependencies: [
      'Building management responsiveness',
      'Immediate neighborhood evolution',
      space.floor !== 'ground' ? 'Lift reliability and maintenance' : 'Street-level noise management'
    ]
  };
  
  // Strategic Risks
  const strategic_risks = {
    risks: [
      {
        risk: 'Resale liquidity in economic downturn',
        severity: space.area_m2 < 35 ? 'medium' : 'low' as 'low' | 'medium' | 'high',
        mitigation: 'Maintain property in competitive condition. Price aligned with comparable sales.'
      },
      {
        risk: 'Building aging and shared maintenance costs',
        severity: 'medium' as 'low' | 'medium' | 'high',
        mitigation: 'Review condominium reserves and maintenance history. Budget for collective works.'
      }
    ]
  };
  
  // Evidence
  const evidence = {
    photo_observations: [
      'Listing photos show staged furniture and enhanced lighting',
      'Room dimensions appear typical for property type',
      'Finishes suggest standard market positioning'
    ],
    listing_observations: [
      'Standard description language without unique differentiators',
      'Price positioning suggests normal market expectations',
      'Property type and location are primary value drivers'
    ]
  };
  
  return {
    silence_and_drift,
    peer_gravity,
    experience_tension,
    strategic_risks,
    evidence
  };
}

// ============================================================================
// LLM INTEGRATION POINTS
// ============================================================================

/**
 * Generate one-sentence editorial line (LLM-powered)
 * This is the ONLY LLM call for Normal tier
 */
async function generateOneSentence(
  space: Space,
  state: ExperienceState,
  trajectory: ExperienceTrajectory
): Promise<string> {
  // TODO: Replace with actual LLM call
  // For V0, return deterministic output based on state + trajectory
  
  const templates = {
    'Strong-Improving': `${space.property_type} combines strong fundamentals with upward momentum.`,
    'Strong-Stable': `${space.property_type} delivers consistent quality in established configuration.`,
    'Strong-Declining': `${space.property_type} maintains core strengths despite market pressure.`,
    'Balanced-Improving': `${space.property_type} shows promise as fundamentals strengthen.`,
    'Balanced-Stable': `${space.property_type} offers typical urban living without extremes.`,
    'Balanced-Declining': `${space.property_type} faces ordinary challenges in competitive segment.`,
    'Fragile-Improving': `${space.property_type} requires attention as it develops from weak base.`,
    'Fragile-Stable': `${space.property_type} maintains fragile equilibrium with ongoing dependencies.`,
    'Fragile-Declining': `${space.property_type} shows compounding vulnerabilities requiring mitigation.`,
  };
  
  const key = `${state}-${trajectory}` as keyof typeof templates;
  return templates[key] || `${space.property_type} presents typical urban living characteristics.`;
}

/**
 * Generate editorial summary paragraph (LLM-powered)
 * This is the SECOND LLM call (only for Pro tier)
 */
async function generateEditorialSummary(
  space: Space,
  state: ExperienceState,
  signals: any[]
): Promise<string> {
  // TODO: Replace with actual LLM call
  // For V0, return deterministic output based on signals
  
  const positiveCount = signals.filter(s => s.state === 'positive').length;
  const sensitiveCount = signals.filter(s => s.state === 'sensitive').length;
  
  if (positiveCount > sensitiveCount) {
    return `This ${space.property_type} in ${space.neighborhood || space.city} demonstrates balanced fundamentals. The ${Math.round(space.area_m2)}m² layout on floor ${space.floor} supports standard urban living patterns. Key strengths include spatial adequacy and neighborhood positioning. Standard urban trade-offs apply, requiring typical resident adaptations. Property functions within expected parameters for its category.`;
  } else if (sensitiveCount > positiveCount) {
    return `This ${space.property_type} requires careful evaluation of ${sensitiveCount} sensitive factors. The ${Math.round(space.area_m2)}m² space on floor ${space.floor} presents characteristic urban constraints. Residents should anticipate ongoing management of identified dependencies. Success here demands intentional lifestyle alignment with space limitations. Consider carefully before proceeding.`;
  } else {
    return `This ${space.property_type} presents standard characteristics for its category in ${space.neighborhood || space.city}. The ${Math.round(space.area_m2)}m² configuration on floor ${space.floor} neither excels nor disappoints significantly. Property delivers typical urban experience with predictable trade-offs. Suitable for buyers seeking conventional city living without distinctive features.`;
  }
}

// ============================================================================
// MAIN GENERATOR FUNCTION
// ============================================================================

export async function generateCertificate(
  inputs: GeneratorInputs
): Promise<GeneratorResult> {
  try {
    const { space, tier } = inputs;
    
    // Step 1: Calculate deterministic attributes
    const state = inputs.overrides?.state || calculateExperienceState(space);
    const trajectory = inputs.overrides?.trajectory || calculateTrajectory(space);
    const experience_capital = generateExperienceCapital(space);
    const signals = generateSignals(space);
    
    // Step 2: Generate LLM-powered content
    const one_sentence = await generateOneSentence(space, state, trajectory);
    const editorial_summary = await generateEditorialSummary(space, state, signals);
    
    // Step 3: Build base certificate
    const baseCertificate: NormalCertificate = {
      meta: {
        id: crypto.randomUUID(),
        tier: 'normal',
        version: '1.0.0',
        generated_at: new Date().toISOString()
      },
      property_identity: {
        title: `${space.property_type} in ${space.neighborhood || space.city}`,
        city: space.city,
        property_type: space.property_type,
        area_m2: space.area_m2,
        floor: space.floor
      },
      experience_barometer: {
        state,
        trajectory,
        one_sentence
      },
      experience_capital,
      signals,
      editorial_summary
    };
    
    // Step 4: If Pro tier, add extensions
    if (tier === 'pro') {
      const proExtensions = generateProExtensions(space);
      const proCertificate: ProCertificate = {
        ...baseCertificate,
        ...proExtensions,
        meta: {
          ...baseCertificate.meta,
          tier: 'pro'
        }
      };
      
      return {
        success: true,
        certificate: proCertificate
      };
    }
    
    // Step 5: Return normal certificate
    return {
      success: true,
      certificate: baseCertificate
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during generation'
    };
  }
}

// ============================================================================
// HELPER: Validate Space Data
// ============================================================================

export function validateSpace(space: Partial<Space>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!space.name) errors.push('name is required');
  if (!space.city) errors.push('city is required');
  if (!space.property_type) errors.push('property_type is required');
  if (!space.floor) errors.push('floor is required');
  if (!space.area_m2 || space.area_m2 <= 0) errors.push('area_m2 must be positive');
  
  return {
    valid: errors.length === 0,
    errors
  };
}
