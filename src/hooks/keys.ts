export const queryKeys = {
  hello: {
    all: ['hello'] as const,
    detail: () => [...queryKeys.hello.all, 'detail'] as const,
    // Add more specific hello-related query keys as needed
  },
  // Add other feature query keys as needed
  // users: {
  //   all: ['users'] as const,
  //   detail: (id: string) => [...queryKeys.users.all, id] as const,
  // },
  users: {
    all: ['users'] as const,
    create: () => [...queryKeys.users.all, 'create'] as const,
  },
} as const