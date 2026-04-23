import type { SimulationResponse, WorkflowEdge, WorkflowNode } from '../types/workflow';

type Props = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  simulation: SimulationResponse | null;
  simulationError: string | null;
  isRunning: boolean;
  onSimulate: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
};

export function SandboxPanel({ nodes, edges, simulation, simulationError, isRunning, onSimulate, onExport, onImport }: Props) {
  const resultText = simulation
    ? `${simulation.steps.length} steps simulated`
    : simulationError
      ? 'Simulation failed'
      : 'Ready to test';

  return (
    <section className="sandbox">
      <div className="sandbox__header">
        <div>
          <p>Workflow Sandbox</p>
          <span>{nodes.length} nodes | {edges.length} edges | {resultText}</span>
        </div>
        <div className="sandbox__actions">
          <label className="icon-button" title="Import JSON">
            <span>Import</span>
            <input
              type="file"
              accept="application/json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
              }}
            />
          </label>
          <button type="button" className="icon-button" onClick={onExport}>Export</button>
          <button type="button" className="primary-button" onClick={onSimulate} disabled={isRunning}>
            {isRunning ? 'Running...' : 'Simulate'}
          </button>
        </div>
      </div>
      <div className="sandbox__body">
        <pre>{JSON.stringify({ nodes, edges }, null, 2)}</pre>
        <div className="timeline">
          {!simulation && <span className="timeline__empty">Run the sandbox to see execution output.</span>}
          {simulationError && <div className="timeline__error">{simulationError}</div>}
          {simulation && (
            <div className={`timeline__summary ${simulation.ok ? 'timeline__summary--success' : 'timeline__summary--warning'}`}>
              {simulation.ok
                ? 'Simulation completed successfully.'
                : 'Simulation completed with validation warnings.'}
            </div>
          )}
          {simulation?.warnings.map((warning) => (
            <div className="timeline__warning" key={warning}>{warning}</div>
          ))}
          {simulation?.steps.map((step) => (
            <div className={`timeline__step timeline__step--${step.status}`} key={step.id}>
              <strong>{step.label}</strong>
              <span>{step.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

