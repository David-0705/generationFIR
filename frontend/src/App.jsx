import React from "react";
// import ChatForm from "./components/ChatForm";
import ChatForm from "./components/chat";

export default function App(){
  return (
    <div className="app">
      <div className="header">
        <div>
          <h1>FIR Chatbot — Voice & Text</h1>
          <div className="small">Fill the FIR step-by-step. Use the mic for voice input.</div>
        </div>
        <div className="small">Connected: Local</div>
      </div>

      <ChatForm />
    </div>
  );
}
