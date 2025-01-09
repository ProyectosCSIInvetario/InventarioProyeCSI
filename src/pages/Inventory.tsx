import React, { useState, useEffect } from 'react';
import { Plus, Trash } from 'lucide-react';
import InventoryTable from '../components/InventoryTable';
import AddProductModal from '../components/AddProductModal';
import { supabase } from '../supabaseClient';
import type { InventoryItem } from '../types';

export default function Inventory() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para el menú hamburguesa
    const [isMobile, setIsMobile] = useState(false); // Estado para detectar tamaño de pantalla

    const fetchInventory = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.from('inventory').select('*');
            if (error) throw error;
            setItems(data || []);
        } catch (err) {
            console.error('Error fetching inventory:', err);
            setError('Hubo un problema al cargar el inventario. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();

        const handleResize = () => {
            if (window.innerWidth <= 600) {
                setIsMobile(true);
            } else {
                setIsMobile(false);
            }
        };

        // Añadir el event listener para el cambio de tamaño
        window.addEventListener('resize', handleResize);

        // Llamar a la función una vez al cargar el componente
        handleResize();

        // Limpiar el event listener cuando el componente se desmonte
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleDelete = async () => {
        const overlay = document.createElement('div');
        overlay.classList.add('fixed', 'inset-0', 'bg-black', 'bg-opacity-50', 'flex', 'justify-center', 'items-center');

        const popup = document.createElement('div');
        popup.classList.add('bg-white', 'p-6', 'rounded-lg', 'max-w-lg', 'w-full', 'max-h-[80vh]', 'overflow-auto');

        const title = document.createElement('h2');
        title.classList.add('text-xl', 'font-semibold', 'mb-4');
        title.textContent = 'Confirmación de eliminación';

        const message = document.createElement('p');
        message.classList.add('mb-4');
        message.textContent = '¿Estás seguro de que deseas borrar los productos seleccionados?';

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('flex', 'gap-4');

        const confirmButton = document.createElement('button');
        confirmButton.classList.add('bg-red-500', 'text-white', 'px-4', 'py-2', 'rounded', 'hover:bg-red-400');
        confirmButton.textContent = 'Eliminar';

        const cancelButton = document.createElement('button');
        cancelButton.classList.add('bg-gray-300', 'text-black', 'px-4', 'py-2', 'rounded', 'hover:bg-gray-200');
        cancelButton.textContent = 'Cancelar';

        confirmButton.onclick = async () => {
            try {
                const { error } = await supabase
                    .from('inventory')
                    .delete()
                    .in('code', selectedItems);
                if (error) throw error;

                setItems(items.filter((item) => !selectedItems.includes(item.code)));
                setSelectedItems([]);
                document.body.removeChild(overlay);
            } catch (err) {
                console.error('Error deleting items:', err);
                document.body.removeChild(overlay);
                showErrorPopup('No se pudieron eliminar los productos seleccionados. Intenta de nuevo.');
            }
        };

        cancelButton.onclick = () => {
            document.body.removeChild(overlay);
        };

        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(cancelButton);

        popup.appendChild(title);
        popup.appendChild(message);
        popup.appendChild(buttonContainer);

        overlay.appendChild(popup);

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

    const handleAddItem = async (newItem: InventoryItem) => {
        try {
            const { error } = await supabase.from('inventory').insert(newItem);
            if (error) throw error;

            // Recargar el inventario desde Supabase
            await fetchInventory();

            // Cerrar el modal
            setShowAddModal(false);
        } catch (err) {
            console.error('Error adding item:', err);
            alert('No se pudo agregar el producto. Intenta de nuevo.');
        }
    };

    const handleViewDetails = async (item: InventoryItem) => {
        // Obtener los datos de Supabase
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('inventory_code', item.code);

        if (error) {
            alert('Error al obtener ubicaciones.');
            return;
        }

        // Crear la superposición y la ventana emergente
        const overlay = document.createElement('div');
        overlay.classList.add('fixed', 'inset-0', 'bg-black', 'bg-opacity-50', 'flex', 'justify-center', 'items-center');

        const popup = document.createElement('div');
        popup.classList.add('bg-white', 'p-4', 'rounded-lg', 'max-w-lg', 'w-full', 'max-h-[80vh]', 'overflow-auto');

        const title = document.createElement('h2');
        title.classList.add('text-xl', 'font-semibold', 'mb-4');
        title.textContent = 'Ubicaciones del producto';

        const locationDetails = document.createElement('div');
        locationDetails.classList.add('overflow-y-auto', 'max-h-[60vh]');
        const details = data.map(loc => `Lugar: ${loc.place}, Cantidad: ${loc.quantity}`).join('<br>');
        locationDetails.innerHTML = details;

        const closeButton = document.createElement('button');
        closeButton.classList.add('mt-4', 'bg-blue-500', 'text-white', 'px-4', 'py-2', 'rounded', 'hover:bg-blue-400');
        closeButton.textContent = 'Cerrar';

        // Función para cerrar el popup
        closeButton.onclick = () => {
            document.body.removeChild(overlay);
        };

        // Añadir todo a la superposición
        popup.appendChild(title);
        popup.appendChild(locationDetails);
        popup.appendChild(closeButton);
        overlay.appendChild(popup);

        // Añadir la superposición al cuerpo del documento
        document.body.appendChild(overlay);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>

                {/* Menú hamburguesa */}
                {isMobile ? (
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md"
                        >
                            <span className="material-icons">Opciones</span>
                        </button>

                        {isMenuOpen && (
                            <div className="absolute top-10 right-0 bg-white shadow-lg rounded-md w-40 py-2">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Agregar Producto
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className={`px-4 py-2 rounded-md flex items-center ${selectedItems.length > 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-300 text-gray-500 opacity-50 cursor-not-allowed'}`}
                                    disabled={selectedItems.length === 0}
                                >
                                    <Trash className="h-5 w-5 mr-2" />
                                    Eliminar Seleccionados
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Agregar Producto
                        </button>
                        <button
                            onClick={handleDelete}
                            className={`px-4 py-2 rounded-md flex items-center ${selectedItems.length > 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-300 text-gray-500 opacity-50 cursor-not-allowed'}`}
                            disabled={selectedItems.length === 0}
                        >
                            <Trash className="h-5 w-5 mr-2" />
                            Eliminar Seleccionados
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <p className="text-gray-500">Cargando inventario...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : items.length === 0 ? (
                <p className="text-gray-500">No hay productos en el inventario.</p>
            ) : (
                <div className="bg-white rounded-lg shadow">
                    <InventoryTable
                        items={items}
                        onDelete={handleDelete}
                        onViewDetails={handleViewDetails}
                        selectedItems={selectedItems}
                        setSelectedItems={setSelectedItems}
                    />
                </div>
            )}

            <AddProductModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddItem}
            />
        </div>
    );
}