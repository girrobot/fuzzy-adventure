import { useAuthModal } from '../lib/hooks/useAuthModal';

export default function Navbar() {
  const { openModal } = useAuthModal();

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          {/* Your logo/brand */}
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => openModal('signin')}
            className="text-gray-600 hover:text-gray-900"
          >
            Sign In
          </button>
          <button
            onClick={() => openModal('signup')}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
          >
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
} 