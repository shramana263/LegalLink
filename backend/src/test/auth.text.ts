import { auth } from "../lib/auth"; // path to your Better Auth server instance

export async function main() {
  const user = {
    email: "mrinmoymondalreal@gmail.com",
    password: "mrinmoy123",
    name: "Mrinmoy Mondal",
  };
  const response = await auth.api.signUpEmail({
    body: user,
    asResponse: true, // returns a response object instead of data
  });

  console.log(response);
}
