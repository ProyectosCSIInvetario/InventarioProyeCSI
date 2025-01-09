import React from 'react';
import { Eye, Trash } from 'lucide-react';
import type { InventoryItem } from '../types';

interface Props {
  items: InventoryItem[];
  onDelete: (codes: string[]) => void;
  onViewDetails: (item: InventoryItem) => void;
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;
}

export default function InventoryTable({ 
  items, 
  onDelete, 
  onViewDetails,
  selectedItems,
  setSelectedItems 
}: Props) {
  const toggleSelect = (code: string) => {
    setSelectedItems(
      selectedItems.includes(code)
        ? selectedItems.filter(item => item !== code)
        : [...selectedItems, code]
    );
  };

  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-12 px-4 py-3">
              <input
                type="checkbox"
                onChange={(e) => setSelectedItems(e.target.checked ? items.map(i => i.code) : [])}
                checked={selectedItems.length === items.length && items.length > 0}
                className="rounded border-gray-300"
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Código</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Descripción</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Familia</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Modelo</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Cantidad Total</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Cantidad Libre</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">En Uso</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.code} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.code)}
                  onChange={() => toggleSelect(item.code)}
                  className="rounded border-gray-300"
                />
              </td>
              <td className="px-4 py-3 text-sm">{item.code}</td>
              <td className="px-4 py-3 text-sm">{item.description}</td>
              <td className="px-4 py-3 text-sm">{item.family}</td>
              <td className="px-4 py-3 text-sm">{item.model}</td>
              <td className="px-4 py-3 text-sm">{item.total_quantity}</td>
              <td className="px-4 py-3 text-sm">{item.available_quantity}</td>
              <td className="px-4 py-3 text-sm">{item.in_use}</td>
              <td className="px-4 py-3 text-sm">
              <button
    onClick={() => onViewDetails(item)} // ✅ Este es el botón corregido
    className="p-1 text-blue-600 hover:text-blue-800"
>
    <Eye className="h-5 w-5" />
</button>

              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}