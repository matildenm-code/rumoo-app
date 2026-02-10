-- RUMOO CERTIFICATE ENGINE V0 - SEED DATA
-- 3 diverse properties with generated certificates (both normal and pro)

-- ============================================================================
-- SEED SPACES
-- ============================================================================

-- Space 1: Ground floor T1 in central city
INSERT INTO spaces (
    id,
    name,
    address_label,
    city,
    country,
    neighborhood,
    property_type,
    floor,
    area_m2,
    listing_price
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Ground Floor T1 in Baixa',
    'Rua da Prata, 89',
    'Lisboa',
    'Portugal',
    'Baixa',
    'T1',
    'ground',
    42.00,
    320000
);

-- Space 2: Bright T2 in quiet residential area
INSERT INTO spaces (
    id,
    name,
    address_label,
    city,
    country,
    neighborhood,
    property_type,
    floor,
    area_m2,
    listing_price
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'Spacious T2 in Campo de Ourique',
    'Rua Correia Teles, 45',
    'Lisboa',
    'Portugal',
    'Campo de Ourique',
    'T2',
    '3',
    68.50,
    425000
);

-- Space 3: Small studio in premium but noisy area
INSERT INTO spaces (
    id,
    name,
    address_label,
    city,
    country,
    neighborhood,
    property_type,
    floor,
    area_m2,
    listing_price
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    'Compact Studio in Chiado',
    'Largo do Chiado, 12',
    'Lisboa',
    'Portugal',
    'Chiado',
    'Studio',
    '5',
    28.00,
    245000
);

-- ============================================================================
-- SEED CERTIFICATES - Space 1 (Ground Floor T1 in Baixa)
-- ============================================================================

-- Normal Certificate
INSERT INTO certificates (
    id,
    space_id,
    tier,
    status,
    version,
    certificate_json,
    completed_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440001'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'normal',
    'done',
    '1.0.0',
    '{
      "meta": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "tier": "normal",
        "version": "1.0.0",
        "generated_at": "2026-02-09T10:00:00Z"
      },
      "property_identity": {
        "title": "T1 in Baixa",
        "city": "Lisboa",
        "property_type": "T1",
        "area_m2": 42.0,
        "floor": "ground"
      },
      "experience_barometer": {
        "state": "Strong",
        "trajectory": "Stable",
        "one_sentence": "T1 combines strong fundamentals with central positioning."
      },
      "experience_capital": {
        "generating": [
          "Direct street access",
          "Central urban energy"
        ],
        "preserving": [
          "Standard layout familiarity",
          "Manageable maintenance scale"
        ],
        "draining": [
          "Urban density trade-offs"
        ]
      },
      "signals": [
        {
          "name": "Ground-Level Living",
          "state": "positive",
          "short_explanation": "Direct access eliminates vertical dependency. Supports immediate street connection."
        },
        {
          "name": "Standard Dimensions",
          "state": "neutral",
          "short_explanation": "Typical urban scale. Supports basic living functions without excess."
        },
        {
          "name": "Central Gravity",
          "state": "positive",
          "short_explanation": "Walking distance to cultural and commercial infrastructure. Urban energy proximity."
        },
        {
          "name": "Premium Positioning",
          "state": "sensitive",
          "short_explanation": "Price signals high market expectations. Property must deliver exceptional fundamentals."
        }
      ],
      "editorial_summary": "This T1 in Baixa demonstrates balanced fundamentals. The 42m² layout on ground floor supports standard urban living patterns. Key strengths include direct access and neighborhood positioning. Standard urban trade-offs apply, requiring typical resident adaptations. Property functions within expected parameters for its category."
    }'::jsonb,
    NOW()
);

