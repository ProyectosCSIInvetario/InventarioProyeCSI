import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img src="img/logo_csi.png" alt="Logo de Proyectos CSI" className="h-14 w-50" />
              <span className="text-xl font-bold text-gray-800">Proyectos CSI</span>
            </Link>
          </div>

          {/* Menú de navegación (normal en pantallas grandes y hamburguesa en pantallas pequeñas) */}
          <div className="hidden sm:flex items-center space-x-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded-md ${
                isActive('/') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
              }`}
            >
              Inventario
            </Link>
            <Link
              to="/request"
              className={`px-4 py-2 rounded-md ${
                isActive('/request') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
              }`}
            >
              Solicitar
            </Link>
            <Link
              to="/return"
              className={`px-4 py-2 rounded-md ${
                isActive('/return') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
              }`}
            >
              Entregar
            </Link>
          </div>

          {/* Botón hamburguesa (visible solo en pantallas pequeñas) */}
          <button
            className="sm:hidden block text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Menú desplegable en pantallas pequeñas (cuando el botón hamburguesa está activo) */}
      <div
        className={`sm:hidden ${isMenuOpen ? 'block' : 'hidden'} flex flex-col items-center space-y-4 py-4`}
      >
        <Link
          to="/"
          className={`px-4 py-2 rounded-md ${
            isActive('/') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
          }`}
        >
          Inventario
        </Link>
        <Link
          to="/request"
          className={`px-4 py-2 rounded-md ${
            isActive('/request') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
          }`}
        >
          Solicitar
        </Link>
        <Link
          to="/return"
          className={`px-4 py-2 rounded-md ${
            isActive('/return') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
          }`}
        >
          Entregar
        </Link>
      </div>
    </nav>
  );
}
