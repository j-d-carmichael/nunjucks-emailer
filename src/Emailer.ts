import path = require('path');
import fs from 'fs-extra';
import sgMail from '@sendgrid/mail';
import inlineCss from 'inline-css';
import EmailerSendObject from '@/interfaces/EmailerSendObject';
import nunjucks from 'nunjucks';
import { EmailerSendTypes } from '@/enums/EmailerSendTypes';
import EmailerSend from '@/interfaces/EmailerSend';
import EmailerSendObjectWithGlobals from '@/interfaces/EmailerSendObjectWithGlobals';
import getSubjectFromHtml from '@/utils/getSubjectFromHtml';
import convertHtmlToTxt from '@/utils/convertHtmlToTxt';

class Emailer {
  async send (emailerSend: EmailerSend): Promise<EmailerSendObjectWithGlobals> {
    if (!this.hasBeenInitialized()) {
      throw new Error('You must first call EmailerSetup before using the Emailer class.');
    }
    const config = global.OPENAPI_NODEGEN_EMAILER_SETTINGS;
    const htmlTpl = emailerSend.tplHtmlString || (await fs.readFile(path.join(config.tplPath, emailerSend.tplRelativePath + '.html.njk'))).toString();
    let HTMLString = this.renderTemplate(htmlTpl, emailerSend.tplObject);

    if (config.makeCssInline) {
      const cssInlineOpts = config.makeCssInlineOptions || {};
      HTMLString = await inlineCss(HTMLString, cssInlineOpts);
    }

    let txtString: string;
    if (emailerSend.autoTxtFromHtml) {
      txtString = convertHtmlToTxt(HTMLString);
    } else {
      const txtTpl = emailerSend.tplTxtString || (await fs.readFile(path.join(config.tplPath, emailerSend.tplRelativePath + '.txt.njk'))).toString();
      txtString = this.renderTemplate(txtTpl, emailerSend.tplObject);
    }

    // try and get the subject line from the HTML email template
    const subjectFromHtmlString = getSubjectFromHtml(HTMLString);

    // prep the message object
    const messageObject = {
      from: emailerSend.from || config.fallbackFrom,
      html: HTMLString,
      subject: emailerSend.subject || subjectFromHtmlString || config.fallbackSubject,
      text: txtString,
      to: emailerSend.to,
      tplObject: emailerSend.tplObject || {},
      tplRelativePath: emailerSend.tplRelativePath,
    };
    return await this.sendTo(messageObject);
  }

  getLogFileNames (): Promise<string[]> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      fs.readdir(global.OPENAPI_NODEGEN_EMAILER_SETTINGS.logPath, function (err, files) {
        if (err) {
          console.error('Unable to scan directory: ' + global.OPENAPI_NODEGEN_EMAILER_SETTINGS.logPath);
          return reject(err);
        }
        return resolve(files);
      });
    });
  }

  getLatestLogFileData (): Promise<EmailerSendObjectWithGlobals> {
    return new Promise(async (resolve, reject) => {
      fs.readJSON(
        path.join(
          global.OPENAPI_NODEGEN_EMAILER_SETTINGS.logPath,
          (await this.getLogFileNames()).pop(),
        ),
        (err, json) => {
          if (err) {
            return reject(err);
          }
          return resolve(json);
        });
    });
  }

  removeAllEmailJsonLogFiles (): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fs.emptyDir(global.OPENAPI_NODEGEN_EMAILER_SETTINGS.logPath, (err) => {
        if (err) {
          console.error('There was an error clearing the log folder');
          return reject(err);
        }
        return resolve(true);
      });
    });
  }

  hasBeenInitialized (): boolean {
    return !(global.OPENAPI_NODEGEN_EMAILER_SETTINGS === undefined);
  }

  calculateLogFilePath (tplRelPath: string): string {
    return path.join(
      global.OPENAPI_NODEGEN_EMAILER_SETTINGS.logPath,
      new Date().getTime() + tplRelPath + '.json',
    );
  }

  renderTemplate (templateAsAString: string, templateObject?: any): string {
    nunjucks.configure({
      autoescape: false,
    });
    const env = new nunjucks.Environment(
      new nunjucks.FileSystemLoader(global.OPENAPI_NODEGEN_EMAILER_SETTINGS.tplPath)
    );
    for (const key in global.OPENAPI_NODEGEN_EMAILER_SETTINGS.tplGlobalObject) {
      if (global.OPENAPI_NODEGEN_EMAILER_SETTINGS.tplGlobalObject.hasOwnProperty(key)) {
        env.addGlobal(key, global.OPENAPI_NODEGEN_EMAILER_SETTINGS.tplGlobalObject[key]);
      }
    }
    return env.renderString(
      templateAsAString,
      templateObject || {}
    );
  }

  async sendTo (sendObject: EmailerSendObject): Promise<EmailerSendObjectWithGlobals> {
    const sendObjectWithGlobals: EmailerSendObjectWithGlobals = Object.assign(sendObject, {
      tplGlobalObject: global.OPENAPI_NODEGEN_EMAILER_SETTINGS.tplGlobalObject,
    });
    switch (global.OPENAPI_NODEGEN_EMAILER_SETTINGS.sendType) {
      case EmailerSendTypes.log:
        console.log(sendObjectWithGlobals);
        break;
      case EmailerSendTypes.file:
        sendObjectWithGlobals.loggedFilePath = await this.writeFile(sendObject.tplRelativePath, sendObjectWithGlobals);
        break;
      case EmailerSendTypes.sendgrid:
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await sgMail.send(sendObjectWithGlobals);
    }
    return sendObjectWithGlobals;
  }

  writeFile (tplRelativePath: string, object: EmailerSendObjectWithGlobals): Promise<string> {
    return new Promise((resolve, reject) => {
      const filePath = this.calculateLogFilePath(tplRelativePath);
      fs.writeFile(filePath, JSON.stringify(object), 'utf8', (err) => {
        if (err) {
          return reject(err);
        }
        return resolve(filePath);
      });
    });
  }
}

export default new Emailer();
