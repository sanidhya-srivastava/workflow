import type {
  AutomationDefinition,
  AutomationConfig,
  ApprovalConfig,
  EndConfig,
  KeyValuePair,
  StartConfig,
  TaskConfig,
  WorkflowNode,
  WorkflowNodeConfig,
} from '../types/workflow';

type Props = {
  node: WorkflowNode | null;
  automations: AutomationDefinition[];
  onChange: (nodeId: string, config: WorkflowNodeConfig, label: string) => void;
  onDelete: (nodeId: string) => void;
};

export function NodeFormPanel({ node, automations, onChange, onDelete }: Props) {
  if (!node) {
    return (
      <aside className="panel form-panel">
        <div className="empty-state">
          <strong>Select a node</strong>
          <span>Configure titles, owners, automation actions, and test data.</span>
          <span>Click any node on the canvas to reveal its delete button.</span>
        </div>
      </aside>
    );
  }

  const update = <TConfig extends WorkflowNodeConfig>(base: TConfig, patch: Partial<TConfig>, labelKey: keyof TConfig) => {
    const config = { ...base, ...patch } as TConfig;
    const label = labelKey in config ? String(config[labelKey as keyof typeof config] || node.data.label) : node.data.label;
    onChange(node.id, config, label);
  };

  let fields;

  if (node.data.kind === 'start') {
    const config = node.data.config as StartConfig;
    fields = (
      <>
        <Field label="Start title" value={config.title} onChange={(value) => update(config, { title: value }, 'title')} />
        <KeyValueEditor
          label="Metadata"
          pairs={config.metadata}
          onChange={(metadata) => update(config, { metadata }, 'title')}
        />
      </>
    );
  }

  if (node.data.kind === 'task') {
    const config = node.data.config as TaskConfig;
    fields = (
      <>
        <Field label="Title" required value={config.title} onChange={(value) => update(config, { title: value }, 'title')} />
        <TextArea label="Description" value={config.description} onChange={(value) => update(config, { description: value }, 'title')} />
        <Field label="Assignee" value={config.assignee} onChange={(value) => update(config, { assignee: value }, 'title')} />
        <Field label="Due date" type="date" value={config.dueDate} onChange={(value) => update(config, { dueDate: value }, 'title')} />
        <KeyValueEditor
          label="Custom fields"
          pairs={config.customFields}
          onChange={(customFields) => update(config, { customFields }, 'title')}
        />
      </>
    );
  }

  if (node.data.kind === 'approval') {
    const config = node.data.config as ApprovalConfig;
    fields = (
      <>
        <Field label="Title" value={config.title} onChange={(value) => update(config, { title: value }, 'title')} />
        <Field label="Approver role" value={config.approverRole} onChange={(value) => update(config, { approverRole: value }, 'title')} />
        <Field
          label="Auto-approve threshold"
          type="number"
          value={String(config.autoApproveThreshold)}
          onChange={(value) => update(config, { autoApproveThreshold: Number(value) }, 'title')}
        />
      </>
    );
  }

  if (node.data.kind === 'automation') {
    fields = (
      <AutomationFields
        config={node.data.config as AutomationConfig}
        automations={automations}
        onChange={(config) => onChange(node.id, config, config.title)}
      />
    );
  }

  if (node.data.kind === 'end') {
    const config = node.data.config as EndConfig;
    fields = (
      <>
        <TextArea label="End message" value={config.message} onChange={(value) => update(config, { message: value }, 'message')} />
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.showSummary}
            onChange={(event) => update(config, { showSummary: event.target.checked }, 'message')}
          />
          <span>Show summary</span>
        </label>
      </>
    );
  }

  return (
    <aside className="panel form-panel">
      <div className="panel__heading">
        <p>Node Form</p>
        <span>{node.data.kind}</span>
      </div>
      {fields}
      <button className="danger-button" onClick={() => onDelete(node.id)}>
        Delete node
      </button>
    </aside>
  );
}

function AutomationFields({
  config,
  automations,
  onChange,
}: {
  config: AutomationConfig;
  automations: AutomationDefinition[];
  onChange: (config: AutomationConfig) => void;
}) {
  const selected = automations.find((automation) => automation.id === config.actionId) ?? automations[0];

  const setAction = (actionId: string) => {
    const next = automations.find((automation) => automation.id === actionId);
    onChange({
      ...config,
      actionId,
      params: Object.fromEntries((next?.params ?? []).map((param) => [param, config.params[param] ?? ''])),
    });
  };

  return (
    <>
      <Field label="Title" value={config.title} onChange={(title) => onChange({ ...config, title })} />
      <label className="field">
        <span>Action</span>
        <select value={config.actionId} onChange={(event) => setAction(event.target.value)}>
          {automations.map((automation) => (
            <option key={automation.id} value={automation.id}>
              {automation.label}
            </option>
          ))}
        </select>
      </label>
      {selected?.params.map((param) => (
        <Field
          key={param}
          label={param}
          value={config.params[param] ?? ''}
          onChange={(value) => onChange({ ...config, params: { ...config.params, [param]: value } })}
        />
      ))}
    </>
  );
}

function KeyValueEditor({
  label,
  pairs,
  onChange,
}: {
  label: string;
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
}) {
  return (
    <div className="kv">
      <span>{label}</span>
      {pairs.map((pair, index) => (
        <div className="kv__row" key={`${label}-${index}`}>
          <input
            aria-label={`${label} key`}
            placeholder="key"
            value={pair.key}
            onChange={(event) => onChange(pairs.map((item, itemIndex) => (itemIndex === index ? { ...item, key: event.target.value } : item)))}
          />
          <input
            aria-label={`${label} value`}
            placeholder="value"
            value={pair.value}
            onChange={(event) => onChange(pairs.map((item, itemIndex) => (itemIndex === index ? { ...item, value: event.target.value } : item)))}
          />
          <button aria-label="Remove pair" onClick={() => onChange(pairs.filter((_, itemIndex) => itemIndex !== index))}>
            x
          </button>
        </div>
      ))}
      <button className="secondary-button" onClick={() => onChange([...pairs, { key: '', value: '' }])}>
        Add field
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
