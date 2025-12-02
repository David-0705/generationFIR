import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import policeBadge from "@/assets/police-badge.png";

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img src={policeBadge} alt="Police Badge" className="h-8 w-8" />
            <span className="text-xl font-bold text-police-blue">FIR System</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors hover:text-police-blue ${
                location.pathname === '/' ? 'text-police-blue' : 'text-foreground'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className={`text-sm font-medium transition-colors hover:text-police-blue ${
                location.pathname === '/about' ? 'text-police-blue' : 'text-foreground'
              }`}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className={`text-sm font-medium transition-colors hover:text-police-blue ${
                location.pathname === '/contact' ? 'text-police-blue' : 'text-foreground'
              }`}
            >
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="hero" size="sm">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;