export type NotificationTarget =
  | { type: "broadcast" }
  | { type: "token"; token: string }
  | { type: "user"; uid: string };

export type NotificationPayload = {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
  clickAction?: string; // URL o ruta
};

export type CreateNotificationInput = {
  target: NotificationTarget;
  payload: NotificationPayload;
  // Opcional: para programar/scopear
  startAt?: string | Date;
  endAt?: string | Date;
};