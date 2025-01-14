import React, { useState } from 'react';
import { Plus, Save, Trash } from 'lucide-react'; // Importa el ícono Trash
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { RequestItem, InventoryItem } from '../types';
import { supabase } from '../supabaseClient';

interface Props {
  inventoryItems: InventoryItem[];
  setItems: (items: InventoryItem[]) => void;
}

export default function Request({ inventoryItems, setItems }: Props) {
  const [items, setRequestItems] = useState<RequestItem[]>([]);
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAddToList = () => {
    // Verificar si falta algún campo
    if (!code || !location || quantity < 1) {
      showErrorPopup('Por favor complete todos los campos correctamente.');
      return;
    }

    // Verificar si el producto existe en el inventario
    const existingItem = inventoryItems.find(item => item.code === code);
    if (!existingItem) {
      showErrorPopup('El producto no existe en el inventario.');
      return;
    }

    const newItem: RequestItem = {
      code,
      item: existingItem,
      quantity,
      location,
    };

    // Actualizar el estado con el nuevo ítem
    setRequestItems([...items, newItem]);
    setCode('');
    setLocation('');
    setQuantity(1);
  };

  // Función para mostrar un error si algún campo falta o el producto no existe
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


  // Función para eliminar un producto de la lista
  const handleRemoveFromList = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setRequestItems(updatedItems);
  };

  const handleFinalize = async () => {
    try {
        const uniqueProducts = [...new Set(items.map(item => item.code))];

        for (const code of uniqueProducts) {
            const totalRequestedQuantity = items
                .filter(item => item.code === code)
                .reduce((sum, item) => sum + item.quantity, 0);

            const { data: inventoryData, error: fetchError } = await supabase
                .from('inventory')
                .select('available_quantity, in_use')
                .eq('code', code)
                .single();

            if (fetchError) {
                showErrorPopupFinalize('Error al obtener inventario.');
                return;
            }

            const { available_quantity, in_use } = inventoryData;

            const { error: inventoryError } = await supabase
                .from('inventory')
                .update({
                    available_quantity: available_quantity - totalRequestedQuantity,
                    in_use: in_use + totalRequestedQuantity
                })
                .eq('code', code);

            if (inventoryError) {
                showErrorPopupFinalize('Error al actualizar el inventario.');
                return;
            }

            // Procesar ubicaciones correctamente
            const requestedItems = items.filter(item => item.code === code);
            for (const requestedItem of requestedItems) {
                // Comprobación precisa si la ubicación ya existe
                const { data: existingLocation, error: locationFetchError } = await supabase
                    .from('locations')
                    .select('quantity')
                    .eq('inventory_code', requestedItem.code)
                    .eq('place', requestedItem.location);

                if (locationFetchError) {
                    showErrorPopupFinalize('Error al verificar la ubicación.');
                    return;
                }

                if (existingLocation.length > 0) {
                    // Si existe, actualizar la cantidad sumando
                    const updatedQuantity = existingLocation[0].quantity + requestedItem.quantity;
                    const { error: locationUpdateError } = await supabase
                        .from('locations')
                        .update({ quantity: updatedQuantity })
                        .eq('inventory_code', requestedItem.code)
                        .eq('place', requestedItem.location);

                    if (locationUpdateError) {
                        showErrorPopupFinalize('Error al actualizar la ubicación.');
                        return;
                    }
                } else {
                    // Si no existe, crear una nueva entrada
                    const { error: locationInsertError } = await supabase
                        .from('locations')
                        .insert({
                            inventory_code: requestedItem.code,
                            place: requestedItem.location,
                            quantity: requestedItem.quantity
                        });

                    if (locationInsertError) {
                        showErrorPopupFinalize('Error al registrar la ubicación.');
                        return;
                    }
                }
            }
        }

        await generatePDF();
        showSuccessPopup('Productos actualizados y PDF generado con éxito.');

        setItems(prev => prev.map(item => {
            const requestedItem = items.find(i => i.code === item.code);
            if (requestedItem) {
                return {
                    ...item,
                    availableQuantity: item.availableQuantity - requestedItem.quantity,
                    inUse: item.inUse + requestedItem.quantity
                };
            }
            return item;
        }));

    } catch (error) {
        console.error('Error en la finalización:', error);
        showErrorPopup('Ocurrió un error inesperado.');
    }
};

  // Función para mostrar una ventana emergente de error
  const showErrorPopupFinalize = (message: string) => {
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




  const generatePDF = async () => {
    console.log('Generando PDF...');
    const doc = new jsPDF();

    try {
      // Definir márgenes
      const marginTop = 20;
      const marginBottom = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Logo de la parte superior
      const templateURL = '/img/ProyectosCSI.jpg';
      const image = await fetch(templateURL)
        .then(res => res.blob())
        .then(blob => {
          return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        });

      console.log('Imagen cargada con éxito.');

      // Definir la altura del logo
      const logoHeight = 40;

      // Función para agregar la imagen de fondo
      const addBackgroundImage = () => {
        doc.addImage(image as string, 'JPG', 0, 0, pageWidth, pageHeight);
      };

      // Agregar imagen al inicio
      addBackgroundImage();

      // Establecer tamaño de fuente
      doc.setFontSize(14);

      // Posición después del logo
      let yPosition = marginTop + logoHeight;

      // Colocar el título
      doc.text('Lista de Productos Solicitados', 20, yPosition);

       // Obtener fecha y hora actual
       const now = new Date();
       const dateString = now.toLocaleDateString(); // Formato de fecha local
       const timeString = now.toLocaleTimeString(); // Formato de hora local

       // Incrementar la posición vertical para la fecha y hora
       yPosition += 10;
       doc.setFontSize(12); // Reducir el tamaño de fuente para la fecha y hora
       doc.text(`Fecha: ${dateString} Hora: ${timeString}`, 20, yPosition);


      const tableData = items.map(item => [
        item.code,
        item.item.description,
        item.quantity,
        item.location
      ]);

      // Ajustar la tabla y márgenes
      const startY = yPosition + 10;

      const generateTable = (startY) => {
        doc.autoTable({
          head: [['Código', 'Descripción', 'Cantidad', 'Ubicación']],
          body: tableData,
          startY: startY,
          margin: { top: 0 },
          didDrawPage: (data) => {
            if (data.cursor.y + 40 > pageHeight - marginBottom) {
              doc.addPage();
              addBackgroundImage();
              doc.text('Lista de Productos Solicitados', 20, marginTop + 40);
            }
          },
        });
      };

      // Generar la tabla
      generateTable(startY);

      // Agregar campos de nombre y firma
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.text('Nombre:', 20, finalY);
      doc.line(50, finalY, 160, finalY);
      doc.text('Firma:', 20, finalY + 20);
      doc.line(50, finalY + 20, 160, finalY + 20);

      console.log('PDF generado correctamente.');
      doc.save('solicitud_productos.pdf');
    } catch (error) {
      console.error('Error generando el PDF:', error);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Solicitar Productos</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Código de Producto
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Escanear o ingresar código"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Ubicación</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cantidad</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleAddToList}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar a Lista
            </button>

            <button
              type="button"
              onClick={handleFinalize}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <Save className="h-5 w-5 mr-2" />
              Finalizar y Generar PDF
            </button>
          </div>
        </form>

        {items.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Productos Seleccionados</h2>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Código</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Descripción</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Cantidad</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Ubicación</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Acciones</th> {/* Nueva columna */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm">{item.code}</td>
                    <td className="px-4 py-3 text-sm">{item.item.description}</td>
                    <td className="px-4 py-3 text-sm">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm">{item.location}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleRemoveFromList(index)} // Elimina el producto
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </td>
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
