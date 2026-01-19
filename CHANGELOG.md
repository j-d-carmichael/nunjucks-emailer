<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Change Log](#change-log)
  - [5.0.0](#500)
  - [4.4.0](#440)
  - [4.3.0](#430)
  - [4.2.0](#420)
  - [4.1.4](#414)
  - [4.1.3](#413)
  - [4.1.2](#412)
  - [4.1.1](#411)
  - [4.1.0](#410)
  - [4.0.2](#402)
  - [4.0.1](#401)
  - [4.0.0](#400)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Change Log
All notable changes to this project will be documented in this file.

## 5.0.0
- feat: Nodemailer update from v6 to v7
- chore: more unit test coverage added

## 4.4.0
- feat: log output containing connection type, useful for when switching between smpt servers and log mode in docker setups.

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
