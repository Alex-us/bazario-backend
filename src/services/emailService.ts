import nodemailer, { Transporter} from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

const activationBaseUrl = `${process.env.API_URL}/activate:`;

class EmailService {
  private transporter: Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>;
  constructor() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PWD;
    console.log(user, pass);
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass,
      }
    })
  }

  async sendActivationMail(to: string, path: string){
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Actions required to finish registration',
      text: '',
      html: `
          <div>
          <h1>To activate you account please follow yrl below</h1>
          <a href="${activationBaseUrl}${path}" > ${activationBaseUrl}${path} </a>
          </div>
      `
    })
  };
}

export default new EmailService();