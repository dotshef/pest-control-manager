import type { PushPayload } from "./types";

const ICON = "/icons/icon-192x192.png";
const BADGE = "/icons/icon-192x192.png";

export function visitAssignedPayload(args: {
  visitId: string;
  clientName: string;
  scheduledDate: string;
}): PushPayload {
  return {
    title: "새 방문 일정",
    body: `${args.scheduledDate} 에 ${args.clientName} 로 방문 배정되셨습니다`,
    icon: ICON,
    badge: BADGE,
    tag: `visit-assigned-${args.visitId}`,
    data: {
      url: `/visits/${args.visitId}`,
      type: "visit_assigned",
      entityId: args.visitId,
    },
  };
}

export function visitCompletedPayload(args: {
  visitId: string;
  completerName: string;
  clientName: string;
}): PushPayload {
  return {
    title: "소독 완료",
    body: `${args.completerName}님이 ${args.clientName} 소독을 완료했습니다`,
    icon: ICON,
    badge: BADGE,
    tag: `visit-completed-${args.visitId}`,
    data: {
      url: `/visits/${args.visitId}`,
      type: "visit_completed",
      entityId: args.visitId,
    },
  };
}

export function visitTomorrowPayload(args: {
  count: number;
  firstClientName: string;
}): PushPayload {
  const body =
    args.count > 1
      ? `${args.firstClientName} 외 ${args.count - 1}곳`
      : args.firstClientName;
  return {
    title: `내일 방문 ${args.count}건 예정`,
    body: `내일 ${body} 에 방문 일정이 있습니다`,
    icon: ICON,
    badge: BADGE,
    tag: "visit-tomorrow",
    data: {
      url: "/calendar",
      type: "visit_tomorrow",
    },
  };
}

