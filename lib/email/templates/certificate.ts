import type { EmailAttachment } from "../resend";

interface RenderCertificateEmailParams {
  recipientName: string | null;
  clientName: string;
  tenantName: string;
  completedDate: string;
  pdfBuffer: Buffer;
  pdfFileName: string;
}

interface RenderedCertificateEmail {
  subject: string;
  html: string;
  attachments: EmailAttachment[];
}

export function renderCertificateEmail({
  recipientName,
  clientName,
  tenantName,
  completedDate,
  pdfBuffer,
  pdfFileName,
}: RenderCertificateEmailParams): RenderedCertificateEmail {
  const subject = `[${tenantName}] ${clientName} 소독증명서 (${completedDate})`;
  const greeting = recipientName ? `${recipientName}님, 안녕하세요.` : "담당자님, 안녕하세요.";

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
                <h1 style="margin:0 0 8px 0;font-size:22px;color:#111827;">소독증명서 발송</h1>
                <p style="margin:0;font-size:15px;color:#4b5563;line-height:1.6;">
                  ${greeting}<br/>
                  ${tenantName}에서 ${clientName}의 소독을 완료하고 증명서를 발송드립니다.<br/>
                  첨부된 PDF 파일을 확인해 주세요.
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

  return {
    subject,
    html,
    attachments: [{ filename: pdfFileName, content: pdfBuffer }],
  };
}
