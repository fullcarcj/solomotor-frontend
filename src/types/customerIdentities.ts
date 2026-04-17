/** GET /api/customers/:id/identities — monitor S2 canales vinculados */
export interface CustomerIdentityRow {
  source:      string;
  external_id: string;
}

export interface CustomerMlBuyerRow {
  buyer_id:    string;
  is_primary?: boolean;
}

export interface CustomerIdentitiesResponse {
  identities?: CustomerIdentityRow[];
  ml_buyers?:  CustomerMlBuyerRow[];
}
