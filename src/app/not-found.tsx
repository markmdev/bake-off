import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <p className="text-6xl mb-4">🍰</p>
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">
          Even the best chefs burn their cakes sometimes. We&apos;re re-baking...
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
