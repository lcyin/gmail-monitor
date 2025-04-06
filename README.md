# Gmail Monitor for Netflix Confirmation

This application monitors your Gmail inbox for Netflix confirmation emails and automatically processes them.

## Setup

### 1. Google OAuth2 Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API for your project
4. Create OAuth2 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Add `http://localhost:8080/callback` as an authorized redirect URI
   - Click "Create"
5. Download the credentials JSON file and save it as `credentials.json` in the project root

### 2. Generate a Permanent Token

Run the token generation script:

```bash
node generate-token.js
```

This will:
1. Open your browser for Google authentication
2. Ask you to sign in and grant permissions
3. Display a permanent token in the console
4. Save the token to `token.json`

### 3. Configure Environment Variables

Create a `.env` file with the following variables:

```
GOOGLE_CREDENTIALS={"web":{"client_id":"your-client-id","client_secret":"your-client-secret"}}
GOOGLE_TOKEN={"access_token":"your-access-token","refresh_token":"your-refresh-token","scope":"https://www.googleapis.com/auth/gmail.readonly","token_type":"Bearer","expiry_date":1234567890000}
BACKEND_HOST=http://localhost:8080
PORT=8080
USER_EMAIL=your-netflix-email
USER_PASSWORD=your-netflix-password
```

Replace the values with your actual credentials and token.

### 4. For GitHub Actions

If you're using GitHub Actions, add the following secrets to your repository:

- `GOOGLE_CREDENTIALS`: The contents of your credentials.json file
- `GOOGLE_TOKEN`: The permanent token generated in step 2
- `BACKEND_URL`: Your backend URL
- `PORT`: The port your application runs on
- `USER_EMAIL`: Your Netflix email
- `USER_PASSWORD`: Your Netflix password

## Running the Application

```bash
node monitor.js
```

## How the Token Refresh Works

The application automatically refreshes the token when it's about to expire. The refresh token is permanent and doesn't expire unless you explicitly revoke access.

## Troubleshooting

If you encounter authentication issues:

1. Make sure your credentials and token are correctly formatted in the `.env` file
2. Check that the redirect URI in your Google Cloud Console matches the one in your code
3. If the token is invalid, run `node generate-token.js` again to generate a new one 