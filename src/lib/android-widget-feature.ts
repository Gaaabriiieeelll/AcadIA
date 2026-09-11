import "server-only";

export function isAndroidWidgetEnabled() {
  return process.env.ANDROID_WIDGET_ENABLED === "true";
}

export function requireAndroidWidgetEnabled() {
  if (!isAndroidWidgetEnabled()) {
    throw new Error("O widget Android não está habilitado nesta versão.");
  }
}
