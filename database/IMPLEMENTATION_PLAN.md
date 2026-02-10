# RUMOO CERTIFICATE ENGINE V0 - IMPLEMENTATION PLAN

## Overview

We've designed a **single unified engine** that generates both Normal and Pro tier certificates from one codebase, avoiding duplication while supporting tier-specific extensions.

**Key Principles:**
- ✅ ONE engine, ONE JSON schema, TWO tiers
- ✅ Rule-based logic (90%) + LLM enhancement (10%)
- ✅ Type-safe TypeScript
- ✅ Clean separation: Base certificate + Pro extensions
- ✅ Non-marketing, editorial tone throughout

---

## Phase 1: Database Setup (Day 1)

### 1.1 Create Supabase Tables

```bash
# Run schema in Supabase SQL Editor
# File: rumoo-certificate-schema.sql
```

**Tables created:**
- `spaces` - Property data
- `certificates` - Generated certificates with JSONB storage

**Key features:**
- Enums for type safety (tier, status, property_type, floor_type)
- Indexes for performance
- Auto-updating timestamps
- Views for common queries

### 1.2 Load Seed Data

```bash
# Run seed script in Supabase
# File: rumoo-certificate-seed.sql
```

**Seed includes:**
- 3 diverse properties
- 6 certificates (2 per property: normal + pro)
- Ready for immediate testing

---

## Phase 2: Core Generator (Days 2-3)

### 2.1 Set Up Types

```bash
# Copy into your Next.js project
cp rumoo-certificate-types.ts app/lib/types/certificate.ts
```

**What you get:**
- Complete TypeScript definitions
- Type guards for tier checking
- Database entity types
- Generator input/output types

### 2.2 Implement Generator Logic

```bash
# Copy generator into your project
cp rumoo-certificate-generator.ts app/lib/certificate-generator.ts
```

**Functions to integrate:**

1. **Rule-Based Analysis** (already implemented):
   - `calculateExperienceState()` 
   - `calculateTrajectory()`
   - `generateExperienceCapital()`
   - `generateSignals()`
   - `generateProExtensions()`

2. **LLM Integration Points** (TODO):
   ```typescript
   // Replace stub implementations with actual LLM calls
   async function generateOneSentence(space, state, trajectory) {
     // Call OpenAI API or Anthropic API
     // System prompt: "You are an analytical real estate editor..."
     // User prompt: "Write one editorial sentence for a {property_type}..."
   }
   
   async function generateEditorialSummary(space, state, signals) {
     // Call LLM for paragraph summary
     // Must be: non-marketing, analytical, evidence-based
   }
   ```

### 2.3 Test Generator Locally

```typescript
// test/generator.test.ts
import { generateCertificate } from '@/lib/certificate-generator';

const testSpace = {
  id: 'test-123',
  name: 'Test T1',
  city: 'Lisboa',
  property_type: 'T1',
  floor: 'ground',
  area_m2: 45,
  // ... other fields
};

// Test normal tier
const normalResult = await generateCertificate({
  space: testSpace,
  tier: 'normal'
});

// Test pro tier
const proResult = await generateCertificate({
  space: testSpace,
  tier: 'pro'
});

// Verify structure
console.log(normalResult.certificate);
console.log(proResult.certificate.silence_and_drift); // Pro-only field
```

---

## Phase 3: API Endpoints (Days 4-5)

### 3.1 Create Spaces Endpoints

**File:** `app/api/spaces/route.ts`

```typescript
// POST /api/spaces - Create space
export async function POST(request: Request) {
  const body = await request.json();
  const { data, error } = await supabase
    .from('spaces')
    .insert(body)
    .select()
    .single();
  return Response.json(data);
}

// GET /api/spaces - List spaces
export async function GET(request: Request) {
  const { data } = await supabase
    .from('spaces')
    .select('*')
    .order('created_at', { ascending: false });
  return Response.json({ spaces: data });
}
```

**File:** `app/api/spaces/[id]/route.ts`

```typescript
// GET /api/spaces/:id - Get space with certificates
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Fetch space
  const { data: space } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', params.id)
    .single();
  
  // Fetch certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select('id, tier, status, created_at')
    .eq('space_id', params.id)
    .order('created_at', { ascending: false });
  
  return Response.json({ ...space, certificates });
}
```

