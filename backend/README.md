# Getting started

put the .env file into the backend folder

- Install dependencies

```
cd backend
npm install
```

- run the project in development

```
npm run dev
```

- Build and run the project

```
npm run build
npm start
```

Navigate to `http://localhost:3000`

## API docs can be found at

[http://localhost:3000/api-docs/](http://localhost:3000/api-docs/)

for auth i am using better-auth so refer to better-auth docs for frontend

## Advocate Verification & Profile Update Procedure

### 1️⃣ **Account Verification Process**

Before an advocate can perform any actions on the website, their credentials must be verified. The procedure is as follows:

#### Step 1: Email Verification

- The user must first verify their **email address**.
- Checkout Better-Auth docs for this

#### Step 2: Document Submission

- Upload required **legal documents** cloudinary via /api/upload route one by one it will return url of the file use this.
- after that register as advocate /api/advocate/register and provide these details
- Provide:
  - **Registration Number**
  - **Enrollment Number**
  - **Document Url**

#### Step 3: Advocate Verification

- Call the `/api/advocate/verify` endpoint to initiate verification.
- Wait for the verification process to complete.
- If the verification is **not approved automatically**, the user can **request manual verification**.
- ⚠️ **Note**: No further actions are allowed until verification is successful.

## Client Side

- Use this inside lib/auth-client.ts in react/nextjs app

```js
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
});
```

i have modified the some functions of better-auth like this

```js
authClient.signUp.email({
        email, // user email address
        password, // user password -> min 8 characters by default
        name, // user display name
        image, // User image URL (optional)
        callbackURL: "/dashboard", // A URL to redirect to after the user verifies their email (optional)
        userType: "client" | "advocate" // Required
    } as any); // use this any to aviod ts error
```

```js
authClient.updateUser({
        name?, // user display name
        image?, // User image URL (optional)
        district?,
        city?,
        location?,
        state?
    } as any); // use this any to aviod ts error
```

- to use this auth client refer to this page [Better-Auth Documentation](https://www.better-auth.com/docs/basic-usage)
