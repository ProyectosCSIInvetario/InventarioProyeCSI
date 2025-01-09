import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Inventory from './pages/Inventory';
import Request from './pages/Request';
import Return from './pages/Return';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import type { InventoryItem } from './types';


function App() {
    const [items, setItems] = useState([]);

    // Cargar el inventario desde Supabase
    useEffect(() => {
        const fetchInventory = async () => {
            const { data, error } = await supabase.from('inventory').select('*');
            if (error) {
                console.error('Error fetching inventory:', error);
            } else {
                setItems(data);
            }
        };

        fetchInventory();
    }, []);

    return (
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Inventory items={items} setItems={setItems} />} />
              <Route path="/request" element={<Request inventoryItems={items} setItems={setItems} />} />
              <Route path="/return" element={<Return inventoryItems={items} setItems={setItems} />} />
            </Routes>
          </main>
        </div>
      </Router>
    );
}

export default App;
