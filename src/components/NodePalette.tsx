import type { WorkflowNodeKind } from '../types/workflow';

const nodes: Array<{ kind: WorkflowNodeKind; label: string; hint: string }> = [
  { kind: 'start', label: 'Start', hint: 'Workflow entry' },
  { kind: 'task', label: 'Task', hint: 'Human task' },
  { kind: 'approval', label: 'Approval', hint: 'Manager review' },
  { kind: 'automation', label: 'Automated Step', hint: 'System action' },
  { kind: 'end', label: 'End', hint: 'Completion' },
];

type Props = {
  onAdd: (kind: WorkflowNodeKind) => void;
};

export function NodePalette({ onAdd }: Props) {
  return (
    <aside className="panel palette">
      <div className="panel__heading">
        <p>Nodes</p>
        <span>Drag substitute</span>
      </div>
      <div className="palette__list">
        {nodes.map((node) => (
          <button
            key={node.kind}
            className={`palette__item palette__item--${node.kind}`}
            draggable
            onClick={() => onAdd(node.kind)}
            onDragStart={(event) => {
              event.dataTransfer.setData('application/reactflow', node.kind);
              event.dataTransfer.effectAllowed = 'move';
            }}
          >
            <span>{node.label}</span>
            <small>{node.hint}</small>
          </button>
        ))}
      </div>
    </aside>
  );
}
