import { SalesforceOAuthTokenResponse } from './salesforce.types';

type SalesforceConfig = {
  loginUrl: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  apiVersion: string;
  onRefreshToken?: (refreshToken: string) => void | Promise<void>;
};

type SalesforceSObjectCreateResult = {
  id?: string;
  success?: boolean;
  errors?: Array<{ message?: string; errorCode?: string }>;
};

type SalesforceDuplicateErrorBody = {
  duplicateResult?: {
    allowSave?: boolean;
    duplicateRule?: string;
    duplicateRuleEntityType?: string;
    errorMessage?: string;
    matchResults?: Array<{
      entityType: string;
      errors: unknown[];
      matchEngine: string;
      matchRecords: Array<{
        additionalInformation: unknown[];
        fieldDiffs: unknown[];
        matchConfidence: number;
        record: {
          attributes: { type: string; url: string };
          Id: string;
        };
      }>;
      rule: string;
      size: number;
      success: boolean;
    }>;
  };
  errorCode?: string;
  message?: string;
};

export class SalesforceClient {
  private accessToken: string | null = null;
  private instanceUrl: string | null = null;
  private refreshToken: string;

  constructor(private readonly config: SalesforceConfig) {
    this.refreshToken = config.refreshToken;
  }

  private async persistRefreshToken(nextRefreshToken?: string): Promise<void> {
    if (!nextRefreshToken || nextRefreshToken === this.refreshToken) {
      return;
    }

    this.refreshToken = nextRefreshToken;
    console.log('[SalesforceClient] refresh token rotated');

    if (this.config.onRefreshToken) {
      await this.config.onRefreshToken(nextRefreshToken);
    }
  }

  private async refreshAccessToken(): Promise<void> {
    console.log('[SalesforceClient] refreshing access token');

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.refreshToken
    });

    const response = await fetch(`${this.config.loginUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    const text = await response.text();
    console.log('[SalesforceClient] token response', {
      ok: response.ok,
      status: response.status,
      text
    });

    if (!response.ok) {
      throw new Error(`Salesforce token refresh failed: ${response.status} ${text}`);
    }

    const data = JSON.parse(text) as SalesforceOAuthTokenResponse & {
      refresh_token?: string;
    };

    this.accessToken = data.access_token;
    this.instanceUrl = data.instance_url;

    await this.persistRefreshToken(data.refresh_token);

    console.log('[SalesforceClient] token refreshed', {
      hasAccessToken: Boolean(this.accessToken),
      instanceUrl: this.instanceUrl
    });
  }

  private async ensureAuth(): Promise<void> {
    if (!this.accessToken || !this.instanceUrl) {
      await this.refreshAccessToken();
    }
  }

  private async requestRaw(path: string, init: RequestInit): Promise<{ status: number; text: string }> {
    await this.ensureAuth();

    const response = await fetch(`${this.instanceUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {})
      }
    });

    const text = await response.text();
    console.log('[SalesforceClient] request response', {
      path,
      ok: response.ok,
      status: response.status,
      text
    });

    return { status: response.status, text };
  }

  private async requestJson<T>(path: string, init: RequestInit): Promise<T> {
    const { status, text } = await this.requestRaw(path, init);

    if (status < 200 || status >= 300) {
      throw new Error(`Salesforce request failed: ${status} ${text}`);
    }

    return JSON.parse(text) as T;
  }

  async createAccount(input: { accountName: string }): Promise<string> {
    console.log('[SalesforceClient] createAccount', input);

    const result = await this.requestJson<SalesforceSObjectCreateResult>(
      `/services/data/v${this.config.apiVersion}/sobjects/Account`,
      {
        method: 'POST',
        body: JSON.stringify({
          Name: input.accountName
        })
      }
    );

    if (!result.id) {
      throw new Error(`Failed to create Account: ${JSON.stringify(result)}`);
    }

    console.log('[SalesforceClient] created Account', result.id);
    return result.id;
  }

  async createOrResolveContact(input: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    description?: string | null;
    accountId: string;
  }): Promise<string> {
    console.log('[SalesforceClient] createOrResolveContact', input);

    const { status, text } = await this.requestRaw(
      `/services/data/v${this.config.apiVersion}/sobjects/Contact`,
      {
        method: 'POST',
        body: JSON.stringify({
          FirstName: input.firstName,
          LastName: input.lastName,
          Email: input.email,
          Phone: input.phone ?? null,
          Description: input.description ?? null,
          AccountId: input.accountId
        })
      }
    );

    // Normal success case.
    if (status >= 200 && status < 300) {
      const result = JSON.parse(text) as SalesforceSObjectCreateResult;
      if (!result.id) {
        throw new Error(`Failed to create Contact: ${text}`);
      }
      console.log('[SalesforceClient] created Contact', result.id);
      return result.id;
    }

    // Duplicate handling.
    try {
      const body = JSON.parse(text) as SalesforceDuplicateErrorBody | SalesforceDuplicateErrorBody[];
      const payload = Array.isArray(body) ? body[0] : body;

      if (payload && payload.errorCode === 'DUPLICATES_DETECTED' && payload.duplicateResult) {
        const matchResult = payload.duplicateResult.matchResults?.[0];
        const matchRecord = matchResult?.matchRecords?.[0];
        const existingId = matchRecord?.record?.Id;

        if (existingId) {
          console.log('[SalesforceClient] resolved duplicate Contact', {
            existingId,
            duplicateRule: payload.duplicateResult.duplicateRule
          });
          return existingId;
        }
      }

      throw new Error(`Salesforce duplicate detection without resolvable Contact Id: ${text}`);
    } catch (error) {
      throw new Error(`Salesforce Contact create failed: ${status} ${text}`);
    }
  }

  getInstanceUrl(): string | null {
    return this.instanceUrl;
  }

  getRefreshToken(): string {
    return this.refreshToken;
  }

  async getTokenPreview(): Promise<{ instanceUrl: string | null }> {
    await this.ensureAuth();
    return { instanceUrl: this.instanceUrl };
  }
}
