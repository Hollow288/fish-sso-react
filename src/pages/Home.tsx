import PageShell from '../components/PageShell';

export default function Home() {
  return (
    <PageShell
      eyebrow="Service Ready"
      title="Welcome to TongHttpServer!"
      description="Your web service is online and ready for the next setup step."
      headerIconSrc="/favicon.svg"
      headerIconAlt="TongHttpServer"
      headerAlign="center"
      highlights={['HTTP Engine', 'Route Handling', 'Status: Running']}
    >
      <section className="home-spotlight" aria-label="service message">
        Thank you for using TongHttpServer.
      </section>
    </PageShell>
  );
}
