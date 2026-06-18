const RoadmapNode = ({ node }) => (
  <li className="roadmap-tree__node">
    <span>{node.title}</span>
    {node.children?.length > 0 && (
      <ul>
        {node.children.map((child) => (
          <RoadmapNode key={child.id} node={child} />
        ))}
      </ul>
    )}
  </li>
);

// Дорожная карта хранится как дерево узлов (roadmap_nodes с self-referencing
// полем parent_id), поэтому отображение реализовано рекурсивным компонентом.
const RoadmapTree = ({ nodes }) => (
  <ul className="roadmap-tree">
    {nodes.map((node) => (
      <RoadmapNode key={node.id} node={node} />
    ))}
  </ul>
);

export default RoadmapTree;
