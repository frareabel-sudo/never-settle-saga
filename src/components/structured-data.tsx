export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DreamCraft Studio",
    url: "https://dreamcraftstudio.co.uk",
    logo: "https://dreamcraftstudio.co.uk/images/dreamcraft-logo.jpg",
    email: "helpdesk@dreamcraftstudio.co.uk",
    address: {
      "@type": "PostalAddress",
      addressLocality: "London",
      addressCountry: "GB",
    },
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(organizationSchema),
      }}
    />
  );
}
