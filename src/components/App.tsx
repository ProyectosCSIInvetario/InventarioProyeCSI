import React, { useState } from 'react';
import Inventory from './pages/Inventory';
import Request from './pages/Request';

// Definición del tipo InventoryItem
interface InventoryItem {
    code: string;
    description: string;
    family: string;
    model: string;
    totalQuantity: number;
    availableQuantity: number;
    inUse: number;
    locations: string[];
}

export default function App() {
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-center my-6">Gestión de Inventario</h1>
            <Inventory items={inventoryItems} setItems={setInventoryItems} />
            <Request inventoryItems={inventoryItems} setInventoryItems={setInventoryItems} />
        </div>
    );
}
