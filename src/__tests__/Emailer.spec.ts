import path from 'path';
import { EmailerSendTypes } from '@/enums/EmailerSendTypes';
import { Emailer, emailerSetupAsync, emailerSetupSync } from '@/index';
import fs from 'fs-extra';
import emailerSetup from '@/emailerSetup';
import getSubjectFromHtml from '@/utils/getSubjectFromHtml';
import nodemailer from 'nodemailer';

jest.mock('nodemailer');

const logPath = path.join(process.cwd(), 'src/__tests__/log');
const to = 'john@john.com';
const from = 'bob@bob.com';
const fallbackFrom = 'test@test.com';
const fallbackSubject = 'fallback subject text';
const subject = 'This is a test email';
const tplObject = {
  name: 'John',
};
const tplRelativePath = 'welcome';

function GlobalObject () {
  this.globalNumber = '123.123.654';
}

GlobalObject.prototype.age = 25;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const templateGlobalObject = new GlobalObject();

const expectedObject = {
  from: from,
  html: `<html><head></head><body><p>Welcome John</p>
<p>${templateGlobalObject.globalNumber}</p>
</body></html>`,
  subject: subject,
  text: `Welcome John
`,
  to: to,
  tplGlobalObject: templateGlobalObject,
  tplObject: tplObject,
  tplRelativePath: tplRelativePath,
};

const expectedObjectFromString = Object.assign({}, expectedObject);
expectedObjectFromString.tplRelativePath = undefined;

afterAll(() => {
  fs.removeSync(logPath);
});
it('should throw error if not initialized', (done) => {
  Emailer.send({ to, from, subject, tplObject, tplRelativePath })
    .then(() => {
      done('Should have thrown an error');
    })
    .catch(() => {
      done();
    });
});
it('should initialise correctly', async () => {

  emailerSetup({
    sendType: EmailerSendTypes.return,
    fallbackFrom,
    fallbackSubject
  });
  emailerSetupSync({
    sendType: EmailerSendTypes.return,
    templatePath: path.join(process.cwd(), 'src/__tests__/templates'),
    logPath: logPath,
    fallbackFrom,
    fallbackSubject,
    templateGlobalObject,
  });
  await emailerSetupAsync({
    sendType: EmailerSendTypes.return,
    templatePath: path.join(process.cwd(), 'src/__tests__/templates'),
    logPath: logPath,
    fallbackFrom,
    fallbackSubject,
    templateGlobalObject,
  });
  expect(1).toBe(1);
});

it('extract the subject text from a html string', async () => {
  const tpl = (await fs.readFile(path.join(global.OPENAPI_NODEGEN_EMAILER_SETTINGS.tplPath, 'subjectTest.html.njk'))).toString();
  const HTMLString = Emailer.renderTemplate(tpl, {});
  expect(getSubjectFromHtml(HTMLString)).toBe('subject text');
});

it('extract the subject text from a html but it should be undefined', async () => {
  const tpl = (await fs.readFile(path.join(global.OPENAPI_NODEGEN_EMAILER_SETTINGS.tplPath, 'welcome.html.njk'))).toString();
  const HTMLString = Emailer.renderTemplate(tpl, {});
  expect(getSubjectFromHtml(HTMLString)).toBe(undefined);
});

it('should return the object', async () => {
  const sentObject = await Emailer.send({ to, from, subject, tplObject, tplRelativePath });
  expect(sentObject).toEqual(expectedObject);
});

it('should return the object when the txt and html tpl string is passed', async () => {
  const htmlTpl = (await fs.readFile(path.join(global.OPENAPI_NODEGEN_EMAILER_SETTINGS.tplPath, 'welcome.html.njk'))).toString();
  const txtTpl = (await fs.readFile(path.join(global.OPENAPI_NODEGEN_EMAILER_SETTINGS.tplPath, 'welcome.txt.njk'))).toString();
  const sentObject = await Emailer.send({
    to, from, subject, tplObject,
    tplHtmlString: htmlTpl,
    tplTxtString: txtTpl
  });
  expect(sentObject).toEqual(expectedObjectFromString);
});

