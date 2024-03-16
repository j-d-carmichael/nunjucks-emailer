export type EmailObject = { name?: string; email: string; }
export type EmailData = string | EmailObject

export interface EmailerRender {
  tplRelativePath?: string;
  tplHtmlString?: string;
  tplTxtString?: string;
  autoTxtFromHtml?: boolean;
  tplObject?: any;
}

export default interface EmailerSend extends EmailerRender {
  to: EmailData;
  from?: EmailData;
  subject?: string;
}
