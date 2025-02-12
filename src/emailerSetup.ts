import { EmailerConstructor } from '@/interfaces/EmailerContructor';
import path from 'path';

export default (emailerConstructor: EmailerConstructor): void => {
  global.OPENAPI_NODEGEN_EMAILER_SETTINGS = {
    tplPath: emailerConstructor.templatePath || path.join(process.cwd(), 'email/templates'),
    tplGlobalObject: emailerConstructor.templateGlobalObject || {},
    makeCssInline: emailerConstructor.makeCssInline || false,
    makeCssInlineOptions: emailerConstructor.makeCssInlineOptions || false,
    sendType: emailerConstructor.sendType,
    logPath: emailerConstructor.logPath || path.join(process.cwd(), 'email/logs'),
    fallbackFrom: emailerConstructor.fallbackFrom,
    fallbackSubject: emailerConstructor.fallbackSubject,
    nodemailer: emailerConstructor.nodemailer
  };
  if (emailerConstructor.nodemailer && emailerConstructor.nodemailer.host) {
    console.log(`NUNJUCKS-EMAILER: Setup with sendType ${emailerConstructor.sendType} & nodemailer host ${emailerConstructor.nodemailer.host}`);
  } else {
    console.log(`NUNJUCKS-EMAILER: Setup with sendType ${emailerConstructor.sendType}`);
  }
};
