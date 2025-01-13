import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

class SmsSender {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.from = process.env.TWILIO_PHONE_NUMBER;
  }

  async sendSms(user, body) {
    try {
      const message = await this.client.messages.create({
        body: body,
        from: this.from,
        to: user.phone,
      });
      return message;
    } catch (error) {
      console.error("Error sending SMS:", error);
      throw error;
    }
  }
}

export default SmsSender;

async function testSendSms() {
  const smsSender = new SmsSender();

  // Sample user object with phone number
  const user = {
    phone: "+15512414753", // Replace with a valid phone number
  };

  // SMS body content
  const body = "Hello, this is a test SMS from your Twilio-powered app!";

  try {
    // Send SMS
    const message = await smsSender.sendSms(user, body);
    console.log(`Test SMS sent successfully. SID: ${message.sid}`);
  } catch (error) {
    console.error("Test SMS failed:", error);
  }
}

testSendSms();
