import { z } from "zod";
import { phoneSchema } from "./phone";

export const signupSchema = z.object({
  // 업체 정보
  companyName: z.string().min(1, "업체명을 입력해주세요"),
  businessNumber: z.string().optional(),
  ownerName: z.string().optional(),
  phone: phoneSchema,
  address: z.string().optional(),
  // 관리자 계정
  email: z.email("올바른 이메일을 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  name: z.string().min(1, "이름을 입력해주세요"),
});

export const loginSchema = z.object({
  email: z.email("올바른 이메일을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
