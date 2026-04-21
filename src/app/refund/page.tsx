import Link from 'next/link';

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-[#fafbfc]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-[#1a1f36]">Refund Policy</h1>
          <Link href="/" className="text-sm text-[#00d4aa] hover:text-[#0077ff] transition-colors">
            Back to home
          </Link>
        </div>
        <p className="mt-6 text-sm text-[#2d2a4a]/70 leading-relaxed">
          Refund terms will be shown at checkout once payments are enabled. For the MVP, if you believe you were
          charged incorrectly, please contact support.
        </p>
      </div>
    </main>
  );
}