it('should return the object but with fallbackFrom email', async () => {
  const sentObject = await Emailer.send({ to, subject, tplObject, tplRelativePath });
  expect(sentObject).toEqual(
    Object.assign(JSON.parse(JSON.stringify(expectedObject)), { from: fallbackFrom }),
  );
});

it('should throw error for wrong tpl name', (done) => {
  Emailer.send({ to, from, subject, tplObject, tplRelativePath: 'doesnotexist' })
    .then(() => {
      done('Should have thrown an error');
    })
    .catch(() => {
      done();
    });
});

it('should calculate the correct file path', () => {
  const fullPath = Emailer['calculateLogFilePath']('welcome');
  const regex = /\/\d{13,18}welcome\.json/;
  const pattern = RegExp(regex);
  console.log(fullPath);
  expect(pattern.test(fullPath.replace(logPath, ''))).toBe(true);
});

it('should write to file', async () => {
  emailerSetupSync({
    sendType: EmailerSendTypes.file,
    templatePath: path.join(process.cwd(), 'src/__tests__/templates'),
    logPath,
    fallbackFrom,
    fallbackSubject,
    templateGlobalObject,
  });
  await Emailer.send({ to, from, subject, tplObject, tplRelativePath });
  expect(await Emailer.getLatestLogFileData()).toEqual(expectedObject);
});

it('should throw an error on bad log directory', (done) => {
  emailerSetupSync({
    sendType: EmailerSendTypes.file,
    templatePath: '/',
    logPath,
    fallbackFrom,
    fallbackSubject,
    templateGlobalObject,
  });

  Emailer.send({ to, from, subject, tplObject, tplRelativePath })
    .then(() => {
      done('Should have thrown an error for unwritable directory, either this is running as root or there is an error in the code');
    })
    .catch(() => {
      done();
    });
});

it('Should write file to disk', async () => {
  emailerSetupSync({
    sendType: EmailerSendTypes.file,
    templatePath: path.join(process.cwd(), 'src/__tests__/templates'),
    logPath,
    fallbackFrom,
    fallbackSubject,
    templateGlobalObject,
  });
  const logFile = await Emailer.send({ to, from, subject, tplObject, tplRelativePath });
  expect(fs.existsSync(logFile.loggedFilePath)).toBe(true);
});

it('should throw error and not be able a non json file', (done) => {
  fs.writeFileSync(
    path.join(global.OPENAPI_NODEGEN_EMAILER_SETTINGS.logPath, '999999999999.json'),
    'this is not json',
  );
  Emailer.getLatestLogFileData().then(() => {
    done('should have thrown an error');
  }).catch(() => {
    done();
  });
});

it('We should currently have 3 files written to disc', async () => {
  expect((await Emailer.getLogFileNames()).length).toBe(3);
});

it('should be able to empty log directory', async () => {
  await Emailer.removeAllEmailJsonLogFiles();
  expect((await Emailer.getLogFileNames()).length).toBe(0);
});

it('should throw error and not be able to scan non-existent directory', (done) => {
  global.OPENAPI_NODEGEN_EMAILER_SETTINGS.logPath = '/non-existent-path';

  Emailer.getLogFileNames()
    .then(() => {
      done('should error');
    }).catch(() => {
    done();
  });
});

it('should throw error and not be empty non-existent directory', (done) => {
  global.OPENAPI_NODEGEN_EMAILER_SETTINGS.logPath = '/non-existent-path';

  Emailer.removeAllEmailJsonLogFiles()
    .then(() => {
      done('Should have thrown an error');
    })
    .catch(() => {
      done();
    });
});

