import sys
import json
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

MODEL_PATH = "bns_multi_label_model"  # adjust if needed

# Load model and tokenizer
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)

# Section labels (example, replace with actual labels)
SECTION_LABELS = [
    "IPC 302", "IPC 376", "IPC 420", "IPC 498A", "IPC 307", "IPC 323", "IPC 341", "IPC 354", "IPC 379", "IPC 506"
]


def predict_sections(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.sigmoid(logits).squeeze().cpu().numpy()
    threshold = 0.5
    predicted = [SECTION_LABELS[i] for i, p in enumerate(probs) if p > threshold]
    return predicted


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input text provided"}))
        sys.exit(1)
    text = sys.argv[1]
    try:
        sections = predict_sections(text)
        print(json.dumps({"sections": sections}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
