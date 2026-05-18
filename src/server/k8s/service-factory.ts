/**
 * Service factory for demo mode support.
 *
 * Each module has a "live" service (talks to K8s API) and a "demo" service
 * (returns synthetic data). The factory checks NEXT_PUBLIC_DEMO_MODE to
 * decide which to return.
 *
 * This pattern enables:
 * - Zero-cluster development and testing
 * - Portfolio demo mode for recruiters/mentors
 * - Consistent interface between live and demo data
 */

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Generic service factory. Returns the demo implementation when demo mode
 * is active, otherwise returns the live implementation.
 *
 * Usage:
 * ```ts
 * const clusterService = createServiceFactory(liveClusterService, demoClusterService);
 * ```
 */
export function createServiceFactory<T>(live: T, demo: T): T {
  return isDemoMode() ? demo : live;
}
