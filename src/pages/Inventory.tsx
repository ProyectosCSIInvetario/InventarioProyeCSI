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
    const [loading, setLoading] = useState(true); // Para manejar el estado de carga
    const [error, setError] = useState<string | null>(null); // Para manejar errores

    // Función para cargar los datos del inventario desde Supabase
    const fetchInventory = async () => {
      setLoading(true);
      setError(null);
      try {
          const { data, error } = await supabase.from('inventory').select('*');
          if (error) throw error;
          setItems(data || []); // Si no hay datos, usa un arreglo vacío
      } catch (err) {
          console.error('Error fetching inventory:', err);
          setError('Hubo un problema al cargar el inventario. Intenta de nuevo.');
      } finally {
          setLoading(false);
      }
  };
  

    // Cargar inventario al montar el componente
    useEffect(() => {
        fetchInventory();
    }, []);

    // Manejar eliminación de productos seleccionados
    const handleDelete = async () => {
        // Crear la superposición y la ventana emergente de confirmación
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
        
        // Botón de confirmar
        const confirmButton = document.createElement('button');
        confirmButton.classList.add('bg-red-500', 'text-white', 'px-4', 'py-2', 'rounded', 'hover:bg-red-400');
        confirmButton.textContent = 'Eliminar';
        
        // Botón de cancelar
        const cancelButton = document.createElement('button');
        cancelButton.classList.add('bg-gray-300', 'text-black', 'px-4', 'py-2', 'rounded', 'hover:bg-gray-200');
        cancelButton.textContent = 'Cancelar';
    
        // Función para confirmar la eliminación
        confirmButton.onclick = async () => {
            try {
                const { error } = await supabase
                    .from('inventory')
                    .delete()
                    .in('code', selectedItems);
                if (error) throw error;
    
                // Actualizar estado local eliminando los productos seleccionados
                setItems(items.filter((item) => !selectedItems.includes(item.code)));
                setSelectedItems([]);
                document.body.removeChild(overlay); // Cerrar la ventana emergente
            } catch (err) {
                console.error('Error deleting items:', err);
                document.body.removeChild(overlay); // Cerrar la ventana emergente
                showErrorPopup('No se pudieron eliminar los productos seleccionados. Intenta de nuevo.');
            }
        };
    
        // Función para cerrar la ventana emergente
        cancelButton.onclick = () => {
            document.body.removeChild(overlay); // Cerrar la ventana emergente
        };
    
        // Añadir botones al contenedor
        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(cancelButton);
    
        // Añadir todo al popup
        popup.appendChild(title);
        popup.appendChild(message);
        popup.appendChild(buttonContainer);
        
        // Añadir el popup al overlay
        overlay.appendChild(popup);
        
        // Añadir la superposición al cuerpo del documento
        document.body.appendChild(overlay);
    };
    
    // Función para mostrar un error si la eliminación falla
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
            document.body.removeChild(overlay); // Cerrar la ventana emergente
        };
    
        // Añadir todo al popup
        popup.appendChild(title);
        popup.appendChild(errorMessage);
        popup.appendChild(closeButton);
        
        // Añadir el popup al overlay
        overlay.appendChild(popup);
        
        // Añadir la superposición al cuerpo del documento
        document.body.appendChild(overlay);
    };
    
  
    // Manejar la adición de un nuevo producto
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
        <div className="flex space-x-4"> {/* Cambié esta parte a flex para los botones estén al lado */}
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
                disabled={selectedItems.length === 0} // Deshabilitar si no hay productos seleccionados
            >
                <Trash className="h-5 w-5 mr-2" />
                Eliminar Seleccionados
            </button>
        </div>
            </div>

            {/* Mensajes de error o carga */}
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

            {/* Modal para agregar productos */}
            <AddProductModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddItem}
            />
        </div>
    );
}
