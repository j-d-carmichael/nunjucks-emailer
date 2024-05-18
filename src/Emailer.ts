import path = require('path');
import fs from 'fs-extra';
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import mailchimp from '@mailchimp/mailchimp_transactional';
import inlineCss from 'inline-css';
import EmailerSendObject from '@/interfaces/EmailerSendObject';
import nunjucks from 'nunjucks';
import { EmailerSendTypes } from '@/enums/EmailerSendTypes';
import EmailerSend, { EmailerRender } from '@/interfaces/EmailerSend';
import EmailerSendObjectWithGlobals from '@/interfaces/EmailerSendObjectWithGlobals';
import getSubjectFromHtml from '@/utils/getSubjectFromHtml';
import convertHtmlToTxt from '@/utils/convertHtmlToTxt';

class Emailer {
  async renderHtml (emailerRender: EmailerRender) {
    const config = global.OPENAPI_NODEGEN_EMAILER_SETTINGS;
    let htmlTpl;

    const htmlTplpath = path.join(config.tplPath, emailerRender.tplRelativePath + '.html.njk');
    try {
      htmlTpl = emailerRender.tplHtmlString || (await fs.readFile(htmlTplpath)).toString();
    } catch (e) {
      console.error('The template path was not found: ' + htmlTplpath);
      throw e;
    }

    let html;
    try {
      html = this.renderTemplate(htmlTpl, emailerRender.tplObject);
    } catch (e) {
      console.error('There was an error rendering the template: ' + htmlTplpath);
      console.error('The tpl object passed:', emailerRender.tplObject);
      throw e;
    }

    const inputCssInlineOpts = config.makeCssInlineOptions || {};
    const cssInlineOptions = {
      url: 'filePath', // this is a required field from inline-css, just ensure the default value is set
      ...inputCssInlineOpts
    };
    try {
      html = inlineCss(html, cssInlineOptions);
    } catch (e) {
      console.error('There was an error converting the CSS to inline CSS. Here were the options used:', cssInlineOptions);
      throw e;
    }

    return html;
  }

  async renderTxt (emailerRender: EmailerRender, html: string) {
    const config = global.OPENAPI_NODEGEN_EMAILER_SETTINGS;
    let text: string;
    if (!emailerRender.autoTxtFromHtml) {
      let txtTpl;
      if (emailerRender.tplTxtString) {
        txtTpl = emailerRender.tplTxtString;
      } else {
        const txtFilePath = path.join(config.tplPath, emailerRender.tplRelativePath + '.txt.njk');
        if (await fs.pathExists(txtFilePath)) {
          txtTpl = (await fs.readFile(txtFilePath)).toString();
        }
      }
      // if we have a txt tpl, render it
      if (txtTpl) {
        text = this.renderTemplate(txtTpl, emailerRender.tplObject);
      }
    }
    // No text... the fallback is to convert the HTML to TXT part automatically if not manually written
    if (!text) {
      text = convertHtmlToTxt(html);
    }
    return text;
  }

  async renderEmailToHtmlAndTxt (emailerRender: EmailerRender): Promise<{ html: string, text: string }> {
    const html = await this.renderHtml(emailerRender);
    return {
      html,
      text: await this.renderTxt(emailerRender, html)
    };
  }

  async send (emailerSend: EmailerSend): Promise<EmailerSendObjectWithGlobals> {
    if (!this.hasBeenInitialized()) {
      throw new Error('You must first call EmailerSetup before using the Emailer class.');
    }

    const config = global.OPENAPI_NODEGEN_EMAILER_SETTINGS;
    const { text, html } = await this.renderEmailToHtmlAndTxt(emailerSend);

    // try and get the subject line from the HTML email template
    const subjectFromHtmlString = getSubjectFromHtml(html);

    // prep the message object
    const messageObject = {
      from: emailerSend.from || config.fallbackFrom,
      html,
      subject: emailerSend.subject || subjectFromHtmlString || config.fallbackSubject,
      text,
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
        break;
      case EmailerSendTypes.mailchimp:
        await this.sendViaMandrill(sendObject);
        break;
      case EmailerSendTypes.mandrill:
        await this.sendViaMandrill(sendObject);
        break;
      case EmailerSendTypes.nodemailer:
        await this.sendViaNodemailer(sendObject);
        break;
    }
    return sendObjectWithGlobals;
  }

  sendViaMandrill (sendObject: EmailerSendObject): Promise<any> {
    const chimp = mailchimp(process.env.MANDRILL_API_KEY || process.env.MAILCHIMP_API_KEY);
    let toEmail: string;
    let toName;
    if (typeof sendObject.to === 'string') {
      toEmail = sendObject.to;
    } else {
      toEmail = sendObject.to.email;
      toName = sendObject.to.name;
    }
    let fromEmail: string;
    let fromName;
    if (typeof sendObject.from === 'string') {
      fromEmail = sendObject.from;
    } else {
      fromEmail = sendObject.from.email;
      fromName = sendObject.from.name;
    }
    return chimp.messages.send({
      message: {
        to: [{
          email: toEmail,
          name: toName
        }],
        from_email: fromEmail,
        from_name: fromName,
        subject: sendObject.subject,
        html: sendObject.html,
        text: sendObject.text,
      }
    });
  }

  async sendViaNodemailer (sendObject: EmailerSendObject) {
    const transporter = nodemailer
      .createTransport(global.OPENAPI_NODEGEN_EMAILER_SETTINGS.nodemailer);

    const { from, to } = sendObject;

    const info = await transporter.sendMail({
      from: (typeof from === 'string') ? from : `"${from.name}" <${from.email}>`,
      to: (typeof to === 'string') ? to : `"${to.name}" <${to.email}>`,
      subject: sendObject.subject,
      text: sendObject.text,
      html: sendObject.html
    });

    console.log(`Message sent: ${info.messageId}`);
  }

  writeFile (tplRelativePath: string, object: EmailerSendObjectWithGlobals): Promise<string> {
    return new Promise((resolve, reject) => {
      const filePath = this.calculateLogFilePath(tplRelativePath);
      fs.ensureFile(filePath, (err) => {
        if (err) {
          return reject(err);
        }
        fs.writeFile(filePath, JSON.stringify(object, null, 2), 'utf8', (err) => {
          if (err) {
            return reject(err);
          }
          return resolve(filePath);
        });
      });
    });
  }
}

export default new Emailer();
