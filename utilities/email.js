import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";
import { htmlToText } from "html-to-text";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Email {
  constructor(user, url, orderData) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `${process.env.EMAIL_FROM}`;
    this.orderData = orderData;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      return {
        sendMail: (mailOptions) =>
          sgMail.send({ ...mailOptions, from: this.from }),
      };
    }

    // Nodemailer transport for development
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    try {
      // Load the template file
      const filePath = path.join(
        __dirname,
        `../views/email/${template}.handlebars`
      );
      const templateSource = fs.readFileSync(filePath, "utf-8");

      // Compile the template
      const compiledTemplate = handlebars.compile(templateSource);

      // Render the HTML
      const html = compiledTemplate({
        firstName: this.firstName,
        url: this.url,
        subject,
        orderData: this.orderData,
      });

      const mailOptions = {
        to: this.to,
        subject,
        html,
        text: htmlToText(html),
      };

      await this.newTransport().sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending email:", error.response?.body || error);
    }
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the ServiceEasy Family!");
  }

  async sendOrderPlaced() {
    const subject = "Your Repair Order Has Been Placed!";
    await this.send("orderPlaced", subject);
  }
}

export default Email;
