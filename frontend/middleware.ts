import { authMiddleware } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export default authMiddleware({
  publicRoutes: (req: NextRequest) =>
    !req.url.includes("/dashboard") && !req.url.includes("/code"),
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};