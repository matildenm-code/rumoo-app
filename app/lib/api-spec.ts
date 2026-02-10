// RUMOO CERTIFICATE ENGINE V0 - API SPECIFICATION
// RESTful endpoints for certificate generation

/**
 * ============================================================================
 * SPACES ENDPOINTS
 * ============================================================================
 */

/**
 * POST /api/spaces
 * Create a new space
 * 
 * Request Body:
 * {
 *   "name": "Cozy T1 in Arroios",
 *   "address_label": "Largo do Mastro, Pena",
 *   "city": "Lisboa",
 *   "country": "Portugal",
 *   "neighborhood": "Arroios",
 *   "property_type": "T1",
 *   "floor": "2",
 *   "area_m2": 45.5,
 *   "listing_price": 285000
 * }
 * 
 * Response 201:
 * {
 *   "id": "uuid",
 *   "name": "Cozy T1 in Arroios",
 *   "created_at": "2026-02-09T..."
 * }
 * 
 * Response 400:
 * {
 *   "error": "Validation error",
 *   "details": { ... }
 * }
 */

/**
 * GET /api/spaces/:id
 * Get space details
 * 
 * Response 200:
 * {
 *   "id": "uuid",
 *   "name": "Cozy T1 in Arroios",
 *   "address_label": "Largo do Mastro, Pena",
 *   "city": "Lisboa",
 *   "property_type": "T1",
 *   "floor": "2",
 *   "area_m2": 45.5,
 *   "listing_price": 285000,
 *   "certificates": [
 *     {
 *       "id": "cert-uuid",
 *       "tier": "normal",
 *       "status": "done",
 *       "created_at": "..."
 *     }
 *   ]
 * }
 * 
 * Response 404:
 * {
 *   "error": "Space not found"
 * }
 */

/**
 * GET /api/spaces
 * List all spaces
 * 
 * Query params:
 * - city: string (optional)
 * - property_type: string (optional)
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 * 
 * Response 200:
 * {
 *   "spaces": [ ... ],
 *   "total": 45,
 *   "limit": 20,
 *   "offset": 0
 * }
 */

/**
 * ============================================================================
 * CERTIFICATE GENERATION ENDPOINT
 * ============================================================================
 */

/**
 * POST /api/spaces/:id/generate-certificate
 * Generate a certificate for a space
 * 
 * Query params:
 * - tier: "normal" | "pro" (required)
 * 
 * Request Body (optional):
 * {
 *   "force": false // If true, regenerate even if one exists
 * }
 * 
 * Flow:
 * 1. Validate space exists
 * 2. Create certificate record (status=processing)
 * 3. Run generator
 * 4. Save certificate_json
 * 5. Update status=done
 * 6. Return certificate
 * 
 * Response 202 (Accepted - if async):
 * {
 *   "certificate_id": "uuid",
 *   "status": "processing",
 *   "message": "Certificate generation started"
 * }
 * 
 * Response 201 (Created - if sync):
 * {
 *   "certificate_id": "uuid",
 *   "status": "done",
 *   "certificate": { ... } // Full certificate JSON
 * }
 * 
 * Response 400:
 * {
 *   "error": "Invalid tier",
 *   "details": "tier must be 'normal' or 'pro'"
 * }
 * 
 * Response 409 (Conflict):
 * {
 *   "error": "Certificate already exists",
 *   "existing_certificate_id": "uuid",
 *   "message": "Use force=true to regenerate"
 * }
 * 
 * Response 500:
 * {
 *   "error": "Generation failed",
 *   "details": "..."
 * }
 */

/**
 * ============================================================================
 * CERTIFICATE ENDPOINTS
 * ============================================================================
 */

/**
 * GET /api/certificates/:id
 * Get certificate by ID
 * 
 * Response 200:
 * {
 *   "id": "uuid",
 *   "space_id": "uuid",
 *   "tier": "normal",
 *   "status": "done",
 *   "version": "1.0.0",
 *   "certificate": {
 *     "meta": { ... },
 *     "property_identity": { ... },
 *     "experience_barometer": { ... },
 *     // ... rest of certificate JSON
 *   },
 *   "created_at": "...",
 *   "completed_at": "..."
 * }
 * 
 * Response 404:
 * {
 *   "error": "Certificate not found"
 * }
 */

/**
 * GET /api/spaces/:spaceId/certificates
 * Get all certificates for a space
 * 
 * Query params:
 * - tier: "normal" | "pro" (optional, filter by tier)
 * - latest: boolean (default: false, if true return only latest per tier)
 * 
 * Response 200:
 * {
 *   "certificates": [
 *     {
 *       "id": "uuid",
 *       "tier": "normal",
 *       "status": "done",
 *       "created_at": "..."
 *     },
 *     {
 *       "id": "uuid",
 *       "tier": "pro",
 *       "status": "done",
 *       "created_at": "..."
 *     }
 *   ]
 * }
 */

/**
 * ============================================================================
 * ERROR RESPONSES (Standard across all endpoints)
 * ============================================================================
 */

/**
 * 400 Bad Request
 * {
 *   "error": "Validation error",
 *   "details": { ... }
 * }
 * 
 * 401 Unauthorized
 * {
 *   "error": "Authentication required"
 * }
 * 
 * 403 Forbidden
 * {
 *   "error": "Insufficient permissions"
 * }
 * 
 * 404 Not Found
 * {
 *   "error": "Resource not found"
 * }
 * 
 * 409 Conflict
 * {
 *   "error": "Resource conflict",
 *   "details": "..."
 * }
 * 
 * 500 Internal Server Error
 * {
 *   "error": "Internal server error",
 *   "request_id": "uuid"
 * }
 * 
 * 503 Service Unavailable
 * {
 *   "error": "Service temporarily unavailable",
 *   "retry_after": 30
 * }
 */

/**
 * ============================================================================
 * IMPLEMENTATION NOTES
 * ============================================================================
 * 
 * V0 Implementation Strategy:
 * 
 * 1. SYNCHRONOUS GENERATION (for simplicity)
 *    - POST /generate-certificate returns 201 with complete certificate
 *    - No job queue needed initially
 *    - Move to async (202 + job queue) when generation takes >3s
 * 
 * 2. IDEMPOTENCY
 *    - Generating same space + tier multiple times creates new certificate
 *    - Use force=true to explicitly regenerate
 *    - Latest certificate is always the "current" one
 * 
 * 3. RATE LIMITING
 *    - Implement per-IP rate limiting on /generate-certificate
 *    - V0: 10 requests per hour per IP
 *    - Later: User-based limits with tiers
 * 
 * 4. CACHING
 *    - Cache space lookups (low TTL, spaces rarely change)
 *    - Don't cache certificates (they're versioned records)
 * 
 * 5. VERSIONING
 *    - All certificates have version field
 *    - Breaking changes = new major version
 *    - Frontend must handle multiple versions gracefully
 */

// ============================================================================
// NEXT.JS API ROUTE STRUCTURE
// ============================================================================

/**
 * File structure in Next.js App Router:
 * 
 * app/api/
 * ├── spaces/
 * │   ├── route.ts                    # POST /api/spaces, GET /api/spaces
 * │   └── [id]/
 * │       ├── route.ts                # GET /api/spaces/:id
 * │       ├── certificates/
 * │       │   └── route.ts            # GET /api/spaces/:id/certificates
 * │       └── generate-certificate/
 * │           └── route.ts            # POST /api/spaces/:id/generate-certificate
 * └── certificates/
 *     └── [id]/
 *         └── route.ts                # GET /api/certificates/:id
 */
