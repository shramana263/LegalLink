import { auth } from "../lib/auth";

export const getUser = async (req: any, res: any, next: any) => {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.locals.user = session?.user || null;
  next();
};