-- Pro Certificate
INSERT INTO certificates (
    id,
    space_id,
    tier,
    status,
    version,
    certificate_json,
    completed_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440011'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'pro',
    'done',
    '1.0.0',
    '{
      "meta": {
        "id": "660e8400-e29b-41d4-a716-446655440011",
        "tier": "pro",
        "version": "1.0.0",
        "generated_at": "2026-02-09T10:05:00Z"
      },
      "property_identity": {
        "title": "T1 in Baixa",
        "city": "Lisboa",
        "property_type": "T1",
        "area_m2": 42.0,
        "floor": "ground"
      },
      "experience_barometer": {
        "state": "Strong",
        "trajectory": "Stable",
        "one_sentence": "T1 combines strong fundamentals with central positioning."
      },
      "experience_capital": {
        "generating": ["Direct street access", "Central urban energy"],
        "preserving": ["Standard layout familiarity", "Manageable maintenance scale"],
        "draining": ["Urban density trade-offs"]
      },
      "signals": [
        {
          "name": "Ground-Level Living",
          "state": "positive",
          "short_explanation": "Direct access eliminates vertical dependency. Supports immediate street connection."
        },
        {
          "name": "Standard Dimensions",
          "state": "neutral",
          "short_explanation": "Typical urban scale. Supports basic living functions without excess."
        },
        {
          "name": "Central Gravity",
          "state": "positive",
          "short_explanation": "Walking distance to cultural and commercial infrastructure. Urban energy proximity."
        },
        {
          "name": "Premium Positioning",
          "state": "sensitive",
          "short_explanation": "Price signals high market expectations. Property must deliver exceptional fundamentals."
        }
      ],
      "editorial_summary": "This T1 in Baixa demonstrates balanced fundamentals. The 42m² layout on ground floor supports standard urban living patterns. Key strengths include direct access and neighborhood positioning. Standard urban trade-offs apply, requiring typical resident adaptations. Property functions within expected parameters for its category.",
      "silence_and_drift": {
        "missing_elements": [
          "Actual light conditions across seasons",
          "Neighbor proximity and soundproofing quality",
          "Building maintenance history and upcoming works"
        ],
        "hidden_risks": [
          "Street-level noise and privacy exposure",
          "Heating/cooling efficiency in actual use",
          "Storage limitations with typical furniture"
        ],
        "overlooked_opportunities": [
          "Renovation potential within building regulations",
          "Comparable sales momentum in immediate area",
          "Neighborhood infrastructure development plans"
        ]
      },
      "peer_gravity": {
        "comparable_segment": "T1 apartments in Lisboa central areas",
        "perceived_position": "Mid-market positioned",
        "explanation": "Property competes with similar T1 units. Ground access adds differentiation."
      },
      "experience_tension": {
        "compensations": [
          "Ground access traded for reduced privacy",
          "Compact scale traded for maintenance simplicity"
        ],
        "dependencies": [
          "Building management responsiveness",
          "Immediate neighborhood evolution",
          "Street-level noise management"
        ]
      },
      "strategic_risks": {
        "risks": [
          {
            "risk": "Resale liquidity in economic downturn",
            "severity": "low",
            "mitigation": "Maintain property in competitive condition. Price aligned with comparable sales."
          },
          {
            "risk": "Building aging and shared maintenance costs",
            "severity": "medium",
            "mitigation": "Review condominium reserves and maintenance history. Budget for collective works."
          }
        ]
      },
      "evidence": {
        "photo_observations": [
          "Listing photos show staged furniture and enhanced lighting",
          "Room dimensions appear typical for property type",
          "Finishes suggest standard market positioning"
        ],
        "listing_observations": [
          "Standard description language without unique differentiators",
          "Price positioning suggests normal market expectations",
          "Property type and location are primary value drivers"
        ]
      }
    }'::jsonb,
    NOW()
);

-- ============================================================================
-- SEED CERTIFICATES - Space 2 (Bright T2 in Campo de Ourique)
-- ============================================================================

