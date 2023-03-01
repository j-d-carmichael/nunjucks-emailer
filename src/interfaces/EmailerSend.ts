export type EmailData = string | { name?: string; email: string; }

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
