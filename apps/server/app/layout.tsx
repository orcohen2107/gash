export const metadata = {
  title: 'Gash Server',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='he'>
      <body>{children}</body>
    </html>
  )
}
