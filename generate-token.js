import dotenv from "dotenv";
dotenv.config();
import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
const fsx = fs.promises;
import express from "express";
import open from "open";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_PATH = path.join(__dirname, "token.json");
const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
const BACKEND_HOST = process.env.BACKEND_HOST || "http://localhost:8080";
const PORT = process.env.PORT || 8080;

async function generatePermanentToken() {
    // Load credentials from environment or file
    const credentials = JSON.parse(
        process.env.GOOGLE_CREDENTIALS || (await fsx.readFile(CREDENTIALS_PATH))
    );
    const { client_secret, client_id } = credentials.web;

    // Create OAuth2 client
    const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        BACKEND_HOST + "/callback"
    );

    // Generate auth URL with offline access and consent screen
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent" // Force consent screen to ensure we get a refresh token
    });

    console.log("Opening browser for authentication...");
    await open(authUrl);

    // Set up Express server to receive the callback
    const app = express();
    return new Promise((resolve, reject) => {
        app.get("/callback", async (req, res) => {
            const code = req.query.code;
            if (!code) return reject(new Error("No code received"));

            res.send("Authentication successful! You can close this window.");

            try {
                // Exchange code for tokens
                const { tokens } = await oAuth2Client.getToken(code);
                oAuth2Client.setCredentials(tokens);

                // Save token to file
                await fsx.writeFile(TOKEN_PATH, JSON.stringify(tokens));
                console.log("Token saved to", TOKEN_PATH);

                // Display token for easy copying
                console.log("\n=== PERMANENT TOKEN (COPY THIS) ===");
                console.log(JSON.stringify(tokens, null, 2));
                console.log("===================================\n");

                resolve(tokens);
                server.close();
            } catch (err) {
                console.error("Error retrieving token:", err.message);
                reject(err);
            }
        });

        const server = app.listen(PORT, () => {
            console.log(`Listening on ${BACKEND_HOST}`);
        });
    });
}

// Run the token generation
generatePermanentToken()
    .then(() => {
        console.log("Token generation complete!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Error generating token:", err.message);
        process.exit(1);
    }); 