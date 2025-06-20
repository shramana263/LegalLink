import { Request, Response, NextFunction } from "express";
import prisma from "../../prisma/PrismaClient";

export const isAdvocate = (req: Request, res: Response, next: NextFunction) => {
  const advocate = res.locals.advocate;

  if (!advocate.is_verified) {
    return res.status(403).json({
      error:
        "You are not verified as an advocate. Please complete verification.",
    });
  }

  next();
};

export const getAdvocate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = res.locals.user;

  const result = await prisma.advocates.findUnique({
    where: { userId: user.id },
  });

  if (!result) {
    return res.status(403).json({
      error: "You are not registered as an advocate. Please register first.",
    });
  }

  res.locals.advocate = result;
  next();
};
