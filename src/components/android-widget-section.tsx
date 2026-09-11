import { AndroidWidgetControl } from "@/components/android-widget-control";
import { getCurrentAndroidWidgetCredentials } from "@/data/android-widget";
import { isAndroidWidgetEnabled } from "@/lib/android-widget-feature";

export async function AndroidWidgetSection() {
  if (!isAndroidWidgetEnabled()) return null;

  const credentials = await getCurrentAndroidWidgetCredentials();
  return <AndroidWidgetControl credentials={credentials} />;
}
