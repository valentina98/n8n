/* eslint-disable import/no-cycle */
import { IConnection, IDataObject, INode, INodeConnections } from 'n8n-workflow';
import { URL } from 'url';
import { WorkflowEntity } from '../databases/entities/WorkflowEntity';

interface INodesGraph {
	node_types: string[];
	node_connections: IDataObject[];
	nodes: INodesGraphNode;
}

interface INodesGraphNode {
	[key: string]: INodeItem;
}

interface INodeItem {
	type: string;
	domain?: string;
}

export async function generateNodesGraph(workflow: WorkflowEntity): Promise<INodesGraph> {
	const nodesGraph: INodesGraph = {
		node_types: [],
		node_connections: [],
		nodes: {},
	};
	const nodeNameAndInd: IDataObject = {};

	workflow.nodes.forEach((node: INode, index: number) => {
		nodesGraph.node_types.push(node.type);
		const nodeItem: INodeItem = {
			type: node.type,
		};

		if (node.type === 'n8n-nodes-base.httpRequest') {
			const { hostname } = new URL(node.parameters.url as string);
			nodeItem.domain = hostname;
		}
		nodesGraph.nodes[`${index}`] = nodeItem;
		nodeNameAndInd[node.name] = index.toString();
	});

	const getGraphConnectionItem = (startNode: string, connectionItem: IConnection) => {
		return { start: nodeNameAndInd[startNode], end: nodeNameAndInd[connectionItem.node] };
	};

	Object.keys(workflow.connections).forEach((nodeName) => {
		const connections: INodeConnections = workflow.connections[nodeName];
		connections.main.forEach((element: IConnection[]) => {
			element.forEach((element2) => {
				nodesGraph.node_connections.push(getGraphConnectionItem(nodeName, element2));
			});
		});
	});

	return nodesGraph;
}
