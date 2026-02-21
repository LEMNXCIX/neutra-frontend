/**
 * API Routes for Appointments - Refactored with unified handler
 */

import { createGetHandler, createPostHandler } from '@/lib/api-route-handler';

/**
 * GET /api/appointments
 * Fetch list of appointments
 */
export const GET = createGetHandler('/appointments');

/**
 * POST /api/appointments
 * Create a new appointment
 */
export const POST = createPostHandler('/appointments');
