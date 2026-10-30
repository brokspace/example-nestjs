/**
 * Application settings, read once from the environment.
 *
 * Every value has a development default so `pnpm start:dev` works out of the
 * box; set real secrets through the environment in any shared deployment.
 */
export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  auth: {
    accessTokenSecret:
      process.env.JWT_ACCESS_SECRET ?? 'dev-only-access-secret-change-me',
    accessTokenTtlSeconds: parseInt(
      process.env.JWT_ACCESS_TTL_SECONDS ?? '900',
      10,
    ),
    refreshTokenTtlDays: parseInt(
      process.env.REFRESH_TOKEN_TTL_DAYS ?? '7',
      10,
    ),
  },
});
