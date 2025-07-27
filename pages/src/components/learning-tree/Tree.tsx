import { useState, useEffect, useRef } from "react";
import {
    ReactFlow, 
    Background, 
    Controls,
    MiniMap,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    type Node,
    type Edge,
    type FitViewOptions,
    type OnConnect,
    type OnNodesChange,
    type OnEdgesChange,
    type NodeTypes,
    type DefaultEdgeOptions,
    PanOnScrollMode,
    ReactFlowProvider,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import LearningTreeNode from "./LearningTreeNode";
import "./assets/css/tree.css";
import { colors } from "@mui/material";

interface TreeProps {
    nodeID: string | null;
}

// Custom node data type with index signature
interface CustomNodeData {
    name: string;
    image_path: string;
    description: string;
    category: string;
    category_color: string;
    highlighted_path: string;
    [key: string]: unknown;  // Index signature to satisfy the constraint
}

// Custom node type extending ReactFlow's Node with a children attribute
interface CustomNode extends Node<CustomNodeData> {
    id: string;
    type: string;
    position: {x: number, y: number };
    data: CustomNodeData;
    children?: string[];
}

/**
 * Link to ReactFlow fitViewOptions documentation: https://reactflow.dev/api-reference/types/fit-view-options
 * This object sets the default node(s) to fit the view to when the Learning Tree is first loaded, as well as setting
 * the default zoom too.
 */
const fitViewOptions: FitViewOptions = {
    minZoom: 0.000001, 
    maxZoom: 0.8,
    nodes: [{ id: '1'}, {id: '72'}], // Node(s) to fit in the screen on page load {id: 'rosie0'}
};

/**
 * Link to ReactFlow custom node documentation w/ typescript: https://reactflow.dev/learn/advanced-use/typescript
 * Link to ReactFlow custom node documentation (General): https://reactflow.dev/learn/customization/custom-nodes
 * This defines the custom node type we created, allowing it to be used in the flow.
 */
const nodeTypes: NodeTypes = {
    treeNode: LearningTreeNode,
};


/**
 * Generates edges based on the children attribute of each node.
 */
const generateEdges = (nodes: CustomNode[]): Edge[] => {
    const edges: Edge[] = [];
    nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
            node.children.forEach((childId, index) => {
                const targetNode = nodes.find(n => n.id === childId);
                if (targetNode) {
                    edges.push({
                        type: 'default',
                        source: node.id,
                        target: childId,
                        id: `${node.id}-${childId}-${index}`,
                        animated: true,
                        style: { stroke: targetNode.data.category_color as string, strokeWidth: 6 },
                    });
                }
            });
        }
    });
    return edges;
};

// const initialEdges: Edge[] = generateEdges(initialNodes);

const TreeInner = (props: TreeProps) => {
    const [nodes, setNodes] = useState<CustomNode[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const { fitView } = useReactFlow();

    const parts: string[] = window.location.href.split("/");
    let baseUrl: string = "";

    if (parts[2] === "127.0.0.1:3000" || parts[2] === "localhost:3000") {
        baseUrl = `${parts[0]}//127.0.0.1:8000`;
    } else {
        baseUrl = `${parts[0]}//${parts[2]}`;
    }

    useEffect(() => {
        const fetchNodes = async () => {
            try {
                const response = await fetch(`${baseUrl}/api/v1/learning-tree/`);
            
                // Check for response status
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }

                const data = await response.json();

                if (Array.isArray(data)) {
                    setNodes(data);
                    const generatedEdges = generateEdges(data);
                    setEdges(generatedEdges);

                    const maxNodeId = Math.max(...data.map((node: CustomNode) => Number(node.id)));
                    fitViewOptions.nodes = [{id: '1'}, {id: maxNodeId.toString()}]
                } else {
                    console.error('Fetched data is not an array:', data);
                }

            } catch (error) {
                console.error("Error fetching nodes:", error);
            }
        };

        fetchNodes();
    }, [baseUrl]);

    // Effect to focus on specific node when nodeID changes
    useEffect(() => {
        if (props.nodeID && nodes.length > 0) {
            // Wait a bit for the nodes to be rendered
            setTimeout(() => {
                fitView({ 
                    nodes: [{ id: props.nodeID! }],
                    duration: 800,
                    padding: 5
                });
            }, 100);
        }
    }, [props.nodeID, nodes, fitView]);

    if(props.nodeID !== null){
        fitViewOptions.nodes = [{id: `${props.nodeID}`}];
    }

    console.log(fitViewOptions.minZoom);
    return (
        <div className='tree'>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView={true}
                fitViewOptions={fitViewOptions}
                colorMode="dark"
                /* Change these zoom levels if tree gets larger */
                minZoom={0.001}
                maxZoom={2}
                panOnScroll={true}
                panOnScrollMode={PanOnScrollMode.Free}
            >
                <Background />
                {/* <MiniMap
                    nodeColor={(node) => {
                        return node.data.category_color as string || 'white';
                    }}
                    nodeStrokeWidth={3}
                /> */}
                <Controls
                    showInteractive={true}
                />
            </ReactFlow>
        </div>
    );
};

const Tree = (props: TreeProps) => {
    return (
        <ReactFlowProvider>
            <TreeInner {...props} />
        </ReactFlowProvider>
    );
};

export default Tree;