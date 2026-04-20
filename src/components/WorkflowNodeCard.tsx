import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../types/workflow';

const kindLabels = {
  start: 'Start',
  task: 'Task',
  approval: 'Approval',
  automation: 'Automation',
  end: 'End',
};

export function WorkflowNodeCard({ data, selected }: NodeProps<WorkflowNode>) {
  const hasErrors = Boolean(data.validationErrors?.length);

  return (
    <div className={`workflow-node workflow-node--${data.kind} ${selected ? 'is-selected' : ''} ${hasErrors ? 'has-errors' : ''}`}>
      {data.kind !== 'start' && <Handle type="target" position={Position.Left} />}
      <div className="workflow-node__kind">{kindLabels[data.kind]}</div>
      <div className="workflow-node__title">{data.label}</div>
      {hasErrors && <div className="workflow-node__error">{data.validationErrors![0]}</div>}
      {data.kind !== 'end' && <Handle type="source" position={Position.Right} />}
    </div>
  );
}
