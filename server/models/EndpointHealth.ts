export type EndpointCheckStatus = {
  label: string;
  method: string;
  url: string;
  ok: boolean;
  detail?: string;
  apiName?: string;
};
