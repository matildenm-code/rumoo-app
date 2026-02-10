-- RUMOO CERTIFICATE ENGINE V0 - DATABASE SCHEMA
-- Minimal, clean schema supporting both Normal and Pro tiers

-- Create enum types
CREATE TYPE certificate_tier AS ENUM ('normal', 'pro');
CREATE TYPE certificate_status AS ENUM ('pending', 'processing', 'done', 'error');
CREATE TYPE property_type AS ENUM ('T0', 'T1', 'T2', 'T3', 'T4', 'Studio', 'Loft', 'Duplex');
CREATE TYPE floor_type AS ENUM ('ground', 'basement', '1', '2', '3', '4', '5', '6+', 'attic');

-- SPACES TABLE
-- Represents physical properties/listings
CREATE TABLE spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    name TEXT NOT NULL,
    address_label TEXT NOT NULL, -- "Largo do Mastro, Pena (Arroios)"
    
    -- Location
    city TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Portugal',
    neighborhood TEXT,
    
    -- Physical attributes
    property_type property_type NOT NULL,
    floor floor_type NOT NULL,
    area_m2 NUMERIC(6,2) NOT NULL CHECK (area_m2 > 0),
    
    -- Market
    listing_price NUMERIC(10,2), -- Can be null if not listed
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CERTIFICATES TABLE
-- Stores generated certificates (both normal and pro)
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    
    -- Certificate metadata
    tier certificate_tier NOT NULL,
    status certificate_status NOT NULL DEFAULT 'pending',
    version TEXT NOT NULL DEFAULT '1.0.0',
    
    -- Generated content
    certificate_json JSONB NOT NULL DEFAULT '{}',
    
    -- Source tracking (for debugging/reprocessing)
    source_inputs_json JSONB, -- Store raw inputs used for generation
    
    -- Error tracking
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ -- When status became 'done'
);

-- INDEXES for performance
CREATE INDEX idx_spaces_city ON spaces(city);
CREATE INDEX idx_spaces_property_type ON spaces(property_type);
CREATE INDEX idx_certificates_space_id ON certificates(space_id);
CREATE INDEX idx_certificates_tier ON certificates(tier);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_created_at ON certificates(created_at DESC);

-- Composite index for common query pattern
CREATE INDEX idx_certificates_space_tier ON certificates(space_id, tier);

-- TRIGGER: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_spaces_updated_at
    BEFORE UPDATE ON spaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
    BEFORE UPDATE ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- VIEWS for common queries
CREATE VIEW latest_certificates AS
SELECT 
    c.*,
    s.name as space_name,
    s.city,
    s.neighborhood,
    s.property_type,
    ROW_NUMBER() OVER (PARTITION BY c.space_id, c.tier ORDER BY c.created_at DESC) as rn
FROM certificates c
JOIN spaces s ON c.space_id = s.id
WHERE c.status = 'done';

-- Get only the latest certificate per space per tier
CREATE VIEW current_certificates AS
SELECT * FROM latest_certificates WHERE rn = 1;

-- COMMENTS for documentation
COMMENT ON TABLE spaces IS 'Physical properties/listings to be analyzed';
COMMENT ON TABLE certificates IS 'Generated Rumoo certificates (supports both normal and pro tiers)';
COMMENT ON COLUMN certificates.certificate_json IS 'Complete certificate output as structured JSON';
COMMENT ON COLUMN certificates.source_inputs_json IS 'Raw inputs used for generation (for debugging/audit)';
COMMENT ON COLUMN certificates.tier IS 'normal = consumer tier, pro = realtor tier with extended analysis';
