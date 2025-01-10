import React, { useState } from 'react';
import { Save, Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';
import type { InventoryItem, Location } from '../types';


interface Props {
    inventoryItems: InventoryItem[];
    setItems: (items: InventoryItem[]) => void;
}

export default function Return({ inventoryItems, setItems }: Props) {
    const [code, setCode] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [maxQuantity, setMaxQuantity] = useState(0);
    const [itemsToReturn, setItemsToReturn] = useState<
        { code: string; description: string; location: string; quantity: number }[]
    >([]);

     // Función para mostrar una ventana emergente de éxito
  const showSuccessPopup = (message: string) => {
    const overlay = document.createElement('div');
    overlay.classList.add('fixed', 'inset-0', 'bg-black', 'bg-opacity-50', 'flex', 'justify-center', 'items-center');

    const popup = document.createElement('div');
    popup.classList.add('bg-white', 'p-6', 'rounded-lg', 'max-w-lg', 'w-full', 'max-h-[80vh]', 'overflow-auto');

    const title = document.createElement('h2');
    title.classList.add('text-xl', 'font-semibold', 'mb-4');
    title.textContent = 'Éxito';

    const successMessage = document.createElement('p');
    successMessage.classList.add('mb-4');
    successMessage.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.classList.add('bg-green-500', 'text-white', 'px-4', 'py-2', 'rounded', 'hover:bg-green-400');
    closeButton.textContent = 'Cerrar';

    closeButton.onclick = () => {
      document.body.removeChild(overlay); // Cerrar la ventana emergente
    };

    // Añadir todo al popup
    popup.appendChild(title);
    popup.appendChild(successMessage);
    popup.appendChild(closeButton);

    // Añadir el popup al overlay
    overlay.appendChild(popup);

    // Añadir la superposición al cuerpo del documento
    document.body.appendChild(overlay);
  };

    const showErrorPopup = (message: string) => {
        const overlay = document.createElement('div');
        overlay.classList.add('fixed', 'inset-0', 'bg-black', 'bg-opacity-50', 'flex', 'justify-center', 'items-center');

        const popup = document.createElement('div');
        popup.classList.add('bg-white', 'p-6', 'rounded-lg', 'max-w-lg', 'w-full', 'max-h-[80vh]', 'overflow-auto');

        const title = document.createElement('h2');
        title.classList.add('text-xl', 'font-semibold', 'mb-4');
        title.textContent = 'Error';

        const errorMessage = document.createElement('p');
        errorMessage.classList.add('mb-4');
        errorMessage.textContent = message;

        const closeButton = document.createElement('button');
        closeButton.classList.add('bg-blue-500', 'text-white', 'px-4', 'py-2', 'rounded', 'hover:bg-blue-400');
        closeButton.textContent = 'Cerrar';

        closeButton.onclick = () => {
            document.body.removeChild(overlay);
        };

        popup.appendChild(title);
        popup.appendChild(errorMessage);
        popup.appendChild(closeButton);
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
    };


    const handleSearchProduct = async () => {
        if (!code.trim()) {
            showErrorPopup('Introduce un código de producto.');
            return;
        }

        const { data: item, error: itemError } = await supabase
            .from('inventory')
            .select('*')
            .eq('code', code)
            .single();

        if (itemError || !item) {
            showErrorPopup('Producto no encontrado.');
            return;
        }

        if (item.in_use === 0) {
            showErrorPopup('No hay productos en uso.');
            return;
        }

        const { data: locationData, error: locationError } = await supabase
            .from('locations')
            .select('*')
            .eq('inventory_code', code);

        if (locationError || locationData.length === 0) {
            showErrorPopup('No se encontraron ubicaciones disponibles.');
            return;
        }

        setLocations(locationData);
        setSelectedLocation(locationData[0].place);
        setMaxQuantity(locationData[0].quantity);
    };
    
    const handleAddToReturnList = () => {
        if (!selectedLocation || quantity > maxQuantity || quantity < 1) {
            showErrorPopup('Cantidad inválida o ubicación no seleccionada.');
            return;
        }

        const item = inventoryItems.find((item) => item.code === code);

        setItemsToReturn((prev) => [
            ...prev,
            {
                code,
                description: item?.description || 'Sin descripción',
                location: selectedLocation,
                quantity
            }
        ]);

        setCode('');
        setQuantity(1);
        setLocations([]);
        setSelectedLocation('');
        setMaxQuantity(0);
    };
   


    const handleConfirmReturn = async () => {
        try {
            for (const returnedItem of itemsToReturn) {
                const { data: inventoryItem, error: fetchError } = await supabase
                    .from('inventory')
                    .select('*')
                    .eq('code', returnedItem.code)
                    .single();

                if (fetchError || !inventoryItem) {
                    showErrorPopup('Error al obtener los datos del producto.');
                    return;
                }

                if (returnedItem.quantity > inventoryItem.in_use) {
                    showErrorPopup('No puedes devolver más de los productos en uso.');
                    return;
                }

                const updatedAvailable = inventoryItem.available_quantity + returnedItem.quantity;
                const updatedInUse = inventoryItem.in_use - returnedItem.quantity;

                const { error: inventoryError } = await supabase
                    .from('inventory')
                    .update({
                        available_quantity: updatedAvailable,
                        in_use: updatedInUse
                    })
                    .eq('code', returnedItem.code);

                if (inventoryError) {
                    throw new Error('Error al actualizar el inventario.');
                }

                const { data: locationData, error: locationError } = await supabase
                    .from('locations')
                    .select('quantity')
                    .eq('inventory_code', returnedItem.code)
                    .eq('place', returnedItem.location)
                    .single();

                if (locationError || !locationData) {
                    showErrorPopup('Error al obtener la ubicación.');
                    return;
                }

                const updatedLocationQuantity = locationData.quantity - returnedItem.quantity;

                const { error: locationUpdateError } = await supabase
                    .from('locations')
                    .update({ quantity: updatedLocationQuantity })
                    .eq('inventory_code', returnedItem.code)
                    .eq('place', returnedItem.location);

                if (locationUpdateError) {
                    throw new Error('Error al actualizar la ubicación.');
                }
            }

            showSuccessPopup('Productos devueltos correctamente.');

            const { data: updatedInventory } = await supabase.from('inventory').select('*');
            setItems(updatedInventory);
            setItemsToReturn([]);
        } catch (error) {
            console.error('Error al devolver productos:', error);
            showErrorPopup('Error al devolver productos.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Devolver Productos</h1>

            <div className="bg-white rounded-lg shadow p-6">
                {/* Formulario para devolución */}
                <form className="space-y-6">
                    {/* Código del producto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Código de Producto</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            onBlur={handleSearchProduct}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500"
                        />
                    </div>

                    {/* Selección de ubicación */}
                    {locations.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                            <select
                                value={selectedLocation}
                                onChange={(e) => {
                                    setSelectedLocation(e.target.value);
                                    const selectedLoc = locations.find(loc => loc.place === e.target.value);
                                    setMaxQuantity(selectedLoc?.quantity || 0);
                                }}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500"
                            >
                                {locations.map((loc, index) => (
                                    <option key={index} value={loc.place}>
                                        {loc.place} (Disponible: {loc.quantity})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Cantidad */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            min="1"
                            max={maxQuantity}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500"
                        />
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
                                  Entregar Producto
                                </button>
                              </div>
                </form>

                {/* Mostrar productos a devolver */}
                {itemsToReturn.length > 0 && (
                    <ul className="mt-6">
                        {itemsToReturn.map((item, index) => (
                            <li key={index}>
                                <strong>{item.code}</strong> - {item.description} | Cantidad: {item.quantity} | Ubicación: {item.location}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
