export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {[1, 2, 3].map((i) => (
            <li key={i} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex gap-6">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mt-2 sm:mt-0" />
                </div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-2 sm:mt-0" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
