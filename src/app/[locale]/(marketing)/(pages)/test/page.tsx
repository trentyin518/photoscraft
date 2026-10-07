import Container from '@/components/layout/container';
import { VerifyApiKeyCard } from '@/components/test/verify-apikey-card';

export default async function TestPage() {
  return (
    <Container className="py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* API key verification test */}
        <VerifyApiKeyCard />
      </div>
    </Container>
  );
}
