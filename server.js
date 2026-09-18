const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();

app.use(cors());
app.use(express.json());

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;


// TEST
app.get("/", (req, res) => {
  res.json({ message: "BFODA verification server is running" });
});


// SEND EMAIL CODE
app.post("/send-verification", async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Valid email address required."
      });
    }

    const verification = await client.verify.v2
      .services(SERVICE_SID)
      .verifications
      .create({
        to: email,
        channel: "email"
      });

    res.json({
      success: true,
      status: verification.status
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Could not send verification code."
    });
  }
});


// CHECK EMAIL CODE
app.post("/verify-email", async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const code = String(req.body.code || "")
      .trim();

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required."
      });
    }

    const check = await client.verify.v2
      .services(SERVICE_SID)
      .verificationChecks
      .create({
        to: email,
        code: code
      });

    if (check.status === "approved") {
      return res.json({
        success: true,
        verified: true,
        message: "Email verified successfully."
      });
    }

    res.json({
      success: false,
      verified: false,
      message: "Incorrect or expired code."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      verified: false,
      message: "Verification failed."
    });
  }
});


const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`BFODA server running on port ${PORT}`);
});
