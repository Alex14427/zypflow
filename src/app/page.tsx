import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-brand-purple">Zyp</span>flow
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          AI-powered customer growth for UK service businesses.
          Capture leads 24/7, book appointments automatically, and grow your reviews.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-brand-purple hover:bg-brand-purple-dark text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="border border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
}
