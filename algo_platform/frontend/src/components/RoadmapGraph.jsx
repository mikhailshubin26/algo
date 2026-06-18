import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ReactFlow,
  Handle,
  Position,
  Background,
  Controls,
  MarkerType,
} from "@xyflow/react";
import dagre from "dagre";
import "@xyflow/react/dist/style.css";

const NODE_W = 270;
const NODE_H = 160;

function flattenTree(nodes, flat = [], edges = []) {
  nodes.forEach((node) => {
    flat.push(node);
    (node.children || []).forEach((child) => {
      edges.push({ id: `e-${node.id}-${child.id}`, source: node.id, target: child.id });
    });
    flattenTree(node.children || [], flat, edges);
  });
  return { flat, edges };
}

function applyDagreLayout(flat, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 80, ranksep: 100 });
  flat.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach(({ source, target }) => g.setEdge(source, target));
  dagre.layout(g);
  return flat.map((n) => ({
    id: n.id,
    type: "roadmapNode",
    position: { x: g.node(n.id).x - NODE_W / 2, y: g.node(n.id).y - NODE_H / 2 },
    data: n,
  }));
}

const RoadmapNodeCard = ({ data }) => (
  <div className="rf-node">
    <Handle type="target" position={Position.Top} className="rf-handle" />
    <div className="rf-node__title">{data.title}</div>
    {data.description && <p className="rf-node__desc">{data.description}</p>}
    {data.problems?.length > 0 && (
      <div className="rf-node__problems">
        {data.problems.map((p) => (
          <Link key={p.id} to={`/problems/${p.id}`} className="rf-node__problem-link"
            onClick={(e) => e.stopPropagation()}>
            {p.title}
          </Link>
        ))}
      </div>
    )}
    <Handle type="source" position={Position.Bottom} className="rf-handle" />
  </div>
);

const nodeTypes = { roadmapNode: RoadmapNodeCard };

const defaultEdgeOptions = {
  type: "smoothstep",
  style: { stroke: "#818cf8", strokeWidth: 2.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#818cf8", width: 18, height: 18 },
};

const RoadmapGraph = ({ treeNodes }) => {
  const { flat, edges: rawEdges } = useMemo(() => flattenTree(treeNodes), [treeNodes]);
  const rfNodes = useMemo(() => applyDagreLayout(flat, rawEdges), [flat, rawEdges]);
  const rfEdges = useMemo(() => rawEdges.map((e) => ({ ...e, ...defaultEdgeOptions })), [rawEdges]);

  if (!treeNodes.length) {
    return (
      <div className="roadmap-graph-empty">
        <div className="roadmap-graph-empty__icon">◈</div>
        <p>Узлов пока нет</p>
        <span>Добавьте первый узел, чтобы начать строить карту</span>
      </div>
    );
  }

  return (
    <div className="roadmap-graph">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1.2 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={defaultEdgeOptions}
      >
        <Background color="#c7d2fe" gap={24} size={1.2} variant="dots" />
        <Controls
          showInteractive={false}
          style={{
            button: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8 },
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default RoadmapGraph;