-- Normal Certificate
INSERT INTO certificates (
    id,
    space_id,
    tier,
    status,
    version,
    certificate_json,
    completed_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440002'::uuid,
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'normal',
    'done',
    '1.0.0',
    '{
      "meta": {
        "id": "660e8400-e29b-41d4-a716-446655440002",
        "tier": "normal",
        "version": "1.0.0",
        "generated_at": "2026-02-09T10:10:00Z"
      },
      "property_identity": {
        "title": "T2 in Campo de Ourique",
        "city": "Lisboa",
        "property_type": "T2",
        "area_m2": 68.5,
        "floor": "3"
      },
      "experience_barometer": {
        "state": "Strong",
        "trajectory": "Stable",
        "one_sentence": "T2 delivers consistent quality in established configuration."
      },
      "experience_capital": {
        "generating": [
          "Generous living space"
        ],
        "preserving": [
          "Standard layout familiarity",
          "Manageable maintenance scale",
          "Mid-level privacy balance"
        ],
        "draining": [
          "Urban density trade-offs"
        ]
      },
      "signals": [
        {
          "name": "Mid-Floor Positioning",
          "state": "neutral",
          "short_explanation": "Balanced between ground accessibility and upper privacy. Standard urban experience."
        },
        {
          "name": "Room to Breathe",
          "state": "positive",
          "short_explanation": "Space permits functional separation and storage flexibility. Supports multi-activity living."
        },
        {
          "name": "Residential Calm",
          "state": "neutral",
          "short_explanation": "Quieter neighborhood positioning. Prioritizes residential rhythm over immediate amenity access."
        }
      ],
      "editorial_summary": "This T2 in Campo de Ourique demonstrates balanced fundamentals. The 69m² layout on floor 3 supports standard urban living patterns. Key strengths include spatial adequacy and neighborhood positioning. Standard urban trade-offs apply, requiring typical resident adaptations. Property functions within expected parameters for its category."
    }'::jsonb,
    NOW()
);

-- Pro Certificate (Space 2)
INSERT INTO certificates (
    id,
    space_id,
    tier,
    status,
    version,
    certificate_json,
    completed_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440012'::uuid,
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'pro',
    'done',
    '1.0.0',
    '{
      "meta": {
        "id": "660e8400-e29b-41d4-a716-446655440012",
        "tier": "pro",
        "version": "1.0.0",
        "generated_at": "2026-02-09T10:15:00Z"
      },
      "property_identity": {
        "title": "T2 in Campo de Ourique",
        "city": "Lisboa",
        "property_type": "T2",
        "area_m2": 68.5,
        "floor": "3"
      },
      "experience_barometer": {
        "state": "Strong",
        "trajectory": "Stable",
        "one_sentence": "T2 delivers consistent quality in established configuration."
      },
      "experience_capital": {
        "generating": ["Generous living space"],
        "preserving": ["Standard layout familiarity", "Manageable maintenance scale", "Mid-level privacy balance"],
        "draining": ["Urban density trade-offs"]
      },
      "signals": [
        {
          "name": "Mid-Floor Positioning",
          "state": "neutral",
          "short_explanation": "Balanced between ground accessibility and upper privacy. Standard urban experience."
        },
        {
          "name": "Room to Breathe",
          "state": "positive",
          "short_explanation": "Space permits functional separation and storage flexibility. Supports multi-activity living."
        },
        {
          "name": "Residential Calm",
          "state": "neutral",
          "short_explanation": "Quieter neighborhood positioning. Prioritizes residential rhythm over immediate amenity access."
        }
      ],
      "editorial_summary": "This T2 in Campo de Ourique demonstrates balanced fundamentals. The 69m² layout on floor 3 supports standard urban living patterns. Key strengths include spatial adequacy and neighborhood positioning. Standard urban trade-offs apply, requiring typical resident adaptations. Property functions within expected parameters for its category.",
      "silence_and_drift": {
        "missing_elements": [
          "Actual light conditions across seasons",
          "Neighbor proximity and soundproofing quality",
          "Building maintenance history and upcoming works"
        ],
        "hidden_risks": [
          "Lift dependency and breakdown response time",
          "Heating/cooling efficiency in actual use",
          "Storage limitations with typical furniture"
        ],
        "overlooked_opportunities": [
          "Renovation potential within building regulations",
          "Comparable sales momentum in immediate area",
          "Neighborhood infrastructure development plans"
        ]
      },
      "peer_gravity": {
        "comparable_segment": "T2 apartments in Lisboa central areas",
        "perceived_position": "Premium positioned",
        "explanation": "Property competes with similar T2 units. Floor position is typical for segment."
      },
      "experience_tension": {
        "compensations": [
          "Upper-floor privacy traded for lift dependency",
          "Larger space traded for higher utility costs"
        ],
        "dependencies": [
          "Building management responsiveness",
          "Immediate neighborhood evolution",
          "Lift reliability and maintenance"
        ]
      },
      "strategic_risks": {
        "risks": [
          {
            "risk": "Resale liquidity in economic downturn",
            "severity": "low",
            "mitigation": "Maintain property in competitive condition. Price aligned with comparable sales."
          },
          {
            "risk": "Building aging and shared maintenance costs",
            "severity": "medium",
            "mitigation": "Review condominium reserves and maintenance history. Budget for collective works."
          }
        ]
      },
      "evidence": {
        "photo_observations": [
          "Listing photos show staged furniture and enhanced lighting",
          "Room dimensions appear typical for property type",
          "Finishes suggest standard market positioning"
        ],
        "listing_observations": [
          "Standard description language without unique differentiators",
          "Price positioning suggests normal market expectations",
          "Property type and location are primary value drivers"
        ]
      }
    }'::jsonb,
    NOW()
);

