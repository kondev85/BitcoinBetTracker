import React, { useEffect, useState } from 'react';
import { fetchBlocks } from '../lib/api-client';
import { Block } from '../../shared/schema';

const BlocksTable: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBlocks = async () => {
      try {
        setLoading(true);
        const data = await fetchBlocks(20); // Fetch latest 20 blocks
        setBlocks(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch blocks:', err);
        setError('Failed to load blocks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadBlocks();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Loading blocks data...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (blocks.length === 0) {
    return <div className="p-4 text-center">No blocks found in the database.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
        <thead className="bg-gray-700">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Height</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Miner</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Found In</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Size</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Txns</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {blocks.map(block => (
            <tr key={block.id} className="hover:bg-gray-700">
              <td className="px-4 py-2 whitespace-nowrap text-orange-500 font-medium">
                {block.number}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {block.minerId}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {new Date(block.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  block.status === 'completed' ? 'bg-green-800 text-green-100' : 'bg-yellow-800 text-yellow-100'
                }`}>
                  {block.status}
                </span>
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {block.foundInMinutes ? `${block.foundInMinutes.toFixed(1)} min` : 'N/A'}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {block.size ? `${(block.size).toFixed(2)} MB` : 'N/A'}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {block.txCount ?? 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BlocksTable;