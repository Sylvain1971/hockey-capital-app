export const metadata = {
  title: 'Hockey Capital — Bourse sportive LNH',
  description: 'Achetez et vendez des actions d\'équipes LNH. Prix influencés par les vrais résultats.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, background: 'var(--color-background-tertiary, #f5f5f5)' }}>
        {children}
      </body>
    </html>
  );
}
