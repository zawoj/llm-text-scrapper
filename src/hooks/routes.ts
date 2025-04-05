export const apiRoutes = {
  hello: {
    base: '/api/hello',
    // Add more specific hello-related routes as needed
  },
  users: {
    create: '/api/user',
  },
  // Add other feature routes as needed
  // users: {
  //   base: '/api/users',
  //   detail: (id: string) => `/api/users/${id}`,
  // },
} as const