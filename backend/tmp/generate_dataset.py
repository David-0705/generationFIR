import json
import uuid
import random
from datetime import datetime, timedelta
from typing import List, Dict
import jsonlines

# Load BNS sections data
with open('bns_sections.json', 'r', encoding='utf-8') as f:
    bns_sections = json.load(f)


# Sample complaint templates for different languages and styles
COMPLAINT_TEMPLATES = {
    'theft': {
        'en': [
            "My {item} was stolen from {location} on {date}. The thief broke into my {place} and took my belongings.",
            "Someone stole my {item} from {location}. I noticed it missing when I returned home.",
            "Theft occurred at {location}. My {item} worth Rs. {amount} was taken without permission."
        ],
        'hi': [
            "मेरा {item} {location} से {date} को चोरी हो गया। चोर ने मेरे {place} में घुसकर सामान चुराया।",
            "किसी ने मेरा {item} {location} से चुराया है। जब मैं घर वापस आया तो पता चला।"
        ],
        'mr': [
            "माझा {item} {location} मधून {date} रोजी चोरी झाला. चोराने माझ्या {place} मध्ये घुसून सामान चोरले.",
            "कोणीतरी माझा {item} {location} मधून चोरला आहे. मी घरी परतल्यावर लक्षात आले.",
            "{location} येथे चोरी झाली. माझा {item} किंमत रु. {amount} परवानगीशिवाय नेला गेला."
        ]
    },
    'assault': {
        'en': [
            "I was physically assaulted by {person} at {location} on {date}. They hit me with {weapon}.",
            "Someone attacked me near {location}. I sustained injuries and need medical attention.",
            "Physical violence occurred when {person} assaulted me during an argument."
        ],
        'hi': [
            "{person} ने मुझे {location} पर {date} को मारा। उन्होंने मुझे {weapon} से हमला किया।",
            "किसी ने {location} के पास मुझ पर हमला किया। मुझे चोटें आई हैं।"
        ],
        'mr': [
            "{person} ने माझ्यावर {date} रोजी {location} येथे हल्ला केला. त्याने {weapon} ने मारले.",
            "{location} जवळ कोणीतरी माझ्यावर हल्ला केला. मला इजा झाली आहे.",
            "वादाच्या वेळी {person} ने माझ्यावर शारीरिक हल्ला केला."
        ]
    },
    'fraud': {
        'en': [
            "I was cheated by {person} who took Rs. {amount} promising {service} but never delivered.",
            "Online fraud occurred when someone used my card details to make unauthorized purchases.",
            "Investment fraud - {person} promised high returns but disappeared with my money."
        ],
        'hi': [
            "{person} ने मुझे {amount} रुपये लेकर {service} का वादा किया लेकिन धोखा दिया।",
            "ऑनलाइन धोखाधड़ी हुई जब किसी ने मेरे कार्ड की जानकारी का गलत इस्तेमाल किया।"
        ],
        'mr': [
            "{person} ने मला {amount} रुपये घेऊन {service} चे आश्वासन दिले पण फसवणूक केली.",
            "ऑनलाइन फसवणूक झाली जेव्हा कोणीतरी माझ्या कार्डाची माहिती चुकीच्या पद्धतीने वापरली.",
            "गुंतवणूक फसवणूक - {person} ने जास्त परतावा देण्याचे सांगितले पण पैसे घेऊन गायब झाला."
        ]
    },
    'murder': {
        'en': [
            "{person} killed my relative with {weapon} at {location} on {date}.",
            "A murder occurred at {location}. {person} attacked my family member with {weapon}."
        ],
        'hi': [
            "{person} ने मेरे रिश्तेदार को {date} को {location} पर {weapon} से मार डाला।",
            "{location} पर हत्या हुई। {person} ने मेरे परिवार के सदस्य पर {weapon} से हमला किया।"
        ],
        'mr': [
            "{person} ने माझ्या नातेवाईकाला {date} रोजी {location} येथे {weapon} ने ठार मारले.",
            "{location} येथे खून झाला. {person} ने माझ्या कुटुंबाच्या सदस्यावर {weapon} ने हल्ला केला."
        ]
    },
    'kidnapping': {
        'en': [
            "My child was kidnapped by {person} from {location} on {date}.",
            "{person} abducted my relative from {location} yesterday."
        ],
        'hi': [
            "मेरा बच्चा {date} को {location} से {person} द्वारा अगवा कर लिया गया।",
            "{person} ने {location} से मेरे रिश्तेदार का अपहरण कर लिया।"
        ],
        'mr': [
            "माझे मूल {date} रोजी {location} मधून {person} ने पळवून नेले.",
            "{person} ने {location} मधून माझ्या नातेवाईकाचे अपहरण केले."
        ]
    },
    'rape': {
        'en': [
            "{person} forcibly assaulted me at {location} on {date}.",
            "A sexual offense occurred when {person} attacked me at {location}."
        ],
        'hi': [
            "{person} ने {date} को {location} पर मेरे साथ जबरदस्ती की।",
            "{location} पर {person} ने मेरे साथ यौन हमला किया।"
        ],
        'mr': [
            "{person} ने {date} रोजी {location} येथे माझ्यावर जबरदस्ती केली.",
            "{location} येथे {person} ने माझ्यावर लैंगिक हल्ला केला."
        ]
    },
    'dowry': {
        'en': [
            "My in-laws are demanding Rs. {amount} as dowry and harassing me.",
            "Dowry harassment is happening - my husband’s family is forcing me for {amount}."
        ],
        'hi': [
            "मेरे ससुराल वाले {amount} रुपये दहेज की मांग कर रहे हैं और मुझे परेशान कर रहे हैं।",
            "दहेज उत्पीड़न हो रहा है - मेरे पति का परिवार मुझसे {amount} की मांग कर रहा है।"
        ],
        'mr': [
            "माझे सासरचे लोक {amount} रुपये हुंडा मागत आहेत आणि मला त्रास देत आहेत.",
            "हुंडा छळ होत आहे - माझ्या नवऱ्याचे कुटुंब माझ्याकडून {amount} ची मागणी करत आहे."
        ]
    },
    'trespass': {
        'en': [
            "{person} entered my {place} without permission and caused damage.",
            "Unauthorized entry by {person} at my {place}, they damaged property."
        ],
        'hi': [
            "{person} बिना अनुमति के मेरे {place} में घुस आया और नुकसान किया।",
            "मेरे {place} में {person} ने अवैध प्रवेश कर संपत्ति को नुकसान पहुंचाया।"
        ],
        'mr': [
            "{person} माझ्या {place} मध्ये परवानगीशिवाय शिरला आणि नुकसान केले.",
            "{person} ने माझ्या {place} मध्ये बेकायदेशीर प्रवेश करून मालमत्तेचे नुकसान केले."
        ]
    },
    'corruption': {
        'en': [
            "{person} demanded Rs. {amount} bribe for providing {service}.",
            "Corruption case: {person} asked me to pay bribe of Rs. {amount}."
        ],
        'hi': [
            "{person} ने {service} देने के लिए {amount} रुपये रिश्वत की मांग की।",
            "भ्रष्टाचार का मामला: {person} ने मुझसे {amount} रुपये रिश्वत मांगी।"
        ],
        'mr': [
            "{person} ने {service} साठी {amount} रुपये लाच मागितली.",
            "भ्रष्टाचाराचा प्रकार: {person} ने माझ्याकडून {amount} रुपये लाच मागितली."
        ]
    },
    'other': {
        'en': [
            "A complaint regarding {title} occurred at {location}.",
            "Incident related to {title} happened at {location}."
        ],
        'hi': [
            "{title} से संबंधित शिकायत {location} पर हुई।",
            "{location} पर {title} से जुड़ी घटना हुई।"
        ],
        'mr': [
            "{title} संदर्भात तक्रार {location} येथे झाली.",
            "{location} येथे {title} संबंधी घटना घडली."
        ]
    }
}

