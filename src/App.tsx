import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  useReactFlow,
} from '@xyflow/react';
import { getAutomations, simulateWorkflow } from './api/mockApi';
import { NodeFormPanel } from './components/NodeFormPanel';
import { NodePalette } from './components/NodePalette';
import { SandboxPanel } from './components/SandboxPanel';
import { WorkflowNodeCard } from './components/WorkflowNodeCard';
import type {
  AutomationDefinition,
  SimulationResponse,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeConfig,
  WorkflowNodeKind,
} from './types/workflow';
import { validateWorkflow } from './utils/validation';

const nodeTypes = { workflow: WorkflowNodeCard };

const initialNodes: WorkflowNode[] = [
  createNode('start', { x: 80, y: 150 }),
  createNode('task', { x: 340, y: 150 }),
  createNode('approval', { x: 610, y: 150 }),
  createNode('automation', { x: 880, y: 150 }),
  createNode('end', { x: 1160, y: 150 }),
];

const initialEdges: WorkflowEdge[] = [
  { id: 'e-start-task', source: initialNodes[0].id, target: initialNodes[1].id },
  { id: 'e-task-approval', source: initialNodes[1].id, target: initialNodes[2].id },
  { id: 'e-approval-auto', source: initialNodes[2].id, target: initialNodes[3].id },
  { id: 'e-auto-end', source: initialNodes[3].id, target: initialNodes[4].id },
];

export default function App() {
  return (
    <ReactFlowProvider>
      <Designer />
    </ReactFlowProvider>
  );
}

function Designer() {
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(initialEdges);
  const [automations, setAutomations] = useState<AutomationDefinition[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialNodes[0].id);
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    getAutomations().then(setAutomations);
  }, []);

  const validation = useMemo(() => validateWorkflow(nodes, edges), [nodes, edges]);

  const flowNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          validationErrors: validation.nodeErrors[node.id] ?? [],
        },
      })),
    [nodes, validation.nodeErrors],
  );

  const selectedNode = useMemo(
    () => flowNodes.find((node) => node.id === selectedId) ?? null,
    [flowNodes, selectedId],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((current) => applyNodeChanges(changes, current) as WorkflowNode[]),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((current) => applyEdgeChanges(changes, current)),
    [],
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((current) => addEdge({ ...connection, animated: true }, current)),
    [],
  );

  const addNode = (kind: WorkflowNodeKind) => {
    const node = createNode(kind, {
      x: 160 + nodes.length * 32,
      y: 120 + nodes.length * 24,
    });
    setNodes((current) => [...current, node]);
    setSelectedId(node.id);
  };

  const dropNode = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const kind = event.dataTransfer.getData('application/reactflow') as WorkflowNodeKind;
    if (!kind) return;

    const node = createNode(
      kind,
      screenToFlowPosition({ x: event.clientX, y: event.clientY }),
    );
    setNodes((current) => [...current, node]);
    setSelectedId(node.id);
  };

  const updateNode = (nodeId: string, config: WorkflowNodeConfig, label: string) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                label,
                config,
              },
            }
          : node,
      ),
    );
  };

  const deleteNode = (nodeId: string) => {
    setNodes((current) => current.filter((node) => node.id !== nodeId));
    setEdges((current) => current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedId(null);
    setSimulation(null);
    setSimulationError(null);
  };

  const runSimulation = async () => {
    setIsRunning(true);
    setSimulation(null);
    setSimulationError(null);
    try {
      setSimulation(await simulateWorkflow(nodes, edges));
    } catch (error) {
      setSimulationError(error instanceof Error ? error.message : 'Simulation failed unexpectedly.');
    } finally {
      setIsRunning(false);
    }
  };

  const exportWorkflow = () => {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hr-workflow.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importWorkflow = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
    setNodes(parsed.nodes);
    setEdges(parsed.edges);
    setSelectedId(parsed.nodes[0]?.id ?? null);
  };

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <h1>HR Workflow Designer</h1>
          <p>Build, configure, validate, and simulate onboarding workflows.</p>
        </div>
        <div className="topbar__status">
          <span>{automations.length} mock actions</span>
          <strong>{validation.errors.length ? 'Needs review' : 'Ready'}</strong>
        </div>
      </header>
      <div className="workspace">
        <NodePalette onAdd={addNode} />
        <section className="canvas-shell">
          <ReactFlow
            nodes={flowNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onDrop={dropNode}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            fitView
          >
            <Background gap={20} color="#d9dee8" />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </section>
        <NodeFormPanel
          node={selectedNode}
          automations={automations}
          onChange={updateNode}
          onDelete={deleteNode}
        />
      </div>
      <SandboxPanel
        nodes={nodes}
        edges={edges}
        simulation={simulation}
        simulationError={simulationError}
        isRunning={isRunning}
        onSimulate={runSimulation}
        onExport={exportWorkflow}
        onImport={importWorkflow}
      />
    </main>
  );
}

function createNode(kind: WorkflowNodeKind, position: { x: number; y: number }): WorkflowNode {
  const id = `${kind}-${crypto.randomUUID()}`;
  const config = createDefaultConfig(kind);
  const label = getLabel(kind, config);

  return {
    id,
    type: 'workflow',
    position,
    data: {
      kind,
      label,
      config,
      validationErrors: [],
    },
  };
}

function createDefaultConfig(kind: WorkflowNodeKind): WorkflowNodeConfig {
  switch (kind) {
    case 'start':
      return { title: 'Employee Onboarding', metadata: [{ key: 'department', value: 'Engineering' }] };
    case 'task':
      return {
        title: 'Collect Documents',
        description: 'Ask the employee to upload identity and payroll documents.',
        assignee: 'HR Coordinator',
        dueDate: '',
        customFields: [{ key: 'priority', value: 'High' }],
      };
    case 'approval':
      return { title: 'Manager Approval', approverRole: 'Manager', autoApproveThreshold: 0 };
    case 'automation':
      return { title: 'Send Welcome Email', actionId: 'send_email', params: { to: 'employee.email', subject: 'Welcome aboard' } };
    case 'end':
      return { message: 'Onboarding completed', showSummary: true };
  }
}

function getLabel(kind: WorkflowNodeKind, config: WorkflowNodeConfig): string {
  if (kind === 'end' && 'message' in config) return config.message;
  if ('title' in config) return config.title;
  return kind;
}
