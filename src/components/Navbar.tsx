import React from 'react';
import { Package } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
        <div className="flex items-center">
    <Link to="/" className="flex items-center space-x-2">
        <img src="public/img/logo_csi.png" alt="Logo de Proyectos CSI" className="h-14 w-50" />
        <span className="text-xl font-bold text-gray-800">Proyectos CSI</span>
    </Link>
</div>

          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded-md ${
                isActive('/') 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-blue-50'
              }`}
            >
              Inventario
            </Link>
            <Link
              to="/request"
              className={`px-4 py-2 rounded-md ${
                isActive('/request') 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-blue-50'
              }`}
            >
              Solicitar
            </Link>
            <Link
              to="/return"
              className={`px-4 py-2 rounded-md ${
                isActive('/return') 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-blue-50'
              }`}
            >
              Entregar
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}