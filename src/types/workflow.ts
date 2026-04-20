import type { Edge, Node } from '@xyflow/react';

export type WorkflowNodeKind = 'start' | 'task' | 'approval' | 'automation' | 'end';

export type KeyValuePair = {
  key: string;
  value: string;
};

export type StartConfig = {
  title: string;
  metadata: KeyValuePair[];
};

export type TaskConfig = {
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  customFields: KeyValuePair[];
};

export type ApprovalConfig = {
  title: string;
  approverRole: string;
  autoApproveThreshold: number;
};

export type AutomationConfig = {
  title: string;
  actionId: string;
  params: Record<string, string>;
};

export type EndConfig = {
  message: string;
  showSummary: boolean;
};

export type WorkflowNodeConfig =
  | StartConfig
  | TaskConfig
  | ApprovalConfig
  | AutomationConfig
  | EndConfig;

export type WorkflowNodeData = {
  kind: WorkflowNodeKind;
  label: string;
  config: WorkflowNodeConfig;
  validationErrors?: string[];
};

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

export type AutomationDefinition = {
  id: string;
  label: string;
  params: string[];
};

export type SimulationStep = {
  id: string;
  label: string;
  status: 'completed' | 'warning';
  detail: string;
};

export type SimulationResponse = {
  ok: boolean;
  steps: SimulationStep[];
  warnings: string[];
};
