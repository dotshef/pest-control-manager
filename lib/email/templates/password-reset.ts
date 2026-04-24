interface RenderPasswordResetEmailParams {
  code: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderPasswordResetEmail({
  code,
}: RenderPasswordResetEmailParams): RenderedEmail {
  const subject = "[소독노트] 비밀번호 재설정 인증번호";
  const heading = "비밀번호 재설정 요청";
  const description = "비밀번호 재설정을 위해 아래 인증번호를 입력해 주세요.";

  const html = `
<!doctype html>
<html lang="ko">
  <body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f6f7f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 24px 32px;">
                <h1 style="margin:0 0 8px 0;font-size:22px;color:#111827;">${heading}</h1>
                <p style="margin:0;font-size:15px;color:#4b5563;line-height:1.6;">${description}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px 32px;">
                <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;">
                  <div style="font-size:32px;font-weight:700;color:#111827;letter-spacing:8px;">${code}</div>
                </div>
                <p style="margin:16px 0 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
                  인증번호는 10분 동안 유효합니다.<br/>
                  본인이 요청하지 않았다면 이 메일을 무시해 주세요.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 32px 32px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">소독노트 · 소독/방역업체를 위한 올인원 관리 플랫폼</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}
