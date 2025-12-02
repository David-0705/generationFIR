import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import heroImage from "@/assets/fir-hero.jpg";
import { Shield, FileText, Clock, Users, Search, CheckCircle } from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: FileText,
      title: "Online FIR Filing",
      description: "File First Information Reports online through our secure digital platform. Quick, easy, and available 24/7."
    },
    {
      icon: Shield,
      title: "Secure & Verified",
      description: "All FIRs are verified by authorized police officials. Your data is protected with advanced encryption."
    },
    {
      icon: Clock,
      title: "Real-time Tracking",
      description: "Track your FIR status in real-time. Get instant updates via SMS, email, and portal notifications."
    },
    {
      icon: Users,
      title: "Multi-role Access",
      description: "Different access levels for citizens, police officers, and administrators with role-based permissions."
    },
    {
      icon: Search,
      title: "Case Management",
      description: "Comprehensive case management system with unique FIR IDs and progress tracking capabilities."
    },
    {
      icon: CheckCircle,
      title: "Digital Verification",
      description: "OTP verification, digital signatures, and duplicate prevention ensure data integrity and authenticity."
    }
  ];

  const stats = [
    { number: "10+", label: "FIRs Filed" },
    { number: "24/7", label: "Service Available" },
    { number: "98%", label: "User Satisfaction" },
    { number: "15+", label: "Police Stations" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-police-blue to-police-blue-dark text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="FIR System Hero" 
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Digital FIR <span className="text-safety-orange">Generation</span> System
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white/90">
              Streamline the process of filing First Information Reports online. 
              Secure, fast, and accessible to all citizens.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/chatbot">
                <Button variant="safety" size="lg" className="text-lg px-8 py-3">
                  File FIR Online
                </Button>
              </Link>
              <Link to="/form">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3 border-white text-black hover:bg-white hover:text-police-blue">
                  Form
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-police-blue-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-police-blue mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-police-blue mb-4">
              How Our FIR System Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive digital platform designed to make filing and tracking FIRs simple, 
              secure, and efficient for everyone.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-police transition-all duration-300 border-0 shadow-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-police-blue-light rounded-lg">
                      <feature.icon className="h-6 w-6 text-police-blue" />
                    </div>
                    <CardTitle className="text-xl text-police-blue">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-police-blue-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-police-blue mb-4">
              Simple 4-Step Process
            </h2>
            <p className="text-xl text-muted-foreground">
              Filing an FIR has never been easier
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Register", desc: "Create your account with valid ID proof" },
              { step: "2", title: "Fill Form", desc: "Complete the FIR form with incident details" },
              { step: "3", title: "Submit", desc: "Submit your FIR for police verification" },
              { step: "4", title: "Track", desc: "Monitor progress and receive updates" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-police-blue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-police-blue mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-police-blue to-police-blue-dark text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of citizens using our secure digital FIR system. 
            File your report today and experience the future of law enforcement services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="safety" size="lg" className="text-lg px-8 py-3">
                Create Account
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-police-blue">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-police-blue-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">FIR System</h3>
              <p className="text-white/80">
                Digital platform for secure and efficient First Information Report filing and management.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-white/80">
                <li><Link to="/about" className="hover:text-white">About</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/help" className="hover:text-white">Help</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Emergency</h3>
              <p className="text-white/80 mb-2">For emergencies, call:</p>
              <p className="text-2xl font-bold text-safety-orange">100</p>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
            <p>&copy; 2024 FIR Generation System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
