export const apiRoutes = {
  hello: {
    base: '/api/hello',
    // Add more specific hello-related routes as needed
  },
  users: {
    create: '/api/user',
  },
  docGen: {
    sitemapGen: '/api/doc-gen/sitemap-gen',
    docGen: '/api/doc-gen/doc-gen',
  },
  // Add other feature routes as needed
  // users: {
  //   base: '/api/users',
  //   detail: (id: string) => `/api/users/${id}`,
  // },
} as const