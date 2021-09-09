/* eslint-disable import/no-cycle */
import { IRun } from 'n8n-workflow';
import * as telemetryHelpers from './telemetry/helpers';
import { IInternalHooksClass, IWorkflowBase } from '.';
import { Telemetry } from './telemetry';
import { WorkflowEntity } from './databases/entities/WorkflowEntity';

export class InternalHooksClass implements IInternalHooksClass {
	constructor(private telemetry: Telemetry) {}

	async onServerStarted(n8nVersion: string): Promise<void> {
		await this.telemetry.identify({ n8n_version: n8nVersion });
		await this.telemetry.track('Instance started');
	}

	async onWorkflowSave(workflow: WorkflowEntity): Promise<void> {
		await this.telemetry.track('User saved workflow', {
			workflow_id: workflow.id?.toString(),
			nodes_graph: telemetryHelpers.generateNodesGraph(workflow),
		});
	}

	async onWorkflowActivated(workflow: WorkflowEntity): Promise<void> {
		await this.telemetry.track('User set workflow active status', {
			workflow_id: workflow.id.toString(),
			is_active: workflow.active,
		});
	}

	async onWorkflowTagsUpdated(workflowId: string, tagsCount: number): Promise<void> {
		await this.telemetry.track('User edited workflow tags', {
			workflow_id: workflowId,
			new_tag_count: tagsCount,
		});
	}

	async onWorkflowDeleted(workflowId: string): Promise<void> {
		await this.telemetry.track('User deleted workflow', {
			workflow_id: workflowId,
		});
	}

	async onWorkflowPostExecute(workflow: IWorkflowBase, runData?: IRun): Promise<void> {
		await this.telemetry.track('onWorkflowPostExecute', {
			workflow_id: workflow.id,
			nodes_graph: telemetryHelpers.generateNodesGraph(workflow),
			execution_mode: runData ? runData.mode : '',
		});
	}
}