declare module 'express' {
  interface Request {
    userId?: string;
    user?: {
      userId: string;
      email: string;
    };
  }
}