-- ============================================================================
-- SEED CERTIFICATES - Space 3 (Compact Studio in Chiado)
-- ============================================================================

-- Normal Certificate
INSERT INTO certificates (
    id,
    space_id,
    tier,
    status,
    version,
    certificate_json,
    completed_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440003'::uuid,
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    'normal',
    'done',
    '1.0.0',
    '{
      "meta": {
        "id": "660e8400-e29b-41d4-a716-446655440003",
        "tier": "normal",
        "version": "1.0.0",
        "generated_at": "2026-02-09T10:20:00Z"
      },
      "property_identity": {
        "title": "Studio in Chiado",
        "city": "Lisboa",
        "property_type": "Studio",
        "area_m2": 28.0,
        "floor": "5"
      },
      "experience_barometer": {
        "state": "Fragile",
        "trajectory": "Stable",
        "one_sentence": "Studio maintains fragile equilibrium with ongoing dependencies."
      },
      "experience_capital": {
        "generating": [
          "Central urban energy"
        ],
        "preserving": [
          "Manageable maintenance scale"
        ],
        "draining": [
          "Spatial compression",
          "Vertical access dependency"
        ]
      },
      "signals": [
        {
          "name": "Elevated Access",
          "state": "sensitive",
          "short_explanation": "Requires consistent lift availability. Daily vertical navigation shapes routine."
        },
        {
          "name": "Compact Footprint",
          "state": "sensitive",
          "short_explanation": "Every square meter counts. Requires disciplined organization and selective furniture."
        },
        {
          "name": "Central Gravity",
          "state": "positive",
          "short_explanation": "Walking distance to cultural and commercial infrastructure. Urban energy proximity."
        },
        {
          "name": "Open-Plan Living",
          "state": "neutral",
          "short_explanation": "Single-space lifestyle. Requires intentional zoning through furniture and lighting."
        },
        {
          "name": "Premium Positioning",
          "state": "sensitive",
          "short_explanation": "Price signals high market expectations. Property must deliver exceptional fundamentals."
        }
      ],
      "editorial_summary": "This Studio requires careful evaluation of 3 sensitive factors. The 28m² space on floor 5 presents characteristic urban constraints. Residents should anticipate ongoing management of identified dependencies. Success here demands intentional lifestyle alignment with space limitations. Consider carefully before proceeding."
    }'::jsonb,
    NOW()
);