LOCATIONS = ["home", "office", "market", "street", "park", "shop", "restaurant", "bus stop"]
ITEMS = ["mobile phone", "wallet", "laptop", "jewelry", "bike", "car", "money", "documents"]
PERSONS = ["unknown person", "neighbor", "colleague", "stranger", "acquaintance"]
WEAPONS = ["stick", "knife", "stone", "fist", "rod"]

def generate_complaint_text(section_data: Dict, language: str = 'en') -> str:
    """Generate realistic complaint text based on BNS section"""
    title = section_data['title'].lower()
    
    # Map BNS sections to complaint types
    if any(word in title for word in ['theft', 'stealing']):
        complaint_type = 'theft'
    elif any(word in title for word in ['assault', 'hurt', 'violence', 'grievous']):
        complaint_type = 'assault'
    elif any(word in title for word in ['cheating', 'fraud']):
        complaint_type = 'fraud'
    elif any(word in title for word in ['murder', 'homicide', 'kill']):
        complaint_type = 'murder'
    elif any(word in title for word in ['kidnap', 'abduct']):
        complaint_type = 'kidnapping'
    elif any(word in title for word in ['rape', 'sexual', 'outraging']):
        complaint_type = 'rape'
    elif any(word in title for word in ['dowry', 'cruelty']):
        complaint_type = 'dowry'
    elif any(word in title for word in ['trespass', 'housebreaking']):
        complaint_type = 'trespass'
    elif any(word in title for word in ['bribery', 'corruption']):
        complaint_type = 'corruption'
    else:
        complaint_type = 'other'  # ✅ use other category instead of theft
    
    if complaint_type in COMPLAINT_TEMPLATES and language in COMPLAINT_TEMPLATES[complaint_type]:
        template = random.choice(COMPLAINT_TEMPLATES[complaint_type][language])
        
        # Fill template with random values
        complaint = template.format(
            item=random.choice(ITEMS),
            location=random.choice(LOCATIONS),
            date=datetime.now().strftime("%Y-%m-%d"),
            place="house" if language == 'en' else "घर",
            amount=random.randint(1000, 50000),
            person=random.choice(PERSONS),
            weapon=random.choice(WEAPONS),
            service="investment advice" if language == 'en' else ("निवेश सलाह" if language == 'hi' else "गुंतवणूक सल्ला"),
            title=section_data['title']
        )
        
        # Add some variation and typos for realism
        if random.random() < 0.1:  # 10% chance of typos
            complaint = complaint.replace("the", "teh").replace("and", "nd")
        
        return complaint
    
    return f"Complaint related to {title} occurred at {random.choice(LOCATIONS)}."

