import * as k8s from '@kubernetes/client-node';
import * as yaml from 'js-yaml';
import { kubeConfig } from './client';

const kubernetesObjectApi = k8s.KubernetesObjectApi.makeApiClient(kubeConfig);

export interface KubernetesObject {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    [key: string]: unknown;
  };
  spec?: {
    containers?: Array<{
      name: string;
      image?: string;
      resources?: {
        requests?: { cpu?: string; memory?: string };
        limits?: { cpu?: string; memory?: string };
      };
    }>;
    template?: {
      spec?: {
        containers?: Array<{
          name: string;
          image?: string;
          resources?: {
            requests?: { cpu?: string; memory?: string };
            limits?: { cpu?: string; memory?: string };
          };
        }>;
      };
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    path?: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  parsedObjects: KubernetesObject[];
}

export interface ApplyResult {
  success: boolean;
  message: string;
  appliedResources: Array<{
    kind: string;
    name: string;
    namespace?: string;
    status: string;
  }>;
}

export class YamlService {
  /** Parsers a YAML string containing one or more resources */
  parseYaml(yamlStr: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      parsedObjects: [],
    };

    if (!yamlStr || yamlStr.trim() === '') {
      result.isValid = false;
      result.errors.push({ message: 'Manifest is empty.', severity: 'error' });
      return result;
    }

    try {
      // Parse all documents in the YAML string
      const docs = yaml.loadAll(yamlStr);
      
      for (let idx = 0; idx < docs.length; idx++) {
        const doc = docs[idx] as KubernetesObject | null;
        if (!doc) continue; // Skip empty documents

        // Basic structural validations
        if (typeof doc !== 'object') {
          result.isValid = false;
          result.errors.push({ 
            message: `Document #${idx + 1} is not a valid Kubernetes object structure.`, 
            severity: 'error' 
          });
          continue;
        }

        const errorsForDoc: string[] = [];
        if (!doc.apiVersion) errorsForDoc.push('Missing "apiVersion"');
        if (!doc.kind) errorsForDoc.push('Missing "kind"');
        if (!doc.metadata) {
          errorsForDoc.push('Missing "metadata"');
        } else {
          if (!doc.metadata.name) errorsForDoc.push('Missing "metadata.name"');
        }

        if (errorsForDoc.length > 0) {
          result.isValid = false;
          result.errors.push({
            path: `doc[${idx}]`,
            message: `Document #${idx + 1} (${doc.kind || 'Unknown'} - ${doc.metadata?.name || 'Unnamed'}): ${errorsForDoc.join(', ')}.`,
            severity: 'error'
          });
        } else {
          result.parsedObjects.push(doc);
        }
      }
    } catch (err) {
      result.isValid = false;
      const errMsg = err instanceof Error ? err.message : String(err);
      result.errors.push({
        message: `YAML Parsing Error: ${errMsg}`,
        severity: 'error'
      });
    }

    return result;
  }

  /** Run a client-side or server-side dry-run apply */
  async dryRunApply(yamlStr: string): Promise<ValidationResult> {
    const validation = this.parseYaml(yamlStr);
    if (!validation.isValid) {
      return validation;
    }

    // Perform dry-run apply against live API
    for (const obj of validation.parsedObjects) {
      try {
        await kubernetesObjectApi.create(
          obj as k8s.KubernetesObject,
          'true',
          'All'
        );
      } catch (err) {
        validation.isValid = false;
        const statusErr = err as { body?: { message?: string }; message?: string };
        const msg = statusErr.body?.message || statusErr.message || `Kubernetes dry-run rejected ${obj.kind || 'Resource'} "${obj.metadata?.name || 'Unnamed'}"`;
        validation.errors.push({
          path: `${obj.kind || 'Resource'}/${obj.metadata?.name || 'Unnamed'}`,
          message: `${obj.kind || 'Resource'} "${obj.metadata?.name || 'Unnamed'}": ${msg}`,
          severity: 'error'
        });
      }
    }

    return validation;
  }

  /** Applies parsed manifests directly to the cluster */
  async applyManifests(yamlStr: string): Promise<ApplyResult> {
    const validation = this.parseYaml(yamlStr);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Manifest is syntactically invalid. Fix errors before applying.',
        appliedResources: []
      };
    }

    const result: ApplyResult = {
      success: true,
      message: 'All resources applied successfully.',
      appliedResources: []
    };

    for (const obj of validation.parsedObjects) {
      try {
        // Try reading first to check if we should create or patch
        let exists = false;
        try {
          await kubernetesObjectApi.read(obj as k8s.KubernetesObject & { metadata: { name: string; namespace?: string } });
          exists = true;
        } catch {
          // Object does not exist yet, we will create
        }

        if (exists) {
          // Patch existing resource using server-side apply / patch
          await kubernetesObjectApi.patch(obj as k8s.KubernetesObject);
          result.appliedResources.push({
            kind: obj.kind || 'Resource',
            name: obj.metadata?.name || 'Unnamed',
            namespace: obj.metadata?.namespace,
            status: 'Configured'
          });
        } else {
          // Create new resource
          await kubernetesObjectApi.create(obj as k8s.KubernetesObject);
          result.appliedResources.push({
            kind: obj.kind || 'Resource',
            name: obj.metadata?.name || 'Unnamed',
            namespace: obj.metadata?.namespace,
            status: 'Created'
          });
        }
      } catch (err) {
        result.success = false;
        const statusErr = err as { body?: { message?: string }; message?: string };
        const msg = statusErr.body?.message || statusErr.message || `Failed to apply ${obj.kind || 'Resource'} "${obj.metadata?.name || 'Unnamed'}"`;
        result.message = msg;
        break; // Stop on first failure
      }
    }

    return result;
  }
}

export const liveYamlService = new YamlService();
