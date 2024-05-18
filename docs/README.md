<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [nunjucks-emailer](#nunjucks-emailer)
  - [How it works](#how-it-works)
  - [Setup](#setup)
  - [Process env keys](#process-env-keys)
  - [Send to MailHog (dev server)](#send-to-mailhog-dev-server)
  - [Send an email via on file tpl](#send-an-email-via-on-file-tpl)
  - [Send an email pre-compiled string](#send-an-email-pre-compiled-string)
  - [Email Subject](#email-subject)
  - [Global variables (common dynamic content)](#global-variables-common-dynamic-content)
  - [Unit test example](#unit-test-example)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# nunjucks-emailer

This package was created explicitly for use with a project that used **Sendgrid** to send emails. It has since been expanded to include a new provider, **MailChimp**. It is not designed as a replacement for nodemailer, it is designed to simplify email templates and sending emials via API. 

Send the email, console log the email, output the email to disk or simply return the email JS object... send or test. 

## How it works
The email template files are kept in a separate folder to the rest of the source code of your app. Your app uses this package, this package loads templates based on the provided templatePath at setup.

You can write html & txt versions of each email you want to send, however if you only write HTML this package will automatically create a TXT version for you based on the html one when you instruct it to.

## Setup
At a suitable point in your app, before you send emails, call the setup async or sync function (both do the same thing, sync is easier for unit testing):

The complete interface for the setup options can be seen here: [EmailerContructor.ts](https://github.com/j-d-carmichael/nunjucks-emailer/blob/master/src/interfaces/EmailerContructor.ts)

Here is a fuller example:
```typescript
// Some config object for your project
import config from '@/config';

// Setup the emailer
await emailerSetupAsync({
  templatePath: path.join(
    process.cwd(), 'email/templates'
  ),
  logPath: path.join(
    process.cwd(), 'email/logs'
  ),
  sendType: config.email.mode,
  fallbackFrom: {
    email: config.email.fallbackFrom,
    name: config.appDetails.name
  },
  fallbackSubject: config.appDetails.name,
  makeCssInline: true,
  makeCssInlineOptions: {
    preserveMediaQueries: true,
  },
  templateGlobalObject: {
    companyName: config.appDetails.name,
    frontend: config.appDetails.frontend,
    noReply: config.email.fallbackFrom
  }
});
```

The `sendType` is important. For development of an app you will probably want to log the output. To test, you might want RETURN or FILE and examine the output. For actual sending, pick your provider SENDGRID or MAILCHIMP.

The send types enum can be found here: [EmailerSendTypes.ts](https://github.com/j-d-carmichael/nunjucks-emailer/blob/master/src/enums/EmailerSendTypes.ts)

Lastly, call the [Emailer send method](https://github.com/johndcarmichael/nunjucks-emailer/blob/master/src/Emailer.ts#L9), see below.

## Process env keys

Sendgrid and mandrill only:

Sendgrid: ensure `process.env.SENDGRID_API_KEY` contains your sendgrid api key.
Mandrill: ensure `process.env.MANDRILL_API_KEY` contains your mandrill api key.

## Send to MailHog (dev server)
https://github.com/mailhog/MailHog

Setup in a docker compose file:
```
  # STANDARD: Mailhog for dev email purposes
  mailhog:
    container_name: pf-mailhog
    image: mailhog/mailhog
    deploy:
      resources:
        limits:
          memory: 500M
    ports:
      - 1025:1025 # smtp server
      - 8025:8025 # web ui
    networks:
      - shared_network
```

Connect and send to it via nunjucks emailer:
```
  await emailerSetupAsync({
    nodemailer: {
      port: 1025,
      host: 'mailhog',
      secure: false
      // note the auth object is left off
    }
    ... add the other config options ...
  });
  
  // Send the object as normal, this package will auto-convert html emails to txt emails
  NunjucksEmailer.send({
    from: 'john@john.com',
    subject: 'Test emailer',
    to: 'bob@john.com',
    tplHtmlString: '<p>Hello World</p>'
  });
```

## Send an email via on file tpl
```typescript
class RegisterDomain {
  public async registerEmailPost (body: RegisterEmailPost, req: any): Promise<Login> {
    // register user ...

    // send out email
    await Emailer.send({
      to: 'john@john.com',
      from: 'bob@bob.com', 
      subject: 'Welcome to the app John!', 
      tplObject: {name: 'John'}, 
      tplRelativePath: 'auth/welcome',
      autoTxtFromHtml: true
    })

    // return 
  }
}
```

The above example will:
- Get the file called "<your email path>/auth/welcome.html.njk"
- Convert the html email to it's txt counter part
  - If this was not true, the package would try to load `"<your email path>/auth/welcome.txt.njk"` and fail if not found.
- Send the email to john@john.com from bob@bob.com
- Inject the nunjucks vars into the email tpl


## Send an email pre-compiled string

You can also pass in the full tpl as strings opposed to the file path:
```typescript
class RegisterDomain {
  public async registerEmailPost (body: RegisterEmailPost, req: any): Promise<Login> {
    // register user ...

    // send out email
    await Emailer.send({
      to: 'john@john.com',
      from: 'bob@bob.com', 
      subject: 'Welcome to the app John!', 
      tplObject: {name: 'John'},
      tplHtmlString: htmlTplString, // grab from a database or file
      tplTxtString: txtTplString, // grab from a database or file
    })

    // return 
  }
}
```

## Email Subject
As mentioned above you have the subject fallback should one not be provided to `Emailer.send`, but the subject can also be written into the email HTML template:
```
<p>Welcome {{ name }}</p>
<p>{{ globalNumber }}</p>

<nunjuck-email-subject text="{{name}} welcome to this app"></nunjuck-email-subject>
```

Then used like this:
```
await Emailer.send({
  to: 'john@john.com',
  from: 'bob@bob.com', 
  tplObject: {name: 'John'}, 
  tplRelativePath: 'welcome'
})
```

This allows for encapsulating all copy content in the template - instead of some in the typescript code and some in the template code.

With no subject in the `Emailer.send` params, and no subject tag in the HTML template.. then the tool will use the fallback. 


## Global variables (common dynamic content)
To inject say, a company telephone number into an email, you would likely want to grab this from a managed source instead of changing hardcoded emails all the time, or injecting the common content to every email tplObject.. gets fairly repetitive quite quickly.

Add to the setup:
```typescript
import { Emailer, emailerSetupSync, EmailerSendTypes } from 'nunjucks-emailer';

emailerSetupSync({
  sendType: EmailerSendTypes.file,
  fallbackFrom: 'no-reply@myapp.com',
  templateGlobalObject: {
    contactUsEmail: 'hello@myapp.com',
    telephoneNumber: '0123654789',
  }
});
```

Now you do not have to worry about injecting this content into email tplObject sent to Emailer.send or hardcoding it into email templates. Just call it:
```twig
Hi,

You can reach us at {{ contactUsEmail }} or call us on {{ telephoneNumber }}
```

The global object is also logged and returned from the dens function.


## Unit test your emails, example

Check the source code of this package: [src/__tests__/Emailer.spec.ts](https://github.com/johndcarmichael/nunjucks-emailer/blob/master/src/__tests__/Emailer.ts)

As it is possible to return the prepared object from this tool it makes it possible to unit test a domain method very easily, just run the setup and instruct to write to file, log or return the object, eg:

```typescript
emailerSetupSync({ sendType: EmailerSendTypes.log });
```

Then continue to use the package as normal. As the typescript server has the domain layer abstracted from the http layer, you can now write the business logic in a domain method as above and then unit test without mocking or sending out actual emails.

To assist, there are 2 public helper functions in the Emailer class to fetch log files:
```typescript
// Will return a numeric array of file names
const fileNames = await Emailer.getLogFileNames();
// Will return the last email object written to disc
const fileJson = await Emailer.getLatestLogFileData();
// Will clear directory of json email logs (most helpful when writing tests the app which uses this class)
await Emailer.removeAllEmailJsonLogFiles();
```
