import type { WorkflowEdge, WorkflowNode } from '../types/workflow';

export type WorkflowValidation = {
  errors: string[];
  nodeErrors: Record<string, string[]>;
};

export function validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowValidation {
  const errors: string[] = [];
  const nodeErrors: Record<string, string[]> = {};
  const starts = nodes.filter((node) => node.data.kind === 'start');
  const ends = nodes.filter((node) => node.data.kind === 'end');
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  nodes.forEach((node) => {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  });

  edges.forEach((edge) => {
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  });

  if (starts.length !== 1) errors.push('Workflow must contain exactly one Start node.');
  if (ends.length < 1) errors.push('Workflow must contain at least one End node.');

  nodes.forEach((node) => {
    const local: string[] = [];

    if (node.data.kind === 'start' && (incoming.get(node.id) ?? 0) > 0) {
      local.push('Start node cannot have incoming connections.');
    }

    if (node.data.kind !== 'start' && (incoming.get(node.id) ?? 0) === 0) {
      local.push('Node is missing an incoming connection.');
    }

    if (node.data.kind !== 'end' && (outgoing.get(node.id) ?? []).length === 0) {
      local.push('Node is missing an outgoing connection.');
    }

    if (node.data.kind === 'task' && !('title' in node.data.config && node.data.config.title.trim())) {
      local.push('Task title is required.');
    }

    if (local.length) {
      nodeErrors[node.id] = local;
      errors.push(`${node.data.label}: ${local.join(' ')}`);
    }
  });

  const cycle = findCycle(nodes, outgoing);
  if (cycle) errors.push('Workflow contains a cycle. Remove looping edges before simulation.');

  return { errors, nodeErrors };
}

function findCycle(nodes: WorkflowNode[], outgoing: Map<string, string[]>): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(id: string): boolean {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;

    visiting.add(id);
    for (const next of outgoing.get(id) ?? []) {
      if (visit(next)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }

  return nodes.some((node) => visit(node.id));
}
