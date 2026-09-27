import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class BubblavApi implements ICredentialType {
	name = 'bubblavApi';

	displayName = 'BubblaV API';

	icon = 'file:bubblav.svg' as const;

	documentationUrl = 'https://docs.bubblav.com/user-guide/integrations/n8n';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'BubblaV Dashboard → your website → Settings → API keys → Create key (bubblav_mcp_…)',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: 'https://www.bubblav.com',
			description: 'Override only for staging/testing environments',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/integrations/zapier/me',
			method: 'GET',
		},
	};
}
