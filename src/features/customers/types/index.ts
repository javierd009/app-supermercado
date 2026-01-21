export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  isGeneric: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
}

export const GENERIC_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001';
export const GENERIC_CUSTOMER_NAME = 'Cliente General';
