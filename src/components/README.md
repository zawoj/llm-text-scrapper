```markdown
.
├── components/
|   ├── features/  
|   |   └── feature-name-folder/
|   |       ├── ui/
|   |       └── lib/
|   |
│   ├── elements/             # Base UI components (atoms) including shadcn
│   │   ├── action-menu.tsx
│   │   ├── drawer.tsx
│   │   ├── sheet.tsx
│   │   ├── button/
│   │   │   ├── button.tsx
│   │   │   └── button.types.ts
│   │   ├── input/
│   │   │   ├── input.tsx
│   │   │   └── input.types.ts
│   │   ├── select/
│   │   │   ├── select.tsx
│   │   │   └── select.types.ts
│   │   ├── table/
│   │   │   ├── table.tsx
│   │   │   └── table.types.ts
│   │   └── typography/
│   │       ├── typography.tsx
│   │       └── typography.types.ts
│   │
│   └── templates/                   # Layout templates and global UI components
│       ├── app-sidebar/            
│       │   ├── app-sidebar.tsx
│       │   └── app-sidebar.types.ts
│       ├── shell/                  
│       │   ├── index.tsx
│       │   └── shell.types.ts
│       ├── app-top-bar-menu/      
│       │   ├── app-top-bar-menu.tsx
│       │   └── app-top-bar-menu.types.ts
│       ├── fallback-loader/        
│       │   ├── fallback-loader.tsx
│       │   └── fallback-loader.types.ts
│       ├── error-boundary/         
│       │   ├── error-boundary.tsx
│       │   └── error-boundary.types.ts
│       └── providers/               
│           ├── protected-route.tsx
│           └── providers.tsx
│
└── app/
    └── (protected)/dashboard/
						        └── products/
						            ├── components/         
						            │   ├── ui/         
						            │   │   ├── form
						            |   |   |   ├── product-from.tsx
						            |   |   |   └── basic-information.tsx
						            │   │   └── table
						            |   |   |   ├── products-filters.tsx
						            |   |   |   └── products-table.tsx
						            │   └── lib/    
						            |   |   └── use-product-form.tsx
						            ├── [id]/                 
						            │   ├── components/      
						            │   │   ├── ui/
						            │   │   │   ├── basic-info.tsx
						            │   │   │   ├── origin-info.tsx
						            │   │   │   └── taste-profile.tsx
						            │   ├── edit/
						            │   │   └── page.tsx
						            │   └── page.tsx
						            ├── create/
						            │   └── page.tsx
						            ├── layout.tsx
						            └── page.tsx
```

- **elemenets** - Basic building blocks (smallest components and Shadcn UI components)
    - No business logic allowed
    - Pure presentational components
    - Examples: Button, Input, Card
- **templates** - Combinations of **elemenets**
    - No business logic allowed
    - Can accept specialized functions via props
    - Must be reusable across different **route-base-components** and **features**
    - Examples: ImageUploader, FallbackLoader
- Features - Complex components
    - Can not use **route-base-components**
    - Can not use **other**  **features**
    - Can contain  templates and elemenets
    - Must contain project-wide business logic which can not be in any **route-base-components**
- **route-base-components** - Complex feature-specific components
    - Cannot use **other route-base-components**
    - Can contain feature-specific templates
    - Organized by route (orders, products, profile, etc.)
    
    Each major feature (orders, products, profile) has its own folder under route-base-components with:
    
    - A ui/ folder containing the actual components
    - Some have lib/ folders for hooks and utilities