export default {
  shadowCRUD: true,
  endpoint: '/graphql',
  subscriptions: false,
  defaultLimit: 25,
  maxLimit: 100,
  depthLimit: 10,
  apolloServer: {
    introspection: process.env.NODE_ENV !== 'production',
    allowBatchedHttpRequests: false,
    csrfPrevention: true,
  },
  v4CompatibilityMode: process.env.STRAPI_GRAPHQL_V4_COMPATIBILITY_MODE ?? false,
};
