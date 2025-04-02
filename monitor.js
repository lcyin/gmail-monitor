const { google } = require("googleapis");
const fs = require("fs").promises;
const path = require("path");
const express = require("express");
const cheerio = require("cheerio");

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_PATH = path.join(__dirname, "token.json");
const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");

async function authorize() {
  const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH));
  const { client_secret, client_id } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    "http://localhost:8080/callback"
  );

  try {
    const token = await fs.readFile(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    console.log("No token found, initiating new authentication flow...");
    return getNewToken(oAuth2Client);
  }
}

async function getNewToken(oAuth2Client) {
  console.log("Redirect URI in use:", oAuth2Client._redirectUri);
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this URL:", authUrl);

  const app = express();
  return new Promise((resolve, reject) => {
    app.get("/callback", (req, res) => {
      const code = req.query.code;
      if (!code) return reject(new Error("No code received"));
      res.send("Authentication successful! You can close this window.");
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error("Error retrieving token:", err.message);
          return reject(err);
        }
        oAuth2Client.setCredentials(token);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token))
          .then(() => {
            console.log("Token stored to", TOKEN_PATH);
            resolve(oAuth2Client);
            server.close(); // Close the server after token is saved
          })
          .catch(reject);
      });
    });

    const server = app.listen(8080, () =>
      console.log("Listening on http://localhost:8080")
    );
  });
}

async function checkGmail(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "from:info@account.netflix.com -in:trash -in:spam",
    maxResults: 10,
  });

  const [message] = res.data.messages || [];
  console.log("🚀 ~ checkGmail ~ message:", message);
  if (!message) return null;

  const msg = await gmail.users.messages.get({
    userId: "me",
    id: message.id,
    format: "full",
  });
  const internalDate = msg.data.internalDate; // Unix timestamp in milliseconds
  const sentTime = new Date(parseInt(internalDate));
  console.log("🚀 ~ checkGmail ~ sentTime:", sentTime);

  const subject =
    msg.data.payload.headers.find((h) => h.name === "Subject")?.value || "";
  if (subject.toLowerCase().includes("verify your device")) {
    const parts = msg.data.payload.parts || [msg.data.payload];
    for (const part of parts) {
      if (part.mimeType === "text/html") {
        const html = Buffer.from(part.body.data, "base64").toString("utf-8");
        return extractLink(html);
      }
    }
  }
  //   for (const message of messages) {
  //     const msg = await gmail.users.messages.get({
  //       userId: "me",
  //       id: message.id,
  //       format: "full",
  //     });
  //     const internalDate = msg.data.internalDate; // Unix timestamp in milliseconds
  //     const sentTime = new Date(parseInt(internalDate));
  //     console.log("🚀 ~ checkGmail ~ sentTime:", sentTime);

  //     const subject =
  //       msg.data.payload.headers.find((h) => h.name === "Subject")?.value || "";
  //     if (subject.toLowerCase().includes("verify your device")) {
  //       const parts = msg.data.payload.parts || [msg.data.payload];
  //       for (const part of parts) {
  //         if (part.mimeType === "text/html") {
  //           const html = Buffer.from(part.body.data, "base64").toString("utf-8");
  //           return extractLink(html);
  //         }
  //       }
  //     }
  //   }
  return null;
}

function extractLink(html) {
  const $ = cheerio.load(html);
  const links = $("a[href]");
  for (let i = 0; i < links.length; i++) {
    const href = $(links[i]).attr("href");
    if (href.includes("netflix.com") && href.includes("verify")) return href;
  }
  return null;
}

async function main() {
  const auth = await authorize();
  console.log("Monitoring Gmail for Netflix confirmation emails...");
  const link = await checkGmail(auth);
  if (link) console.log("Found confirmation link:", link);
  else console.log("No confirmation email found.");
  //   setInterval(async () => {
  //     const link = await checkGmail(auth);
  //     if (link) console.log("Found confirmation link:", link);
  //     else console.log("No confirmation email found.");
  //   }, 1000);
}

main().catch(console.error);
