import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { InventoryItem } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (item: InventoryItem) => void;
}

export default function AddProductModal({ isOpen, onClose, onAdd }: Props) {
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        family: '',
        model: '',
        totalQuantity: '', // Se usa string para manejar inputs
    });

    if (!isOpen) return null;

    // Manejar envío del formulario
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Crear el nuevo producto
        const newItem: InventoryItem = {
            code: formData.code,
            description: formData.description,
            family: formData.family,
            model: formData.model,
            total_quantity: parseInt(formData.totalQuantity) || 0, // Total ingresado
            available_quantity: parseInt(formData.totalQuantity) || 0, // Igual al total inicialmente
            in_use: 0, // Inicialmente en 0
        };

        // Llamar a la función para agregar el producto
        onAdd(newItem);

        // Cerrar el modal y resetear el formulario
        onClose();
        setFormData({
            code: '',
            description: '',
            family: '',
            model: '',
            totalQuantity: '',
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                {/* Encabezado del modal */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Agregar Producto</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Código</label>
                        <input
                            type="text"
                            required
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Familia</label>
                        <input
                            type="text"
                            required
                            value={formData.family}
                            onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Modelo</label>
                        <input
                            type="text"
                            required
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cantidad Total</label>
                        <input
                            type="number"
                            required
                            min="0"
                            value={formData.totalQuantity}
                            onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Agregar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
