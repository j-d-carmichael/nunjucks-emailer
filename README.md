<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [nunjucks-emailer](#nunjucks-emailer)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# nunjucks-emailer

An email utility tool - Emails rendered in nunjucks before sending (html and txt versions) & css brought inline. Log the emails during development and send in stage/prod.

See the docs: [https://j-d-carmichael.github.io/nunjucks-emailer](https://j-d-carmichael.github.io/nunjucks-emailer)

Send via and why:
- Sendgrid
- Mandril
- Mailchimp
- SMTP (via nodemailer -> hookup to mailhog for dev)
- Log the output (when you don't want to use mailhog during dev)
- Write to disk, allow you to test the emails
