const API_URL = "https://api.odcloud.kr/api/nts-businessman/v1/status";

export type BusinessStatus =
  | { ok: true; statusCode: string; statusName: string }
  | { ok: false; reason: "invalid_format" | "not_found" | "inactive" | "api_error"; message: string };

interface NtsResponseItem {
  b_no: string;
  b_stt: string;
  b_stt_cd: string;
}

interface NtsResponse {
  status_code: string;
  match_cnt: number;
  request_cnt: number;
  data?: NtsResponseItem[];
}

export function normalizeBusinessNumber(input: string): string {
  return input.replace(/[^\d]/g, "");
}

export async function checkBusinessStatus(input: string): Promise<BusinessStatus> {
  const bNo = normalizeBusinessNumber(input);

  if (bNo.length !== 10) {
    return { ok: false, reason: "invalid_format", message: "사업자등록번호는 숫자 10자리여야 합니다" };
  }

  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("PUBLIC_DATA_API_KEY is not set");
  }

  const url = `${API_URL}?serviceKey=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ b_no: [bNo] }),
  });

  if (!res.ok) {
    return { ok: false, reason: "api_error", message: `사업자번호 조회에 실패했습니다 (${res.status})` };
  }

  const json = (await res.json()) as NtsResponse;
  const item = json.data?.[0];

  if (!item || !item.b_stt_cd) {
    return { ok: false, reason: "not_found", message: "국세청에 등록되지 않은 사업자번호입니다" };
  }

  // 01: 계속사업자, 02: 휴업자, 03: 폐업자
  if (item.b_stt_cd !== "01") {
    return {
      ok: false,
      reason: "inactive",
      message: `${item.b_stt || "비활성"} 상태의 사업자번호입니다`,
    };
  }

  return { ok: true, statusCode: item.b_stt_cd, statusName: item.b_stt };
}