def generate_keywords(complaint_text: str, section_data: Dict) -> List[str]:
    """Extract relevant keywords from complaint and section"""
    keywords = []
    
    # Add words from section title
    title_words = section_data['title'].lower().split()
    keywords.extend([word for word in title_words if len(word) > 3])
    
    # Add common legal terms
    legal_terms = ['complaint', 'incident', 'occurred', 'person', 'property', 'offense']
    keywords.extend(legal_terms)
    
    return list(set(keywords))[:10]  # Limit to 10 keywords

def generate_dataset(num_samples: int = 25000) -> None:
    """Generate labeled dataset for training"""
    
    # Select top 50 BNS sections for classification
    top_sections = bns_sections[:50]
    
    dataset = []
    languages = ['en', 'hi', 'mr']
    
    for i in range(num_samples):
        # Select random section
        section = random.choice(top_sections)
        language = random.choice(languages)
        
        # Generate complaint text
        complaint_text = generate_complaint_text(section, language)
        
        # Generate keywords
        keywords = generate_keywords(complaint_text, section)
        
        # Create dataset entry
        entry = {
            "id": str(uuid.uuid4()),
            "complaint_text": complaint_text,
            "language": language,
            "keywords": keywords,
            "bns_section": section['section_number'],
            "bns_title": section['title'],
            "created_at": (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat()
        }
        
        dataset.append(entry)
        
        if (i + 1) % 5000 == 0:
            print(f"Generated {i + 1} samples...")
    
    # Save dataset
    with jsonlines.open('training_dataset.jsonl', 'w') as writer:
        for entry in dataset:
            writer.write(entry)
    
    print(f"Dataset generation complete! Generated {num_samples} samples.")
    print(f"Saved to: data/training_dataset.jsonl")

if __name__ == "__main__":
    generate_dataset(25000)
