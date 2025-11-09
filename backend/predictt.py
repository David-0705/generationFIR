import torch
import torch.nn as nn
from transformers import BertTokenizer, BertModel
import pickle
import json
import sys
import warnings
warnings.filterwarnings("ignore")

# ============================
# 1. Configuration
# ============================
MODEL_PATH = "model/enhanced_legal_bert_model.pth"
LABEL_ENCODER_PATH = "model/enhanced_label_encoder.pkl"
MAPPINGS_PATH = "model/enhanced_mappings.pkl"
MAX_LENGTH = 192
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ============================
# 2. Load resources
# ============================

import sys
sys.stderr.write("Loading tokenizer...\n")
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

sys.stderr.write("Loading label encoder and mappings...\n")
with open(LABEL_ENCODER_PATH, "rb") as f:
    label_encoder = pickle.load(f)

with open(MAPPINGS_PATH, "rb") as f:
    mappings = pickle.load(f)

label_to_section = mappings["label_to_section"]
section_to_title = mappings["section_to_title"]

num_classes = len(label_encoder.classes_)

# ============================
# 3. Model Definition (same as training)
# ============================
class EnhancedBERTLegalClassifier(nn.Module):
    def __init__(self, num_classes, dropout=0.3):
        super(EnhancedBERTLegalClassifier, self).__init__()
        self.bert = BertModel.from_pretrained("bert-base-uncased")
        self.dropout1 = nn.Dropout(dropout)
        self.fc1 = nn.Linear(self.bert.config.hidden_size, 512)
        self.relu = nn.ReLU()
        self.dropout2 = nn.Dropout(dropout)
        self.classifier = nn.Linear(512, num_classes)

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.pooler_output
        x = self.dropout1(pooled_output)
        x = self.fc1(x)
        x = self.relu(x)
        x = self.dropout2(x)
        logits = self.classifier(x)
        return logits


# ============================
# 4. Load model
# ============================
sys.stderr.write("Loading model weights...\n")
model = EnhancedBERTLegalClassifier(num_classes=num_classes)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model = model.to(DEVICE)
model.eval()
sys.stderr.write("Model loaded successfully!\n")

# ============================
# 5. Prediction function
# ============================
def predict_legal_section(text, model, tokenizer, device, top_k=3, temperature=1.5):
    text = text.lower().strip()
    encoding = tokenizer(
        text,
        truncation=True,
        padding="max_length",
        max_length=MAX_LENGTH,
        return_tensors="pt"
    )
    input_ids = encoding["input_ids"].to(device)
    attention_mask = encoding["attention_mask"].to(device)

    with torch.no_grad():
        outputs = model(input_ids, attention_mask)
        probabilities = torch.nn.functional.softmax(outputs / temperature, dim=1)
        top_probs, top_indices = torch.topk(probabilities, k=top_k)

    predictions = []
    for i in range(top_k):
        label = top_indices[0][i].item()
        prob = top_probs[0][i].item()
        section = label_to_section.get(label, label)
        title = section_to_title.get(section, "Unknown")
        predictions.append({
            "section": section,
            "title": title,
            "probability": round(prob * 100, 2)
        })

    return predictions


# ============================
# 6. Run interactively or via CLI
# ============================

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Called from backend: output JSON for API
        complaint_text = " ".join(sys.argv[1:])
        preds = predict_legal_section(complaint_text, model, tokenizer, DEVICE)
        print(json.dumps({"sections": preds}))
    else:
        # Interactive mode for CLI
        complaint_text = input("\nEnter your legal complaint text: ")
        preds = predict_legal_section(complaint_text, model, tokenizer, DEVICE)
        print("\nTop Predictions:")
        for i, p in enumerate(preds, 1):
            print(f"{i}. Section {p['section']}: {p['title']}")
            print(f"   Confidence: {p['probability']:.2f}%")
        print("\nPrediction complete.")