it('should console log', async () => {
  emailerSetupSync({
    sendType: EmailerSendTypes.log,
    templatePath: path.join(process.cwd(), 'src/__tests__/templates'),
    logPath: logPath,
    fallbackFrom,
    fallbackSubject,
    templateGlobalObject,
  });
  await Emailer.send({ to, from, subject, tplObject, tplRelativePath });
  // todo write in jest fn to check use of console log.
  expect((await Emailer.getLogFileNames()).length).toBe(0);
});

it('should console error as no api key set', (done) => {
  emailerSetupSync({
    sendType: EmailerSendTypes.sendgrid,
    templatePath: path.join(process.cwd(), 'src/__tests__/templates'),
    logPath: logPath,
    fallbackFrom,
    fallbackSubject,
    templateGlobalObject,
  });

  Emailer.send({ to, from, subject, tplRelativePath }).then(() => {
    done('should have thrown error as sendgrid not setup');
  }).catch(() => {
    done();
  });
});

describe('sendViaNodemailer', () => {
  const mockSendMail = jest.fn();
  const mockCreateTransport = nodemailer.createTransport as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateTransport.mockReturnValue({
      sendMail: mockSendMail,
    });
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id-123' });
  });

  it('should send email via nodemailer with string addresses', async () => {
    emailerSetupSync({
      sendType: EmailerSendTypes.nodemailer,
      templatePath: path.join(process.cwd(), 'src/__tests__/templates'),
      logPath: logPath,
      fallbackFrom,
      fallbackSubject,
      templateGlobalObject,
      nodemailer: {
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'testuser',
          pass: 'testpass',
        },
      },
    });

    await Emailer.send({ to, from, subject, tplObject, tplRelativePath });

    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      auth: {
        user: 'testuser',
        pass: 'testpass',
      },
    });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: from,
        to: to,
        subject: subject,
      }),
    );
  });

  it('should send email via nodemailer with object addresses', async () => {
    const toObj = { name: 'John Doe', email: 'john@john.com' };
    const fromObj = { name: 'Bob Smith', email: 'bob@bob.com' };

    emailerSetupSync({
      sendType: EmailerSendTypes.nodemailer,
      templatePath: path.join(process.cwd(), 'src/__tests__/templates'),
      logPath: logPath,
      fallbackFrom,
      fallbackSubject,
      templateGlobalObject,
      nodemailer: {
        host: 'smtp.test.com',
        port: 465,
        secure: true,
      },
    });

    await Emailer.send({ to: toObj, from: fromObj, subject, tplObject, tplRelativePath });

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"Bob Smith" <bob@bob.com>',
        to: '"John Doe" <john@john.com>',
        subject: subject,
      }),
    );
  });

  it('should include html and text in nodemailer send', async () => {
    emailerSetupSync({
      sendType: EmailerSendTypes.nodemailer,
      templatePath: path.join(process.cwd(), 'src/__tests__/templates'),
      logPath: logPath,
      fallbackFrom,
      fallbackSubject,
      templateGlobalObject,
      nodemailer: {
        host: 'smtp.test.com',
        port: 587,
        secure: false,
      },
    });

    await Emailer.send({ to, from, subject, tplObject, tplRelativePath });

    const sendMailCall = mockSendMail.mock.calls[0][0];
    expect(sendMailCall.html).toContain('Welcome John');
    expect(sendMailCall.text).toContain('Welcome John');
  });

  it('should throw error when nodemailer sendMail fails', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP connection failed'));

    emailerSetupSync({
      sendType: EmailerSendTypes.nodemailer,
      templatePath: path.join(process.cwd(), 'src/__tests__/templates'),
      logPath: logPath,
      fallbackFrom,
      fallbackSubject,
      templateGlobalObject,
      nodemailer: {
        host: 'smtp.invalid.com',
        port: 587,
        secure: false,
      },
    });

    await expect(Emailer.send({ to, from, subject, tplObject, tplRelativePath }))
      .rejects.toThrow('SMTP connection failed');
  });
});
