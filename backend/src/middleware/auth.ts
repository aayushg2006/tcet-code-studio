import jwt from "jsonwebtoken";
console.log("🔥 NEW AUTH FILE LOADED");
// export const authMiddleware = (req: any, res: any, next: any) => {
//   try {
    // const token = req.cookies.coe_shared_token;
// 
    // if (!token) {
    //   return res.status(401).json({ message: "Not logged in" });
    // }
// 
    // const decoded: any = jwt.verify(token, "SECRET_FROM_COE");
// 
    // if (decoded.status !== "ACTIVE") {
    //   return res.status(403).json({ message: "Inactive user" });
    // }
// 
    // req.user = {
    //   email: decoded.email,
    //   role: decoded.role,
    // };
// 
    // next();
//   } catch (error) {
    // return res.status(403).json({ message: "Invalid token" });
//   }
//};
export const authMiddleware = (req: any, res: any, next: any) => {
    console.log("🔥 MOCK AUTH RUNNING");
  const decoded = {
    email: "student1@tcetmumbai.in",
    role: "STUDENT",
    status: "ACTIVE",
  };

  if (decoded.status !== "ACTIVE") {
    return res.status(403).json({ message: "Inactive user" });
  }

  req.user = {
    email: decoded.email,
    role: decoded.role,
  };

  next();
};