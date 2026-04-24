import { z } from "zod";
import { FACILITY_TYPE_IDS } from "@/lib/constants/facility-types";
import { FACILITY_CATEGORY_IDS } from "@/lib/constants/facility-category";
import { phoneSchema } from "./phone";

export const createClientSchema = z
  .object({
    name: z.string().min(1, "시설명을 입력해주세요"),
    facilityCategory: z.enum(
      FACILITY_CATEGORY_IDS as unknown as [string, ...string[]],
      { error: "시설 분류를 선택해주세요" },
    ),
    facilityType: z
      .enum(FACILITY_TYPE_IDS as unknown as [string, ...string[]])
      .nullable()
      .optional(),
    area: z.number().nullable().optional(),
    areaPyeong: z.number().nullable().optional(),
    volume: z.number().nullable().optional(),
    address: z.string().optional(),
    contactName: z.string().optional(),
    contactPhone: phoneSchema,
    contactPosition: z.string().optional(),
    contactEmail: z
      .string()
      .email("올바른 이메일 형식이 아닙니다")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    if (val.facilityCategory === "mandatory" && !val.facilityType) {
      ctx.addIssue({
        code: "custom",
        path: ["facilityType"],
        message: "의무 시설 유형을 선택해주세요",
      });
    }
  });

export const updateClientSchema = z
  .object({
    name: z.string().min(1, "시설명을 입력해주세요").optional(),
    facilityCategory: z
      .enum(FACILITY_CATEGORY_IDS as unknown as [string, ...string[]])
      .optional(),
    facilityType: z
      .enum(FACILITY_TYPE_IDS as unknown as [string, ...string[]])
      .nullable()
      .optional(),
    area: z.number().nullable().optional(),
    areaPyeong: z.number().nullable().optional(),
    volume: z.number().nullable().optional(),
    address: z.string().optional(),
    contactName: z.string().optional(),
    contactPhone: phoneSchema,
    contactPosition: z.string().optional(),
    contactEmail: z
      .string()
      .email("올바른 이메일 형식이 아닙니다")
      .optional()
      .or(z.literal("")),
    isActive: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.facilityCategory === "mandatory" && val.facilityType === null) {
      ctx.addIssue({
        code: "custom",
        path: ["facilityType"],
        message: "의무 시설 유형을 선택해주세요",
      });
    }
  });

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
