# HR Workflow Designer

A functional prototype for the Tredence Studio Full Stack Engineering Intern case study. The app lets an HR admin create, configure, validate, export/import, and simulate internal workflows such as onboarding, leave approvals, and document verification.

## Tech Stack

- React + TypeScript
- Vite
- React Flow via `@xyflow/react`
- Local mocked API functions for `/automations` and `/simulate`

## How To Run

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## What Is Included

- Workflow canvas with custom React Flow nodes
- Start, Task, Approval, Automated Step, and End node types
- Sidebar node palette with drag-and-drop and click-to-add
- Editable node form panel with controlled inputs
- Dynamic automation parameters loaded from a mock API
- Basic workflow validation for missing connections, invalid start/end structure, and cycles
- Sandbox panel that serializes the graph and runs a mocked step-by-step simulation
- Export/import workflow JSON
- Mini-map, zoom, pan, and delete support through React Flow controls

## Architecture

```text
src/
  api/
    mockApi.ts              Mock GET /automations and POST /simulate behavior
  components/
    NodeFormPanel.tsx       Dynamic forms for each node type
    NodePalette.tsx         Node catalog and drag source
    SandboxPanel.tsx        JSON preview, import/export, simulation output
    WorkflowNodeCard.tsx    Custom React Flow node renderer
  types/
    workflow.ts             Shared workflow, config, API, and simulation types
  utils/
    validation.ts           Graph validation and cycle detection
  App.tsx                   Canvas orchestration and state ownership
```

The canvas owns the canonical `nodes` and `edges` state. The form panel receives the selected node and emits config updates. Validation is derived from graph state and projected back into rendered nodes as display-only errors. The mock API layer is intentionally isolated so it can be replaced with MSW, JSON Server, or real endpoints later.

## Design Choices

- React Flow handles graph editing primitives such as connections, movement, deletion, zoom, pan, and the mini-map.
- Node configuration is modeled as discriminated TypeScript data so each node type can grow independently.
- Dynamic automation fields are generated from the mocked `/automations` response.
- Simulation walks the graph from the Start node and returns a mock execution timeline while surfacing validation warnings.
- Import/export is included as a small bonus feature because it is useful for reviewing workflows.

## Assumptions

- Backend persistence and authentication are intentionally out of scope.
- The mock `/simulate` endpoint is represented by an async local function rather than a real HTTP server.
- Due date is a native date input for simplicity.
- Multiple End nodes are allowed, but exactly one Start node is expected.

## With More Time

- Add visual validation markers on edges and a dedicated validation drawer.
- Add undo/redo.
- Add auto-layout.
- Add richer branch handling for approval decisions.
- Add unit tests for validation and component tests for the form panel.
