export interface BusinessConfig {
  business_name: string;
  business_phone: string;
  business_address: string;
  receipt_footer: string;
}

export interface ConfigItem {
  id: string;
  key: string;
  value: string;
}
