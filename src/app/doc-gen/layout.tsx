export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <section
      className={`flex h-full min-h-screen w-full flex-col items-center justify-center`}
    >
      {children}
    </section>
  )
}