### 3.2 Create Certificate Generation Endpoint

**File:** `app/api/spaces/[id]/generate-certificate/route.ts`

```typescript
import { generateCertificate } from '@/lib/certificate-generator';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Get tier from query params
  const url = new URL(request.url);
  const tier = url.searchParams.get('tier') as 'normal' | 'pro';
  
  if (!tier || !['normal', 'pro'].includes(tier)) {
    return Response.json(
      { error: 'Invalid tier. Must be "normal" or "pro"' },
      { status: 400 }
    );
  }
  
  // 2. Fetch space
  const { data: space, error: spaceError } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', params.id)
    .single();
  
  if (spaceError) {
    return Response.json(
      { error: 'Space not found' },
      { status: 404 }
    );
  }
  
  // 3. Create certificate record (status=processing)
  const { data: certRecord, error: certError } = await supabase
    .from('certificates')
    .insert({
      space_id: space.id,
      tier,
      status: 'processing'
    })
    .select()
    .single();
  
  try {
    // 4. Generate certificate
    const result = await generateCertificate({
      space,
      tier
    });
    
    if (!result.success || !result.certificate) {
      throw new Error(result.error || 'Generation failed');
    }
    
    // 5. Save certificate JSON
    const { data: updated } = await supabase
      .from('certificates')
      .update({
        status: 'done',
        certificate_json: result.certificate,
        completed_at: new Date().toISOString()
      })
      .eq('id', certRecord.id)
      .select()
      .single();
    
    // 6. Return certificate
    return Response.json({
      certificate_id: updated.id,
      status: 'done',
      certificate: result.certificate
    }, { status: 201 });
    
  } catch (error) {
    // Update status to error
    await supabase
      .from('certificates')
      .update({
        status: 'error',
        error_message: error.message
      })
      .eq('id', certRecord.id);
    
    return Response.json(
      { error: 'Generation failed', details: error.message },
      { status: 500 }
    );
  }
}
```

### 3.3 Create Certificate Retrieval Endpoint

**File:** `app/api/certificates/[id]/route.ts`

```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', params.id)
    .single();
  
  if (error) {
    return Response.json(
      { error: 'Certificate not found' },
      { status: 404 }
    );
  }
  
  return Response.json({
    id: data.id,
    space_id: data.space_id,
    tier: data.tier,
    status: data.status,
    version: data.version,
    certificate: data.certificate_json,
    created_at: data.created_at,
    completed_at: data.completed_at
  });
}
```

---

## Phase 4: Frontend Integration (Days 6-7)

### 4.1 Certificate Display Components

**File:** `app/components/certificate/CertificateViewer.tsx`

```typescript
'use client';

import type { Certificate } from '@/lib/types/certificate';
import { isProCertificate } from '@/lib/types/certificate';

export function CertificateViewer({ certificate }: { certificate: Certificate }) {
  const isPro = isProCertificate(certificate);
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Meta Header */}
      <CertificateMeta meta={certificate.meta} />
      
      {/* Property Identity */}
      <PropertyIdentity identity={certificate.property_identity} />
      
      {/* Experience Barometer */}
      <ExperienceBarometer barometer={certificate.experience_barometer} />
      
      {/* Experience Capital */}
      <ExperienceCapital capital={certificate.experience_capital} />
      
      {/* Signals */}
      <Signals signals={certificate.signals} />
      
      {/* Editorial Summary */}
      <EditorialSummary summary={certificate.editorial_summary} />
      
      {/* Pro Extensions (conditional) */}
      {isPro && (
        <>
          <SilenceAndDrift data={certificate.silence_and_drift} />
          <PeerGravity data={certificate.peer_gravity} />
          <ExperienceTension data={certificate.experience_tension} />
          <StrategicRisks data={certificate.strategic_risks} />
          <Evidence data={certificate.evidence} />
        </>
      )}
    </div>
  );
}
```

### 4.2 Certificate Page Route

**File:** `app/certificates/[id]/page.tsx`

