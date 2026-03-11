export const endpoints = {
  authBaseUrl: import.meta.env.VITE_AUTH_URL ?? "http://localhost:8100",
  userBaseUrl: import.meta.env.VITE_USER_URL ?? "http://localhost:8095",
  moneyActionsBaseUrl: import.meta.env.VITE_MONEY_ACTIONS_URL ?? "http://localhost:8300",
  statisticsBaseUrl: import.meta.env.VITE_STATISTICS_URL ?? "http://localhost:8301",
  profileServiceBaseUrl: import.meta.env.VITE_PROFILE_SERVICE_URL ?? "http://localhost:8302",
  bffWebBaseUrl: import.meta.env.VITE_BFF_WEB_URL ?? "http://localhost:8303",
};
