import { z } from "zod";
import { phoneSchema } from "./phone";

const roleSchema = z.enum(["admin", "member"], {
  error: "역할을 선택해주세요",
});

export const createMemberSchema = z.object({
  email: z.email("올바른 이메일을 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  name: z.string().min(1, "이름을 입력해주세요"),
  phone: phoneSchema,
  role: roleSchema,
});

export const updateMemberSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요").optional(),
  phone: phoneSchema,
  email: z.email("올바른 이메일을 입력해주세요").optional(),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다").optional(),
  role: roleSchema.optional(),
  is_active: z.boolean().optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
