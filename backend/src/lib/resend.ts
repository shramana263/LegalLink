import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "geraldine.wiegand@ethereal.email",
    pass: "8a9TNbUQZrnrH5G9AA",
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // console.log("Sending email to:", to, html);
  let message = {
    from: "Sender Name <sender@example.com>",
    to: to,
    subject: subject,
    // text: 'Hello to myself!',
    html: html,
  };

  transporter.sendMail(message, (err, info) => {
    if (err) {
      console.log("Error occurred. " + err.message);
      return process.exit(1);
    }
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  });
}