```typescript
import { CertificateViewer } from '@/components/certificate/CertificateViewer';

export default async function CertificatePage({
  params
}: {
  params: { id: string }
}) {
  // Fetch certificate from API
  const res = await fetch(`/api/certificates/${params.id}`);
  const data = await res.json();
  
  return <CertificateViewer certificate={data.certificate} />;
}
```

---

## Phase 5: Testing & Validation (Day 8)

### 5.1 Test Certificate Generation

```bash
# Test all 3 seed spaces
curl -X POST http://localhost:3000/api/spaces/550e8400-e29b-41d4-a716-446655440001/generate-certificate?tier=normal

curl -X POST http://localhost:3000/api/spaces/550e8400-e29b-41d4-a716-446655440001/generate-certificate?tier=pro
```

### 5.2 Validation Checklist

**Normal Tier Certificate:**
- [ ] Contains all base fields (meta, property_identity, barometer, capital, signals, summary)
- [ ] Does NOT contain pro-only fields
- [ ] Signals limited to 5-6 max
- [ ] Tone is analytical, not marketing
- [ ] All text fields populated

**Pro Tier Certificate:**
- [ ] Contains all base fields
- [ ] Contains all pro extensions (silence_and_drift, peer_gravity, etc.)
- [ ] Pro fields have meaningful content (not placeholder text)
- [ ] Maintains same analytical tone
- [ ] Evidence section cites specific observations

**Cross-Tier Consistency:**
- [ ] Same space generates consistent base data in both tiers
- [ ] One-sentence and summary are identical between tiers
- [ ] Only pro-specific fields differ

---

## Phase 6: LLM Integration (Days 9-10)

### 6.1 Add OpenAI Integration

```typescript
// lib/llm/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateEditorialLine(
  space: Space,
  state: ExperienceState,
  trajectory: ExperienceTrajectory
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an analytical real estate editor. Write ONE editorial sentence about a property's experience quality. Be direct, analytical, and avoid marketing language. Focus on fundamentals and trajectory.`
      },
      {
        role: 'user',
        content: `Property: ${space.property_type} in ${space.city}
Area: ${space.area_m2}m²
Floor: ${space.floor}
Experience State: ${state}
Trajectory: ${trajectory}

Write one analytical sentence capturing this property's essence.`
      }
    ],
    temperature: 0.3,
    max_tokens: 50
  });
  
  return response.choices[0].message.content || 'Property analysis pending.';
}
```

### 6.2 Replace Stub Functions

Update `generateOneSentence()` and `generateEditorialSummary()` in generator to use actual LLM calls.

---

## Phase 7: Deployment Checklist

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
```

### Pre-Deploy Checks

- [ ] Database schema deployed to Supabase
- [ ] Seed data loaded
- [ ] All API endpoints tested
- [ ] LLM integration working
- [ ] Frontend displays certificates correctly
- [ ] Both tiers generate successfully
- [ ] Type safety verified (no TypeScript errors)

---

## Success Metrics

**Technical:**
- Certificate generation: <2 seconds
- Type-safe throughout (zero `any` types in prod)
- Zero duplication between tiers (single engine)
- Clean JSON schema (frontend can parse without transformation)

**Content Quality:**
- Analytical tone (not marketing)
- Internally consistent (signals align with summary)
- No contradictions between sections
- Pro tier adds value (not just filler)

---

## What's Next (Post-V0)

1. **Add photo analysis** (when photos available)
2. **Neighborhood data integration** (walkability, noise maps)
3. **Historical data** (price trends, time on market)
4. **User feedback loop** (validate predictions)
5. **Async generation** (move to job queue for scale)

---

## File Summary

You now have:

1. ✅ **Schema** (`rumoo-certificate-schema.sql`) - Database tables
2. ✅ **Types** (`rumoo-certificate-types.ts`) - TypeScript definitions
3. ✅ **Generator** (`rumoo-certificate-generator.ts`) - Core logic
4. ✅ **API Spec** (`rumoo-certificate-api-spec.ts`) - Endpoint documentation
5. ✅ **Seed Data** (`rumoo-certificate-seed.sql`) - Test data
6. ✅ **Implementation Plan** (this document) - Step-by-step guide

**Ready to build!** 🚀
