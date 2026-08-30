const APP_NAME = "Railswitch";

export function pageTitle(page?: string) {
  return page == null ? APP_NAME : `${page} · ${APP_NAME}`;
}
