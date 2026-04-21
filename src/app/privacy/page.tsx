import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fafbfc]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-[#1a1f36]">Privacy Policy</h1>
          <Link href="/" className="text-sm text-[#00d4aa] hover:text-[#0077ff] transition-colors">
            Back to home
          </Link>
        </div>
        <p className="mt-6 text-sm text-[#2d2a4a]/70 leading-relaxed">
          We use your uploaded image only to generate your requested preview and results. We do not sell your personal
          data.
        </p>
        <p className="mt-4 text-sm text-[#2d2a4a]/70 leading-relaxed">
          This page is a short-form policy for the MVP. If you need data deletion or have questions, please contact
          support.
        </p>
      </div>
    </main>
  );
}

