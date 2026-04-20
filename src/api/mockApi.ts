import type {
  AutomationDefinition,
  SimulationResponse,
  WorkflowEdge,
  WorkflowNode,
} from '../types/workflow';
import { validateWorkflow } from '../utils/validation';

const automations: AutomationDefinition[] = [
  { id: 'send_email', label: 'Send Email', params: ['to', 'subject'] },
  { id: 'generate_doc', label: 'Generate Document', params: ['template', 'recipient'] },
  { id: 'create_ticket', label: 'Create HR Ticket', params: ['queue', 'priority'] },
];

const delay = (ms = 300) => new Promise((resolve) => window.setTimeout(resolve, ms));

export async function getAutomations(): Promise<AutomationDefinition[]> {
  await delay();
  return automations;
}

export async function simulateWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): Promise<SimulationResponse> {
  await delay(500);
  const validation = validateWorkflow(nodes, edges);
  const outgoing = new Map<string, string[]>();

  edges.forEach((edge) => {
    const current = outgoing.get(edge.source) ?? [];
    outgoing.set(edge.source, [...current, edge.target]);
  });

  const start = nodes.find((node) => node.data.kind === 'start');
  const ordered: WorkflowNode[] = [];
  const visited = new Set<string>();
  const queue = start ? [start.id] : [];

  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = nodes.find((candidate) => candidate.id === id);
    if (node) ordered.push(node);
    queue.push(...(outgoing.get(id) ?? []));
  }

  const reachable = ordered.length ? ordered : nodes;

  return {
    ok: validation.errors.length === 0,
    warnings: validation.errors,
    steps: reachable.map((node, index) => ({
      id: node.id,
      label: node.data.label,
      status: validation.errors.length ? 'warning' : 'completed',
      detail: `${index + 1}. ${node.data.kind} step executed with mocked workflow context.`,
    })),
  };
}
