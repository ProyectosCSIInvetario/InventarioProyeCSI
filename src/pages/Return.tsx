import React, { useState } from 'react';
import { Save, Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';
import type { InventoryItem } from '../types';

interface Props {
    inventoryItems: InventoryItem[];
    setItems: (items: InventoryItem[]) => void;
}

export default function Return({ inventoryItems, setItems }: Props) {
    const [code, setCode] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [itemsToReturn, setItemsToReturn] = useState<InventoryItem[]>([]);

    // ✅ Agregar el producto a la lista de devolución
    const handleAddToReturnList = () => {
        const itemToReturn = inventoryItems.find(item => item.code === code);
        if (!itemToReturn) {
            alert('Producto no encontrado en el inventario.');
            return;
        }

        if (itemToReturn.inUse < quantity) {
            alert('No puedes devolver más productos de los que están en uso.');
            return;
        }

        setItemsToReturn(prev => [...prev, { ...itemToReturn, quantity }]);
        setCode('');
        setQuantity(1);
    };

    // ✅ Procesar la devolución actualizando la base de datos
    const handleConfirmReturn = async () => {
        try {
            for (const returnedItem of itemsToReturn) {
                // Actualizar el inventario
                const { error: inventoryError } = await supabase
                    .from('inventory')
                    .update({
                        available_quantity: returnedItem.availableQuantity + returnedItem.quantity,
                        in_use: returnedItem.inUse - returnedItem.quantity
                    })
                    .eq('code', returnedItem.code);

                if (inventoryError) {
                    console.error('Error actualizando inventario:', inventoryError);
                    alert('Error al devolver los productos.');
                    return;
                }

                // Actualizar la tabla locations (restar cantidad)
                const { error: locationError } = await supabase
                    .from('locations')
                    .update({
                        quantity: returnedItem.quantity - quantity
                    })
                    .eq('inventory_code', returnedItem.code)
                    .gt('quantity', 0); // Solo si la cantidad es mayor a 0

                if (locationError) {
                    console.error('Error actualizando ubicaciones:', locationError);
                    alert('Error al actualizar las ubicaciones.');
                    return;
                }
            }

            alert('Productos devueltos correctamente.');
            setItemsToReturn([]); // Limpiar la lista de devolución
            setItems(prev =>
                prev.map(item => {
                    const returnedItem = itemsToReturn.find(i => i.code === item.code);
                    if (returnedItem) {
                        return {
                            ...item,
                            availableQuantity: item.availableQuantity + returnedItem.quantity,
                            inUse: item.inUse - returnedItem.quantity
                        };
                    }
                    return item;
                })
            );
        } catch (error) {
            console.error('Error en la devolución:', error);
            alert('Hubo un error al devolver los productos.');
        }
    };

    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
    <h1 className="text-2xl font-bold text-gray-800 mb-6">Devolver Productos</h1>

    <div className="bg-white rounded-lg shadow p-6">
        <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Código de Producto</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500"
                        placeholder="Ingresa la ubicación"
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={handleAddToReturnList}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Agregar a Lista
                </button>

                <button
                    type="button"
                    onClick={handleConfirmReturn}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                >
                    <Save className="h-5 w-5 mr-2" />
                    Confirmar Devolución
                </button>
            </div>
        </form>

        {/* Sección de productos a devolver */}
        {itemsToReturn.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Productos a Devolver</h2>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Código</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Descripción</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Cantidad</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Ubicación</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {itemsToReturn.map((item, index) => (
                            <tr key={index}>
                                <td className="px-4 py-3 text-sm">{item.code}</td>
                                <td className="px-4 py-3 text-sm">{item.description}</td>
                                <td className="px-4 py-3 text-sm">{item.quantity}</td>
                                <td className="px-4 py-3 text-sm">{item.location}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
</div>



    );
}
