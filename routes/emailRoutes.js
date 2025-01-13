import express from "express";
import Email from "../utilities/email.js";

const router = express.Router();

router.post("/send-ready-for-pickup", async (req, res) => {
  try {
    const { email, name, url, orderData } = req.body;

    if (!email || !name || !url || !orderData) {
      return res.status(400).json({
        status: "fail",
        message:
          "Missing required fields: email, name, url, and orderData are required.",
      });
    }

    const user = { email, name };
    const emailInstance = new Email(user, url, orderData);

    await emailInstance.send(
      "readyForPickup",
      "Your Device is Ready for Pickup!"
    );

    res.status(200).json({
      status: "success",
      message: "Email sent successfully!",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to send email. Please try again later.",
      error: error.message,
    });
  }
});

export default router;
