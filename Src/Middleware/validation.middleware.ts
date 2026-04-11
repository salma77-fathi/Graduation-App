import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { BadRequestException } from "../Utils/index.js";

type RequestKeyType = keyof Request; // here it has taken the same key that in req so it will restrict the syntax of key in req
type SchemaType = Partial<Record<RequestKeyType, ZodType>>; // did it to ensure that we have type of key and the type of value
// here Partial bc zod add more things in my type I DON'T NEEDED it (140)
type validationErrorType = {
  key: RequestKeyType;
  issues: {
    path: PropertyKey[];
    message: string;
  }[];
};
export const validationMiddleware = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const reqKey: RequestKeyType[] = ["body", "params", "query", "headers"];
    const validationErrors: validationErrorType[] = [];
    for (const key of reqKey) {
      if (schema[key]) {
        const result = schema[key].safeParse(req[key]);
        console.log(`Validation result is `, { key, result });

        if (!result?.success) {
          const issues = result.error?.issues?.map((issue) => ({
            path: issue.path,
            message: issue.message,
          }));
          validationErrors.push({ key, issues });
        }
      }
    }

    if (validationErrors.length)
      throw new BadRequestException("Validation failed", { validationErrors });
    next();
  };
};
