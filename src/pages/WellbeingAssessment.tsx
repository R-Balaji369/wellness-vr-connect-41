
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// Initialize the Gemini API with your API key
// Note: In a production environment, this should be stored securely
const genAI = new GoogleGenerativeAI("AIzaSyD3kmkmribUP88DthwYt-o1Syvcc9m35pM");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const WellbeingAssessment: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentSummary, setAssessmentSummary] = useState("");
  const [chatSession, setChatSession] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize chat session when component mounts
  useEffect(() => {
    const initChat = async () => {
      try {
        const session = model.startChat({
          generationConfig: {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
          },
          history: [
            {
              role: "user",
              parts: [
                {
                  text: "you are an chat bot of an app called Serapisuto your duty is to ask some questions regarding mental health like how is your sleep, are you distracted and are you facing any other issue.\nthen after you have to analyze and tell the patent that he needs therapy or he can proceed with free treatment like self treatment or you have to book the session for treatment.\nyou have to communicate friendly with the patent\n",
                },
              ],
            },
            {
              role: "model",
              parts: [
                {
                  text: "Hi there! 👋 Welcome to Serapisuto! I'm here to help you check in with your overall well-being today.\n\nFirst, are you feeling physically okay? 👍 Are you experiencing any pain or physical discomfort? 🤔 Once we've touched on that, we can move on to checking in with your mental well-being. How are you feeling generally? 😊",
                },
              ],
            },
          ],
        });
        setChatSession(session);

        // Set initial welcome message
        setMessages([
          {
            role: "assistant",
            content: "Hi there! 👋 Welcome to Serapisuto! I'm here to help you check in with your overall well-being today.\n\nFirst, are you feeling physically okay? 👍 Are you experiencing any pain or physical discomfort? 🤔 Once we've touched on that, we can move on to checking in with your mental well-being. How are you feeling generally? 😊",
          },
        ]);
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        toast({
          title: "Error",
          description: "Failed to initialize the assessment chat. Please try again.",
          variant: "destructive",
        });
      }
    };

    initChat();
  }, [toast]);

  // Auto-scroll to the bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !chatSession) return;

    // Add user message
    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send message to Gemini API
      const result = await chatSession.sendMessage(input.trim());
      const botResponse = {
        role: "assistant" as const,
        content: result.response.text(),
      };
      
      setMessages((prev) => [...prev, botResponse]);

      // After a few exchanges, consider the assessment complete
      if (messages.length > 5) {
        setAssessmentComplete(true);
        generateSummary();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSummary = () => {
    // In a real implementation, this would analyze the conversation
    // For now, we'll create a simulated summary
    const userName = localStorage.getItem("userName") || "User";
    const summary = `
      Based on our conversation with ${userName}, we've identified some key areas for attention:
      
      • Sleep quality appears to be affected by stress
      • Concentration and focus challenges are present
      • Mood fluctuations suggest potential for improvement
      • Energy levels are inconsistent throughout the day
      
      Recommended approach: A combination of AR/VR therapy with aromatherapy targeting stress reduction and improved focus. Music therapy sessions focusing on delta wave patterns for improved sleep quality are also advised.
      
      This holistic approach should address both the physical and mental aspects of wellbeing, with benefits expected within 2-3 sessions.
    `;
    
    setAssessmentSummary(summary);
    localStorage.setItem("wellbeingAssessment", summary);
  };

  const handleComplete = () => {
    toast({
      title: "Assessment Complete",
      description: "Thank you for completing your wellbeing assessment.",
    });
    navigate("/");
  };

  const handleSelfAssisted = () => {
    navigate("/blog");
  };

  const handleBookSession = () => {
    navigate("/booking");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-wellness-50 pt-4 pb-16 px-4">
      <div className="max-w-2xl mx-auto mt-8">
        <h1 className="text-2xl font-bold text-wellness-800 mb-6 text-center">
          Serapisuto Assessment Guide
        </h1>
        
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="h-[60vh] overflow-y-auto p-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    message.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === "user"
                        ? "bg-wellness-500 text-white"
                        : "bg-gray-100 text-wellness-800"
                    }`}
                  >
                    {message.content.split("\n").map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < message.content.split("\n").length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>
        
        {assessmentComplete ? (
          <div className="text-center space-y-4">
            <Button 
              onClick={handleComplete} 
              className="bg-wellness-500 hover:bg-wellness-600"
            >
              Complete Assessment
            </Button>
            <div className="flex justify-center space-x-4 mt-4">
              <Button 
                onClick={handleSelfAssisted} 
                variant="outline"
                className="border-wellness-500 text-wellness-600 hover:bg-wellness-50"
              >
                Self Assisted
              </Button>
              <Button 
                onClick={handleBookSession} 
                className="bg-wellness-500 hover:bg-wellness-600"
              >
                Book a Session
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex space-x-2 mb-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isLoading}
                className="flex-grow"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading}
                className="bg-wellness-500 hover:bg-wellness-600"
              >
                Send
              </Button>
            </div>
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={handleSelfAssisted} 
                variant="outline"
                className="border-wellness-500 text-wellness-600 hover:bg-wellness-50"
              >
                Self Assisted
              </Button>
              <Button 
                onClick={handleBookSession} 
                className="bg-wellness-500 hover:bg-wellness-600"
              >
                Book a Session
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WellbeingAssessment;
