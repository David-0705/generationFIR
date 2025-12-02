import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, User, CheckCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  content: string;
  type: 'user' | 'bot';
  timestamp: Date;
}

interface ComplaintData {
  name?: string;
  mobile?: string;
  email?: string;
  age?: number;
  gender?: string;
  father_name?: string;
  present_address?: string;
  district?: string;
  nearest_police_station_home?: string;
  incident_location?: string;
  stolen_items?: string;
  robber_description?: string;
  nearest_police_station_incident?: string;
  incident_description?: string;
}

const requiredFields = {
  name: 'What is your full name?',
  mobile: 'What is your mobile number?',
  email: 'What is your email address?',
  age: 'What is your age?',
  gender: 'What is your gender?',
  father_name: 'What is your father\'s name?',
  present_address: 'What is your present address?',
  district: 'Which district do you live in?',
  nearest_police_station_home: 'What is the nearest police station to your house?',
  incident_location: 'Where did the robbery/theft happen?',
  stolen_items: 'What was stolen from you?',
  robber_description: 'Can you describe how the robbers looked like?',
  nearest_police_station_incident: 'What is the nearest police station to where the incident occurred?',
  incident_description: 'Please provide a brief description of the entire incident'
};

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [complaintData, setComplaintData] = useState<ComplaintData>({});
  const [collectedFields, setCollectedFields] = useState<Set<string>>(new Set());
  const [currentField, setCurrentField] = useState<string>('name');
  const [isComplete, setIsComplete] = useState(false);
  const [complaintId, setComplaintId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please login to file a complaint",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }
      
      // Initialize conversation
      addBotMessage("Hello! I'm here to help you file a robbery/theft complaint. I'll ask you some questions to gather the necessary information. Let's start with your full name.");
    };
    
    checkAuth();
  }, [navigate, toast]);

  const addBotMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      content,
      type: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      content,
      type: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const extractInformation = (input: string, field: string): string | null => {
    const cleanInput = input.trim();
    
    if (cleanInput.length < 2 || ['ok', 'yes', 'no', 'yeah'].includes(cleanInput.toLowerCase())) {
      return null;
    }

    if (field === 'mobile') {
      const mobileMatch = cleanInput.match(/\b\d{10}\b/);
      return mobileMatch ? mobileMatch[0] : null;
    }
    
    if (field === 'email') {
      const emailMatch = cleanInput.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      return emailMatch ? emailMatch[0] : null;
    }
    
    if (field === 'age') {
      const ageMatch = cleanInput.match(/\b(\d{1,3})\b/);
      if (ageMatch) {
        const age = parseInt(ageMatch[0]);
        return (age >= 1 && age <= 120) ? age.toString() : null;
      }
      return null;
    }

    return cleanInput.length > 2 ? cleanInput : null;
  };

  const getNextField = (): string | null => {
    const fieldKeys = Object.keys(requiredFields);
    for (const field of fieldKeys) {
      if (!collectedFields.has(field)) {
        return field;
      }
    }
    return null;
  };

  const saveComplaint = async (): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const complaintId = `RC${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
      
      const { error } = await supabase.from('complaints').insert({
        complaint_id: complaintId,
        user_id: user.id,
        name: complaintData.name,
        mobile: complaintData.mobile,
        email: complaintData.email,
        age: complaintData.age ? parseInt(complaintData.age.toString()) : null,
        gender: complaintData.gender,
        father_name: complaintData.father_name,
        present_address: complaintData.present_address,
        district: complaintData.district,
        nearest_police_station_home: complaintData.nearest_police_station_home,
        incident_location: complaintData.incident_location,
        stolen_items: complaintData.stolen_items,
        robber_description: complaintData.robber_description,
        nearest_police_station_incident: complaintData.nearest_police_station_incident,
        incident_description: complaintData.incident_description
      });

      if (error) throw error;
      
      return complaintId;
    } catch (error) {
      console.error('Error saving complaint:', error);
      throw new Error('Failed to save complaint to database');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() || isLoading) return;

    const userInput = currentInput.trim();
    setCurrentInput('');
    setIsLoading(true);

    addUserMessage(userInput);

    try {
      if (isComplete) {
        if (userInput.toLowerCase().includes('yes') || userInput.toLowerCase().includes('y')) {
          // Reset for new complaint
          setComplaintData({});
          setCollectedFields(new Set());
          setCurrentField('name');
          setIsComplete(false);
          setComplaintId(null);
          addBotMessage("Let's start with your new complaint. What is your full name?");
        } else {
          addBotMessage("Thank you for using our complaint system. Your complaint has been recorded. You can now close this window or file another complaint.");
        }
        setIsLoading(false);
        return;
      }

      const extractedInfo = extractInformation(userInput, currentField);
      
      if (extractedInfo) {
        // Store the information
        const newComplaintData = { ...complaintData, [currentField]: extractedInfo };
        setComplaintData(newComplaintData);
        
        const newCollectedFields = new Set(collectedFields);
        newCollectedFields.add(currentField);
        setCollectedFields(newCollectedFields);

        const nextField = getNextField();
        
        if (nextField) {
          setCurrentField(nextField);
          // Prevent duplicate bot questions
          const lastBotMsg = messages.filter(m => m.type === 'bot').slice(-1)[0]?.content;
          const nextQuestion = `Thank you. ${requiredFields[nextField as keyof typeof requiredFields]}`;
          if (lastBotMsg !== nextQuestion) {
            addBotMessage(nextQuestion);
          }
        } else {
          // All information collected
          addBotMessage("Thank you! I have collected all the necessary information for your robbery complaint. Let me save this to our records.");
          
          try {
            const savedComplaintId = await saveComplaint();
            setComplaintId(savedComplaintId);
            setIsComplete(true);
            addBotMessage(`Your complaint has been saved successfully with ID: ${savedComplaintId}. Would you like to file another complaint? (yes/no)`);
          } catch (error) {
            addBotMessage("Sorry, there was an error saving your complaint. Please try again or contact support.");
          }
        }
      } else {
        // Information not provided properly
        addBotMessage(`I need this information for the official police report. ${requiredFields[currentField as keyof typeof requiredFields]}`);
      }
    } catch (error) {
      addBotMessage("Sorry, there was an error processing your request. Please try again.");
    }

    setIsLoading(false);
  };

  const progress = (collectedFields.size / Object.keys(requiredFields).length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-police-blue mb-2">
              Robbery/Theft Complaint Assistant
            </h1>
            <p className="text-muted-foreground">
              I'll help you file your complaint by collecting the necessary information step by step.
            </p>
          </div>
          
          {/* Progress Bar */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Progress</CardTitle>
                <Badge variant="outline" className="text-police-blue">
                  {collectedFields.size}/{Object.keys(requiredFields).length} fields
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-police-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-police-blue" />
              FIR Assistant
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4" style={{ maxHeight: 400, overflowY: 'auto' }}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[80%] ${
                        message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <div
                        className={`p-2 rounded-full ${
                          message.type === 'user'
                            ? 'bg-police-blue text-white'
                            : 'bg-police-blue-light text-police-blue'
                        }`}
                      >
                        {message.type === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-police-blue text-white'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-white/70' : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-full bg-police-blue-light text-police-blue">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="px-4 py-2 rounded-lg bg-muted">
                        <p className="text-sm">Typing...</p>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="mt-4 flex space-x-2">
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder={isComplete ? "Type 'yes' to file another complaint or 'no' to finish" : "Type your response..."}
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !currentInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Success Message */}
        {complaintId && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Complaint Filed Successfully!</p>
                  <p className="text-sm">Complaint ID: {complaintId}</p>
                  <p className="text-sm">Please save this ID for future reference.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Chatbot;