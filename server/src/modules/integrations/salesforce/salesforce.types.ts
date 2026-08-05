export type SalesforceOAuthTokenResponse = {
  access_token: string;
  instance_url: string;
  token_type: string;
  issued_at: string;
  scope?: string;
};

export type SalesforceCompositeResponse = {
  compositeResponse: Array<{
    body: {
      id: string;
      success?: boolean;
      errors?: unknown[];
    };
    httpStatusCode: number;
    referenceId: string;
  }>;
};

export type SalesforceProfileExportInput = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  location?: string | null;
  company: string;
  phone?: string | null;
  notes?: string | null;
};

export type SalesforceProfileExportResult = {
  salesforceAccountId: string;
  salesforceContactId: string;
  instanceUrl: string;
};
