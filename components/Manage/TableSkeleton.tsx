import React from 'react'

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div></th>
              <th className="px-6 py-3 text-left"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div></th>
              <th className="px-6 py-3 text-left"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div></th>
              <th className="px-6 py-3 text-left"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div></th>
              <th className="px-6 py-3 text-left"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div></th>
              <th className="px-6 py-3 text-left"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div></th>
              <th className="px-6 py-3 text-left"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div></th>
              <th className="px-6 py-3 text-right"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12 ml-auto"></div></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                      <div className="flex gap-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-3">
                    <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
