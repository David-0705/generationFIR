import React from "react";
import "../form-styles.css";
// Import the FIR form from your other project
// You may need to adjust import paths and API endpoints for integration
import ChatForm from "../../../frontend/src/components/chat";
// import "../../../frontend/src/styles.css";

const Form: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">FIR Form & Section Prediction</h1>
      <ChatForm />
    </div>
  );
};

export default Form;
