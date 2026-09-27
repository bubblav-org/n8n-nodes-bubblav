import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Make an authenticated request to the BubblaV integration API.
 *
 * All endpoints live under `{baseUrl}/api/integrations/zapier/*` — the same
 * routes that back the Zapier app. API keys (`bubblav_mcp_…`) are accepted via
 * `Authorization: Bearer …` on every route; `website_id` is always derived
 * server-side from the key, so it is never sent.
 */
export async function bubblavApiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
	const credentials = await this.getCredentials('bubblavApi');
	const baseURL = (credentials.baseUrl as string).replace(/\/+$/, '');

	try {
		return await this.helpers.httpRequestWithAuthentication.call(this, 'bubblavApi', {
			method,
			url: endpoint,
			baseURL,
			body,
			qs,
			json: true,
		});
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}
