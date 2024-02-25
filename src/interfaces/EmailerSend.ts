export type EmailObject = { name?: string; email: string; }
export type EmailData = string | EmailObject

export default interface EmailerSend {
  to: EmailData;
  tplRelativePath?: string;
  tplHtmlString?: string;
  tplTxtString?: string;
  autoTxtFromHtml?: boolean;
  from?: EmailData;
  subject?: string;
  tplObject?: any;
}
