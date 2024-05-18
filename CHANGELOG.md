# Change Log
All notable changes to this project will be documented in this file.

## 4.3.0
- feat: nodemailer added, send email via SMTP as required

## 4.2.0
- docs: how to inject the sendgrid or the mandrill api keys into this package

## 4.1.4
- fix: log and file and return no longer require the fallbackFrom & fallbackSubject

## 4.1.3
- fix: txt part render bug

## 4.1.2
- fix: tsconfig update -> readable js output

## 4.1.1
- feat: Inline css option "url" added as default in case not passed in via options - required field from [inline-css](https://github.com/jonkemp/inline-css)

## 4.1.0
- feat: The fallback email and subject in the setup construct is now optional when the sendType is 'return' which allows simple setup when you only want to extract the emails that would be sent

## 4.0.2
- chore: Dependency updates

## 4.0.1
- docs: updated to reflect mailchimp setup

## 4.0.0
- breaking: Removed brevo support
- chore: Upgraded sendgrid a major bump
- feat:Added mailchimp support
