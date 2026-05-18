import { YamlService, ValidationResult, ApplyResult } from '../yaml.service';

export class DemoYamlService extends YamlService {
  /** Override dryRunApply with realistic mock validation checks */
  async dryRunApply(yamlStr: string): Promise<ValidationResult> {
    const validation = this.parseYaml(yamlStr);
    if (!validation.isValid) {
      return validation;
    }

    // Run semantic demo checks on parsed objects
    for (const obj of validation.parsedObjects) {
      const kind = obj.kind || 'Resource';
      const name = obj.metadata?.name || 'Unnamed';
      const namespace = obj.metadata?.namespace;

      // 1. Alert if applying cluster-scoped resources in namespace
      if (kind === 'Namespace' && namespace) {
        validation.isValid = false;
        validation.errors.push({
          path: `${kind}/${name}`,
          message: `Namespace "${name}" should not specify metadata.namespace field.`,
          severity: 'error'
        });
      }

      // 2. Validate namespace format
      if (namespace && !/^[a-z0-9-]+$/.test(namespace)) {
        validation.isValid = false;
        validation.errors.push({
          path: `${kind}/${name}`,
          message: `Namespace "${namespace}" is invalid: must consist of lower case alphanumeric characters or '-'.`,
          severity: 'error'
        });
      }

      // 3. Simulating resource quota/limit constraints on Pod templates
      if (kind === 'Pod' || kind === 'Deployment') {
        const spec = kind === 'Pod' ? obj.spec : obj.spec?.template?.spec;
        const containers = spec?.containers || [];

        for (const container of containers) {
          // Check CPU limits
          const cpuLimit = container.resources?.limits?.cpu;
          if (cpuLimit && cpuLimit.endsWith('m')) {
            const cpuVal = parseInt(cpuLimit);
            if (cpuVal > 4000) {
              validation.isValid = false;
              validation.errors.push({
                path: `${kind}/${name}`,
                message: `Container "${container.name}" exceeds cluster CPU resource quota limit of 4000m (Requested: ${cpuLimit}).`,
                severity: 'error'
              });
            }
          }

          // Check Memory limits
          const memLimit = container.resources?.limits?.memory;
          if (memLimit && memLimit.endsWith('Gi')) {
            const memVal = parseFloat(memLimit);
            if (memVal > 8) {
              validation.isValid = false;
              validation.errors.push({
                path: `${kind}/${name}`,
                message: `Container "${container.name}" exceeds namespace memory limits quota of 8Gi (Requested: ${memLimit}).`,
                severity: 'error'
              });
            }
          }

          // Check image pull block
          const image = container.image || '';
          if (image.includes('invalid') || image === '') {
            validation.isValid = false;
            validation.errors.push({
              path: `${kind}/${name}`,
              message: `ImagePullBackOff: Failed to resolve image registry endpoint for tag "${image}".`,
              severity: 'error'
            });
          }
        }
      }
    }

    return validation;
  }

  /** Override applyManifests to return mock state applied outcomes */
  async applyManifests(yamlStr: string): Promise<ApplyResult> {
    const dryRun = await this.dryRunApply(yamlStr);
    if (!dryRun.isValid) {
      return {
        success: false,
        message: 'Manifest failed mock validations.',
        appliedResources: []
      };
    }

    const appliedResources = dryRun.parsedObjects.map(obj => {
      // Return highly realistic created or configured statuses
      const isSvc = obj.kind === 'Service' || obj.kind === 'ConfigMap';
      return {
        kind: obj.kind || 'Resource',
        name: obj.metadata?.name || 'Unnamed',
        namespace: obj.metadata?.namespace || 'default',
        status: isSvc ? 'Configured' : 'Created'
      };
    });

    return {
      success: true,
      message: `Successfully applied ${appliedResources.length} resources in Demo Mode.`,
      appliedResources
    };
  }
}

export const demoYamlService = new DemoYamlService();
