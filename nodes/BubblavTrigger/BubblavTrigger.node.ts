import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { bubblavApiRequest } from '../Bubblav/GenericFunctions';

export class BubblavTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'BubblaV Trigger',
		name: 'bubblavTrigger',
		icon: { light: 'file:bubblav.svg', dark: 'file:bubblav.svg' },
		group: ['trigger'],
		version: [1],
		subtitle: '={{$parameter["events"].join(", ")}}',
		description:
			'Starts the workflow when BubblaV events occur (conversations, messages, leads, bookings). Each event is delivered as a bare JSON object — branch on payload fields to distinguish event types.',
		defaults: {
			name: 'BubblaV Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'bubblavApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [],
				description: 'The BubblaV events that trigger this workflow',
				options: [
					{ name: 'Cal.com Booking Cancelled', value: 'calcom.cancelled' },
					{ name: 'Cal.com Booking Created', value: 'calcom.booked' },
					{ name: 'Cal.com Booking Rescheduled', value: 'calcom.rescheduled' },
					{ name: 'Calendly Booking Cancelled', value: 'calendly.cancelled' },
					{ name: 'Calendly Booking Created', value: 'calendly.booked' },
					{ name: 'Calendly Booking Rescheduled', value: 'calendly.rescheduled' },
					{ name: 'Conversation Closed', value: 'conversation.closed' },
					{ name: 'Conversation Created', value: 'conversation.created' },
					{ name: 'Conversation Rated', value: 'conversation.rated' },
					{ name: 'Handoff Requested', value: 'handoff.requested' },
					{ name: 'Lead Captured', value: 'lead.captured' },
					{ name: 'Link Clicked', value: 'link.clicked' },
					{ name: 'Message Created', value: 'message.created' },
					{ name: 'Visitor First Visit', value: 'visitor.first_visit' },
					{ name: 'Visitor Return Visit', value: 'visitor.return_visit' },
				],
			},
		],
	};

	webhookMethods = {
		default: {
			// Subscribe is an upsert that also resets failure counters, so always
			// re-creating self-heals subscriptions auto-deactivated after
			// delivery failures. There is no list endpoint to verify remotely.
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				if (!webhookUrl) {
					throw new NodeOperationError(
						this.getNode(),
						'No webhook URL available — activate the workflow (or configure WEBHOOK_URL) so BubblaV can reach n8n',
					);
				}

				const events = this.getNodeParameter('events') as string[];
				const webhookData = this.getWorkflowStaticData('node');

				const subscriptionIds: string[] = [];
				for (const event of events) {
					const response = (await bubblavApiRequest.call(
						this,
						'POST',
						'/api/integrations/zapier/webhooks/subscribe',
						{ webhook_url: webhookUrl, event_type: event },
					)) as IDataObject;
					if (response.id) subscriptionIds.push(response.id as string);
				}

				webhookData.subscriptionIds = subscriptionIds;
				webhookData.webhookUrl = webhookUrl;
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const subscriptionIds = (webhookData.subscriptionIds as string[] | undefined) || [];

				for (const id of subscriptionIds) {
					try {
						await bubblavApiRequest.call(
							this,
							'DELETE',
							`/api/integrations/zapier/webhooks/${id}`,
						);
					} catch (error) {
						// Tolerate 404s — the subscription may already be gone
						// server-side. Surface anything else so deactivation
						// failures stay visible.
						if (error instanceof NodeApiError && error.httpCode === '404') continue;
						if (error instanceof NodeOperationError) {
							throw new NodeOperationError(this.getNode(), (error as Error).message);
						}
						throw new NodeApiError(this.getNode(), error as JsonObject);
					}
				}

				delete webhookData.subscriptionIds;
				delete webhookData.webhookUrl;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		return {
			workflowData: [[{ json: body }]],
		};
	}
}
