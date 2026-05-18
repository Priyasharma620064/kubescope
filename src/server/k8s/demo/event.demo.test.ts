import { describe, it, expect } from 'vitest';
import { demoEventService } from './event.demo';

describe('DemoEventService', () => {
  describe('diagnosePod', () => {
    it('should return Critical status for ml-pipeline pods', async () => {
      const result = await demoEventService.diagnosePod('production', 'ml-pipeline-abc-123');
      expect(result.status).toBe('Critical');
      expect(result.summary).toContain('Out-Of-Memory');
    });

    it('should return Warning status for payment pods', async () => {
      const result = await demoEventService.diagnosePod('production', 'payment-svc-xyz');
      expect(result.status).toBe('Warning');
      expect(result.summary).toContain('ImagePullBackOff');
    });

    it('should return Healthy status for other pods', async () => {
      const result = await demoEventService.diagnosePod('production', 'web-frontend-pod');
      expect(result.status).toBe('Healthy');
      expect(result.summary).toContain('running optimally');
    });
  });
});
