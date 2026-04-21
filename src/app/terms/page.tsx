import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fafbfc]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-[#1a1f36]">Terms of Service</h1>
          <Link href="/" className="text-sm text-[#00d4aa] hover:text-[#0077ff] transition-colors">
            Back to home
          </Link>
        </div>
        <p className="mt-6 text-sm text-[#2d2a4a]/70 leading-relaxed">
          By using AI Zaha Home Design, you agree to use the service responsibly. Results are AI-generated and provided
          for visualization purposes.
        </p>
        <p className="mt-4 text-sm text-[#2d2a4a]/70 leading-relaxed">
          Do not upload sensitive personal information. You are responsible for ensuring you have the right to upload
          and use the images you submit.
        </p>
      </div>
    </main>
  );
}

