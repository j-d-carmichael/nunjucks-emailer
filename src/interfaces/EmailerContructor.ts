import { EmailerSendTypes } from '@/enums/EmailerSendTypes';
import { EmailData } from '@/interfaces/EmailerSend';
import InlineCss from 'inline-css';

// Base interface without fallbackFrom and fallbackSubject, the only required attribute is sendType
interface BaseEmailerConstructor {
  logPath?: string;
  makeCssInline?: boolean;
  makeCssInlineOptions?: InlineCss.Options;
  sendType: EmailerSendTypes;
  templateGlobalObject?: any;
  templatePath?: string;
}

// Interface when sendType is not 'return', the fallbacks are required
interface DefaultEmailerConstructor extends BaseEmailerConstructor {
  fallbackFrom: EmailData;
  fallbackSubject: string;
  sendType: Exclude<EmailerSendTypes, 'return' | 'log' | 'file'>;
}

// Interface when sendType is 'return', the fallbacks are optional
interface ReturnEmailerConstructor extends BaseEmailerConstructor {
  fallbackFrom?: EmailData;
  fallbackSubject?: string;
  sendType: EmailerSendTypes.return | EmailerSendTypes.log | EmailerSendTypes.file;
}

// Conditional type to determine which interface to use based on sendType
export type EmailerConstructor = DefaultEmailerConstructor | ReturnEmailerConstructor;