-- Pro Certificate (Space 3)
INSERT INTO certificates (
    id,
    space_id,
    tier,
    status,
    version,
    certificate_json,
    completed_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440013'::uuid,
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    'pro',
    'done',
    '1.0.0',
    '{
      "meta": {
        "id": "660e8400-e29b-41d4-a716-446655440013",
        "tier": "pro",
        "version": "1.0.0",
        "generated_at": "2026-02-09T10:25:00Z"
      },
      "property_identity": {
        "title": "Studio in Chiado",
        "city": "Lisboa",
        "property_type": "Studio",
        "area_m2": 28.0,
        "floor": "5"
      },
      "experience_barometer": {
        "state": "Fragile",
        "trajectory": "Stable",
        "one_sentence": "Studio maintains fragile equilibrium with ongoing dependencies."
      },
      "experience_capital": {
        "generating": ["Central urban energy"],
        "preserving": ["Manageable maintenance scale"],
        "draining": ["Spatial compression", "Vertical access dependency"]
      },
      "signals": [
        {
          "name": "Elevated Access",
          "state": "sensitive",
          "short_explanation": "Requires consistent lift availability. Daily vertical navigation shapes routine."
        },
        {
          "name": "Compact Footprint",
          "state": "sensitive",
          "short_explanation": "Every square meter counts. Requires disciplined organization and selective furniture."
        },
        {
          "name": "Central Gravity",
          "state": "positive",
          "short_explanation": "Walking distance to cultural and commercial infrastructure. Urban energy proximity."
        },
        {
          "name": "Open-Plan Living",
          "state": "neutral",
          "short_explanation": "Single-space lifestyle. Requires intentional zoning through furniture and lighting."
        },
        {
          "name": "Premium Positioning",
          "state": "sensitive",
          "short_explanation": "Price signals high market expectations. Property must deliver exceptional fundamentals."
        }
      ],
      "editorial_summary": "This Studio requires careful evaluation of 3 sensitive factors. The 28m² space on floor 5 presents characteristic urban constraints. Residents should anticipate ongoing management of identified dependencies. Success here demands intentional lifestyle alignment with space limitations. Consider carefully before proceeding.",
      "silence_and_drift": {
        "missing_elements": [
          "Actual light conditions across seasons",
          "Neighbor proximity and soundproofing quality",
          "Building maintenance history and upcoming works"
        ],
        "hidden_risks": [
          "Lift dependency and breakdown response time",
          "Heating/cooling efficiency in actual use",
          "Storage limitations with typical furniture"
        ],
        "overlooked_opportunities": [
          "Renovation potential within building regulations",
          "Comparable sales momentum in immediate area",
          "Neighborhood infrastructure development plans"
        ]
      },
      "peer_gravity": {
        "comparable_segment": "Studio apartments in Lisboa central areas",
        "perceived_position": "Entry-level positioned",
        "explanation": "Property competes with similar Studio units. Floor position is typical for segment."
      },
      "experience_tension": {
        "compensations": [
          "Upper-floor privacy traded for lift dependency",
          "Compact scale traded for maintenance simplicity"
        ],
        "dependencies": [
          "Building management responsiveness",
          "Immediate neighborhood evolution",
          "Lift reliability and maintenance"
        ]
      },
      "strategic_risks": {
        "risks": [
          {
            "risk": "Resale liquidity in economic downturn",
            "severity": "medium",
            "mitigation": "Maintain property in competitive condition. Price aligned with comparable sales."
          },
          {
            "risk": "Building aging and shared maintenance costs",
            "severity": "medium",
            "mitigation": "Review condominium reserves and maintenance history. Budget for collective works."
          }
        ]
      },
      "evidence": {
        "photo_observations": [
          "Listing photos show staged furniture and enhanced lighting",
          "Room dimensions appear typical for property type",
          "Finishes suggest standard market positioning"
        ],
        "listing_observations": [
          "Standard description language without unique differentiators",
          "Price positioning suggests normal market expectations",
          "Property type and location are primary value drivers"
        ]
      }
    }'::jsonb,
    NOW()
);

-- Verify seed data
SELECT 'Seed data created successfully!' as status;
SELECT COUNT(*) as total_spaces FROM spaces;
SELECT COUNT(*) as total_certificates FROM certificates;
SELECT tier, COUNT(*) as count FROM certificates GROUP BY tier;
