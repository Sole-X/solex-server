import { Service, Inject } from 'typedi';
import { MailTemplate } from '../entities/MailTemplate';
import { MailLog } from '../entities/MailLog';
import { Newsletter } from '../entities/Newsletter';

const nodemailer = require('nodemailer');

@Service('MailService')
export class MailService {
  constructor(@Inject('logger') private logger) {}

  async sendReport(tokenAddr, tokenId, reason) {
    const subject = 'Report - ' + tokenAddr + ' #' + tokenId;

    return this.sendMail(subject, reason, []);
  }
  async sendNewsletter() {
    const subsribers = await Newsletter.find({ status: 1 });
    return this.sendTemplate(
      1,
      ['TEST'],
      subsribers.map((x) => x.email),
    );
  }

  async sendTemplate(templateId, params, to) {
    var template = await MailTemplate.findOne({ id: templateId });
    var body = '';
    for (var paramIdx in params) {
      body = template.template.split('{param' + paramIdx + '}').join(params[paramIdx]);
    }

    return this.sendMail(template.subject, body, to);
  }

  async sendMail(subject, body, to = []) {
    const mailOption = {
      host: 'localhost',
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    };
    const transporter = nodemailer.createTransport(mailOption);

    let info = await transporter.sendMail({
      from: '"solex" <solex@solex.ozys.net>',
      to: to,
      subject: subject,
      text: body,
      html: '<b>' + body + '</b>',
    });

    return info;
  }
}
