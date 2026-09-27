import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { bubblavApiRequest } from './GenericFunctions';

export class Bubblav implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'BubblaV',
		name: 'bubblav',
		icon: { light: 'file:bubblav.svg', dark: 'file:bubblav.svg' },
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with your BubblaV AI chatbot — send messages, manage conversations, customers, tickets and analytics',
		defaults: {
			name: 'BubblaV',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'bubblavApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Chatbot', value: 'chatbot' },
					{ name: 'Conversation', value: 'conversation' },
					{ name: 'Customer', value: 'customer' },
					{ name: 'Message', value: 'message' },
					{ name: 'Ticket', value: 'ticket' },
					{ name: 'Website', value: 'website' },
				],
				default: 'message',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['message'] } },
				options: [
					{
						name: 'Send Greeting',
						value: 'sendGreeting',
						description:
							'Send a transient greeting to a visitor. Shown only while the visitor is online.',
						action: 'Send a greeting',
					},
					{
						name: 'Send Message',
						value: 'sendMessage',
						description:
							'Send a message to a conversation, or start a new conversation by targeting a visitor',
						action: 'Send a message',
					},
				],
				default: 'sendMessage',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['conversation'] } },
				options: [
					{
						name: 'Find',
						value: 'findConversation',
						description: 'Find conversations by ID, visitor, or email',
						action: 'Find conversations',
					},
					{
						name: 'Tag',
						value: 'tagConversation',
						description: 'Add or replace tags on a conversation',
						action: 'Tag a conversation',
					},
				],
				default: 'findConversation',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['customer'] } },
				options: [
					{
						name: 'Find',
						value: 'findCustomer',
						description: 'Find customers by visitor ID or email',
						action: 'Find customers',
					},
					{
						name: 'Update',
						value: 'updateCustomer',
						description: 'Update customer or visitor information',
						action: 'Update a customer',
					},
				],
				default: 'updateCustomer',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['ticket'] } },
				options: [
					{
						name: 'Create',
						value: 'createTicket',
						description:
							'Create a support ticket from a conversation. Creates an internal tag if Zendesk is unavailable.',
						action: 'Create a ticket',
					},
				],
				default: 'createTicket',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['chatbot'] } },
				options: [
					{
						name: 'Ask Question',
						value: 'askQuestion',
						description: 'Ask your AI chatbot a question and get an answer from your knowledge base',
						action: 'Ask the chatbot a question',
					},
				],
				default: 'askQuestion',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['website'] } },
				options: [
					{
						name: 'Get Analytics',
						value: 'getAnalytics',
						description: 'Get conversation and message analytics for your website',
						action: 'Get analytics',
					},
				],
				default: 'getAnalytics',
			},

			// ---------- Message: Send Message ----------
			{
				displayName: 'Send To',
				name: 'sendTo',
				type: 'options',
				displayOptions: {
					show: { resource: ['message'], operation: ['sendMessage'] },
				},
				options: [
					{
						name: 'Conversation',
						value: 'conversation',
						description: 'Reply to an existing conversation thread',
					},
					{
						name: 'Visitor',
						value: 'visitor',
						description: 'Start a new conversation with a visitor',
					},
				],
				default: 'conversation',
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				required: true,
				displayOptions: {
					show: { resource: ['message'], operation: ['sendMessage'], sendTo: ['conversation'] },
				},
				default: '',
				description: 'The conversation ID to send the message to',
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				required: true,
				displayOptions: {
					show: { resource: ['message'], operation: ['sendMessage'], sendTo: ['visitor'] },
				},
				default: '',
				description: 'The visitor ID to start a new conversation with',
			},
			{
				displayName: 'Message Content',
				name: 'content',
				type: 'string',
				typeOptions: { rows: 4 },
				required: true,
				displayOptions: {
					show: { resource: ['message'], operation: ['sendMessage'] },
				},
				default: '',
				description: 'The message text to send',
			},
			{
				displayName: 'Sender Type',
				name: 'senderType',
				type: 'options',
				displayOptions: {
					show: { resource: ['message'], operation: ['sendMessage'] },
				},
				options: [
					{ name: 'Agent', value: 'agent' },
					{ name: 'Bot', value: 'bot' },
					{ name: 'System', value: 'system' },
				],
				default: 'bot',
				description: 'Who is sending this message',
			},
			{
				displayName: 'Sender Name',
				name: 'senderName',
				type: 'string',
				displayOptions: {
					show: { resource: ['message'], operation: ['sendMessage'] },
				},
				default: '',
				description: 'Optional name to display for the sender',
			},

			// ---------- Message: Send Greeting ----------
			{
				displayName: 'Visitor ID',
				name: 'visitorId',
				type: 'string',
				required: true,
				displayOptions: {
					show: { resource: ['message'], operation: ['sendGreeting'] },
				},
				default: '',
				description: 'The visitor ID to send the greeting to',
			},
			{
				displayName: 'Greeting Message',
				name: 'message',
				type: 'string',
				typeOptions: { rows: 4 },
				required: true,
				displayOptions: {
					show: { resource: ['message'], operation: ['sendGreeting'] },
				},
				default: '',
				description: 'The greeting text to show',
			},

			// ---------- Conversation: Find ----------
			{
				displayName: 'Conversation ID',
				name: 'conversationId',
				type: 'string',
				displayOptions: {
					show: { resource: ['conversation'], operation: ['findConversation'] },
				},
				default: '',
				description: 'Search by exact conversation ID',
			},
			{
				displayName: 'Visitor ID',
				name: 'visitorId',
				type: 'string',
				displayOptions: {
					show: { resource: ['conversation'], operation: ['findConversation'] },
				},
				default: '',
				description: 'Search by visitor ID',
			},
			{
				displayName: 'Visitor Email',
				name: 'visitorEmail',
				type: 'string',
				displayOptions: {
					show: { resource: ['conversation'], operation: ['findConversation'] },
				},
				default: '',
				description: 'Search by visitor email address',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: { resource: ['conversation'], operation: ['findConversation'] },
				},
				default: 50,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Max number of results to return',
			},

			// ---------- Conversation: Tag ----------
			{
				displayName: 'Conversation ID',
				name: 'conversationId',
				type: 'string',
				required: true,
				displayOptions: {
					show: { resource: ['conversation'], operation: ['tagConversation'] },
				},
				default: '',
				description: 'The conversation to tag',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				required: true,
				displayOptions: {
					show: { resource: ['conversation'], operation: ['tagConversation'] },
				},
				default: '',
				placeholder: 'sales-lead, enterprise',
				description: 'Comma-separated list of tags',
			},
			{
				displayName: 'Action',
				name: 'tagAction',
				type: 'options',
				displayOptions: {
					show: { resource: ['conversation'], operation: ['tagConversation'] },
				},
				options: [
					{ name: 'Add to Existing Tags', value: 'add' },
					{ name: 'Replace Existing Tags', value: 'set' },
				],
				default: 'add',
				description: 'Whether to add to or replace the conversation tags',
			},

			// ---------- Customer: Update ----------
			{
				displayName: 'Target',
				name: 'sendTo',
				type: 'options',
				displayOptions: {
					show: { resource: ['customer'], operation: ['updateCustomer'] },
				},
				options: [
					{ name: 'Conversation', value: 'conversation' },
					{ name: 'Visitor', value: 'visitor' },
				],
				default: 'conversation',
				description: 'Update the customer of a conversation, or a visitor directly',
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				required: true,
				displayOptions: {
					show: { resource: ['customer'], operation: ['updateCustomer'], sendTo: ['conversation'] },
				},
				default: '',
				description: 'The conversation ID whose customer to update',
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				required: true,
				displayOptions: {
					show: { resource: ['customer'], operation: ['updateCustomer'], sendTo: ['visitor'] },
				},
				default: '',
				description: 'The visitor ID to update',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				displayOptions: {
					show: { resource: ['customer'], operation: ['updateCustomer'] },
				},
				default: '',
				description: 'Customer email address',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				displayOptions: {
					show: { resource: ['customer'], operation: ['updateCustomer'] },
				},
				default: '',
				description: 'Customer full name',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				displayOptions: {
					show: { resource: ['customer'], operation: ['updateCustomer'] },
				},
				default: '',
				description: 'Customer phone number',
			},
			{
				displayName: 'Company',
				name: 'company',
				type: 'string',
				displayOptions: {
					show: { resource: ['customer'], operation: ['updateCustomer'] },
				},
				default: '',
				description: 'Stored under custom fields',
			},
			{
				displayName: 'Custom Fields (JSON)',
				name: 'customFields',
				type: 'string',
				displayOptions: {
					show: { resource: ['customer'], operation: ['updateCustomer'] },
				},
				default: '',
				placeholder: '{"plan": "enterprise"}',
				description: 'JSON object with custom fields to store',
			},

			// ---------- Customer: Find ----------
			{
				displayName: 'Visitor ID',
				name: 'visitorId',
				type: 'string',
				displayOptions: {
					show: { resource: ['customer'], operation: ['findCustomer'] },
				},
				default: '',
				description: 'Search by exact visitor ID',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				displayOptions: {
					show: { resource: ['customer'], operation: ['findCustomer'] },
				},
				default: '',
				description: 'Search by email address',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: { resource: ['customer'], operation: ['findCustomer'] },
				},
				default: 50,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Max number of results to return',
			},

			// ---------- Ticket: Create ----------
			{
				displayName: 'Conversation ID',
				name: 'conversationId',
				type: 'string',
				required: true,
				displayOptions: {
					show: { resource: ['ticket'], operation: ['createTicket'] },
				},
				default: '',
				description: 'The conversation to create a ticket from',
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				required: true,
				displayOptions: {
					show: { resource: ['ticket'], operation: ['createTicket'] },
				},
				default: '',
				description: 'The ticket subject line',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 4 },
				displayOptions: {
					show: { resource: ['ticket'], operation: ['createTicket'] },
				},
				default: '',
				description: 'Additional details about the issue',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				displayOptions: {
					show: { resource: ['ticket'], operation: ['createTicket'] },
				},
				options: [
					{ name: 'Low', value: 'low' },
					{ name: 'Normal', value: 'normal' },
					{ name: 'High', value: 'high' },
					{ name: 'Urgent', value: 'urgent' },
				],
				default: 'normal',
				description: 'Ticket priority level',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				displayOptions: {
					show: { resource: ['ticket'], operation: ['createTicket'] },
				},
				default: '',
				placeholder: 'billing, urgent',
				description: 'Comma-separated tags to add to the ticket',
			},

			// ---------- Chatbot: Ask Question ----------
			{
				displayName: 'Question',
				name: 'question',
				type: 'string',
				typeOptions: { rows: 4 },
				required: true,
				displayOptions: {
					show: { resource: ['chatbot'], operation: ['askQuestion'] },
				},
				default: '',
				description: 'The question you want to ask the chatbot',
			},
			{
				displayName: 'Context',
				name: 'context',
				type: 'string',
				typeOptions: { rows: 3 },
				displayOptions: {
					show: { resource: ['chatbot'], operation: ['askQuestion'] },
				},
				default: '',
				description: 'Additional context to help the chatbot understand the question',
			},
			{
				displayName: 'Tone of Voice',
				name: 'tone',
				type: 'string',
				displayOptions: {
					show: { resource: ['chatbot'], operation: ['askQuestion'] },
				},
				default: '',
				placeholder: 'professional, friendly, casual…',
				description: 'How the chatbot should respond',
			},

			// ---------- Website: Get Analytics ----------
			{
				displayName: 'Time Period',
				name: 'period',
				type: 'options',
				displayOptions: {
					show: { resource: ['website'], operation: ['getAnalytics'] },
				},
				options: [
					{ name: 'Last 24 Hours', value: '1d' },
					{ name: 'Last 7 Days', value: '7d' },
					{ name: 'Last 30 Days', value: '30d' },
					{ name: 'Last 90 Days', value: '90d' },
				],
				default: '7d',
				description: 'The time period for analytics',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let responseData: IDataObject | IDataObject[] | undefined;

				if (resource === 'message' && operation === 'sendMessage') {
					const sendTo = this.getNodeParameter('sendTo', i) as string;
					const id = this.getNodeParameter('id', i) as string;
					const content = this.getNodeParameter('content', i) as string;
					const senderType = this.getNodeParameter('senderType', i) as string;
					const senderName = this.getNodeParameter('senderName', i) as string;

					const body: IDataObject = {
						content,
						sender_type: senderType || 'bot',
					};
					if (sendTo === 'conversation') {
						body.conversation_id = id;
					} else {
						body.visitor_id = id;
					}
					if (senderName) body.sender_name = senderName;

					responseData = await bubblavApiRequest.call(
						this,
						'POST',
						'/api/integrations/zapier/actions/messages',
						body,
					);
				} else if (resource === 'message' && operation === 'sendGreeting') {
					const visitorId = this.getNodeParameter('visitorId', i) as string;
					const message = this.getNodeParameter('message', i) as string;

					responseData = await bubblavApiRequest.call(
						this,
						'POST',
						'/api/integrations/zapier/actions/greeting',
						{ visitor_id: visitorId, message },
					);
				} else if (resource === 'conversation' && operation === 'findConversation') {
					const conversationId = this.getNodeParameter('conversationId', i) as string;
					const visitorId = this.getNodeParameter('visitorId', i) as string;
					const visitorEmail = this.getNodeParameter('visitorEmail', i) as string;
					const limit = this.getNodeParameter('limit', i) as number;

					const qs: IDataObject = { limit };
					if (conversationId) qs.id = conversationId;
					if (visitorId) qs.visitor_id = visitorId;
					if (visitorEmail) qs.visitor_email = visitorEmail;

					const data = await bubblavApiRequest.call(
						this,
						'GET',
						'/api/integrations/zapier/searches/conversations',
						undefined,
						qs,
					);
					responseData = Array.isArray(data) ? (data as IDataObject[]) : [];
				} else if (resource === 'conversation' && operation === 'tagConversation') {
					const conversationId = this.getNodeParameter('conversationId', i) as string;
					const tagsRaw = this.getNodeParameter('tags', i) as string;
					const tagAction = this.getNodeParameter('tagAction', i) as string;

					const tags = tagsRaw
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean);

					if (tags.length === 0) {
						throw new NodeOperationError(this.getNode(), 'At least one tag is required', {
							itemIndex: i,
						});
					}

					responseData = await bubblavApiRequest.call(
						this,
						'POST',
						'/api/integrations/zapier/actions/tags',
						{ conversation_id: conversationId, tags, action: tagAction },
					);
				} else if (resource === 'customer' && operation === 'updateCustomer') {
					const sendTo = this.getNodeParameter('sendTo', i) as string;
					const id = this.getNodeParameter('id', i) as string;
					const email = this.getNodeParameter('email', i) as string;
					const name = this.getNodeParameter('name', i) as string;
					const phone = this.getNodeParameter('phone', i) as string;
					const company = this.getNodeParameter('company', i) as string;
					const customFieldsRaw = this.getNodeParameter('customFields', i) as string;

					const body: IDataObject = {};
					if (sendTo === 'conversation') {
						body.conversation_id = id;
					} else {
						body.visitor_id = id;
					}
					if (email) body.email = email;
					if (name) body.name = name;
					if (phone) body.phone = phone;

					let customFields: IDataObject | undefined;
					if (customFieldsRaw) {
						try {
							customFields = JSON.parse(customFieldsRaw) as IDataObject;
						} catch {
							throw new NodeOperationError(this.getNode(), 'Invalid JSON in Custom Fields field', {
								itemIndex: i,
							});
						}
					}
					if (company) {
						customFields = { ...(customFields || {}), company };
					}
					if (customFields) body.custom_fields = customFields;

					responseData = await bubblavApiRequest.call(
						this,
						'POST',
						'/api/integrations/zapier/actions/customers',
						body,
					);
				} else if (resource === 'customer' && operation === 'findCustomer') {
					const visitorId = this.getNodeParameter('visitorId', i) as string;
					const email = this.getNodeParameter('email', i) as string;
					const limit = this.getNodeParameter('limit', i) as number;

					const qs: IDataObject = { limit };
					if (visitorId) qs.visitor_id = visitorId;
					if (email) qs.email = email;

					const data = await bubblavApiRequest.call(
						this,
						'GET',
						'/api/integrations/zapier/searches/customers',
						undefined,
						qs,
					);
					responseData = Array.isArray(data) ? (data as IDataObject[]) : [];
				} else if (resource === 'ticket' && operation === 'createTicket') {
					const conversationId = this.getNodeParameter('conversationId', i) as string;
					const subject = this.getNodeParameter('subject', i) as string;
					const description = this.getNodeParameter('description', i) as string;
					const priority = this.getNodeParameter('priority', i) as string;
					const tagsRaw = this.getNodeParameter('tags', i) as string;

					const tags = tagsRaw
						? tagsRaw
								.split(',')
								.map((t) => t.trim())
								.filter(Boolean)
						: [];

					const body: IDataObject = {
						conversation_id: conversationId,
						subject,
						priority: priority || 'normal',
						tags,
					};
					if (description) body.description = description;

					responseData = await bubblavApiRequest.call(
						this,
						'POST',
						'/api/integrations/zapier/actions/tickets',
						body,
					);
				} else if (resource === 'chatbot' && operation === 'askQuestion') {
					const question = this.getNodeParameter('question', i) as string;
					const context = this.getNodeParameter('context', i) as string;
					const tone = this.getNodeParameter('tone', i) as string;

					const body: IDataObject = { question };
					if (context) body.context = context;
					if (tone) body.tone = tone;

					responseData = await bubblavApiRequest.call(
						this,
						'POST',
						'/api/integrations/zapier/actions/ask-question',
						body,
					);
				} else if (resource === 'website' && operation === 'getAnalytics') {
					const period = this.getNodeParameter('period', i) as string;

					responseData = await bubblavApiRequest.call(
						this,
						'GET',
						'/api/integrations/zapier/searches/analytics',
						undefined,
						{ period: period || '7d' },
					);
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not supported for resource "${resource}"`,
						{ itemIndex: i },
					);
				}

				if (Array.isArray(responseData)) {
					const executionData = this.helpers.returnJsonArray(responseData);
					returnData.push(...executionData.map((d) => ({ ...d, pairedItem: { item: i } })));
				} else if (responseData !== undefined) {
					returnData.push({ json: responseData, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				if (error instanceof NodeOperationError) {
					throw new NodeOperationError(this.getNode(), (error as Error).message, { itemIndex: i });
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
