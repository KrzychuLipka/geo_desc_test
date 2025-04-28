import requests
import numpy as np
from nltk.translate.bleu_score import sentence_bleu
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

URL = "https://firestore.googleapis.com/v1/projects/geodesctest/databases/(default)/documents/testResults"
response = requests.get(URL)
response_json = response.json()
documents = response_json['documents']
user_test_results = {'deepseek': {'M': [], 'F': []}, 'mistral': {'M': [], 'F': []}}
num_man_tests = 0
num_women_tests = 0
geo_descriptions = [
    {
        'id': 2078,
        'expert_desc': "You are on the basement level, at the end of a spacious laboratory room with two columns in the middle. You are at a double roller gate with a vehicle exit ramp behind it.",
        'generated_desc': "You are currently located in the basement level of a spacious laboratory room. There are two columns in the middle of the room, and you are next to a double roller gate. Behind the gate is an exit ramp for vehicles.",
        'source': "deepseek-r1-distill-llama-8b",
    },
    {
        'id': 2070,
        'expert_desc': "You are at the end of the southwest corridor on the first floor.",
        'generated_desc': "You are at the end of the southwest corridor on the first floor.",
        'source': "human",
    },
    {
        'id': 2065,
        'expert_desc': "You are on the first floor, at the beginning of the northeastern corridor. To enter it, you must go through a fire door.",
        'generated_desc': "You are at the beginning of the north-eastern corridor, located on the first floor. The fire door providing access to this corridor is nearby.",
        'source': "mistral-7b-instruct-v0.3",
    },
    {
        'id': 2057,
        'expert_desc': "You will find yourself on the ground floor, at the end of the north-eastern corridor, at the entrance to the conference room.",
        'generated_desc': "You are on the ground floor, specifically at the end of the northeastern corridor. Notably, you are next to the entrance to the conference room.",
        'source': "mistral-7b-instruct-v0.3",
    },
    {
        'id': 2063,
        'expert_desc': "You are in a small central hall on the first floor, close to the spiral staircase.",
        'generated_desc': "You are in a small central hall on the first floor, close to the spiral staircase.",
        'source': "human",
    },
    {
        'id': 2050,
        'expert_desc': "You are in the corridor before the entrance to the toilets next to the building’s entrance hall.",
        'generated_desc': "You are currently located on the ground floor of a building. You are standing in a corridor before the entrance to the toilets. You are next to the building’s entrance hall.",
        'source': "deepseek-r1-distill-llama-8b",
    }
]

def get_model_key(source): 
    if "deepseek-r1-distill-llama-8b" == source:
        return "deepseek"
    elif "mistral-7b-instruct-v0.3" == source:
        return "mistral"
    else:
        return None

for document in documents:
    results = document['fields']['results']['arrayValue']['values']
    gender = document['fields']['gender']['stringValue']
    if gender == 'M':
        num_man_tests += 1
    elif gender == 'F':
        num_women_tests += 1    
    for i, result in enumerate(results, start=1):
        fields = result['mapValue']['fields']
        accuracy = int(fields['accuracy']['integerValue'])
        naturalness = int(fields['naturalness']['integerValue'])        
        accuracy_0_1 = 1 if accuracy == 1 else 0       
        referenceDescId = int(fields['referenceDescId']['integerValue']) 
        desc_entry = next((desc for desc in geo_descriptions if desc['id'] == referenceDescId), None)
        if not desc_entry:
            continue
        source = desc_entry['source']
        model_key = get_model_key(source)
        if not model_key:
            continue
        user_test_results[model_key][gender].append(
            (referenceDescId, accuracy, accuracy_0_1, naturalness)
        )

def get_user_test_statistics(results):
    accuracies = [result[1] for result in results]
    accuracy_0_1s = [result[2] for result in results]
    naturalnesses = [result[3] for result in results]
    num_tests = len(results)
    return {
        'avg_accuracy': np.mean(accuracies) if num_tests > 0 else float('nan'),
        'avg_accuracy_0_1': np.mean(accuracy_0_1s) if num_tests > 0 else float('nan'),
        'avg_naturalness': np.mean(naturalnesses) if num_tests > 0 else float('nan'),
        'median_accuracy': np.median(accuracies) if num_tests > 0 else float('nan'),
        'median_accuracy_0_1': np.median(accuracy_0_1s) if num_tests > 0 else float('nan'),
        'median_naturalness': np.median(naturalnesses) if num_tests > 0 else float('nan'),
        'std_accuracy': np.std(accuracies) if num_tests > 0 else float('nan'),
        'std_accuracy_0_1': np.std(accuracy_0_1s) if num_tests > 0 else float('nan'),
        'std_naturalness': np.std(naturalnesses) if num_tests > 0 else float('nan'),
    }

user_test_statistics = {
    'deepseek_M': get_user_test_statistics(user_test_results['deepseek']['M']),
    'deepseek_F': get_user_test_statistics(user_test_results['deepseek']['F']),
    'mistral_M': get_user_test_statistics(user_test_results['mistral']['M']),
    'mistral_F': get_user_test_statistics(user_test_results['mistral']['F']),
}

def filter_and_format_stats(stats):
    return {k: float(v) for k, v in stats.items() if isinstance(v, (int, float, np.floating))}

def calculate_sim_statistics(values):
    return {
        'avg': np.mean(values),
        'med': np.median(values),
        'std': np.std(values)
    }

def calculate_cosine_similarity(text1, text2):
    vectorizer = TfidfVectorizer().fit_transform([text1, text2])
    vectors = vectorizer.toarray()
    return cosine_similarity(vectors)[0, 1]

def calculate_bleu(reference, candidate):
    reference_tokens = reference.split()
    candidate_tokens = candidate.split()
    return sentence_bleu([reference_tokens], candidate_tokens)

def print_sim_statistics(source):
    print(f"Source: {source}")
    cos_similarities = []
    bleu_scores = []
    for desc in geo_descriptions:
        if desc['source'] == source:
            print(f"expert_desc: {desc['expert_desc']}")
            print(f"generated_desc: {desc['generated_desc']}")
            cos_sim = calculate_cosine_similarity(desc['expert_desc'], desc['generated_desc'])
            bleu = calculate_bleu(desc['expert_desc'], desc['generated_desc'])
            cos_similarities.append(cos_sim)
            print(f"COS. SIM.: {cos_sim}")
            bleu_scores.append(bleu)
            print(f"BLEU: {bleu}")
    cos_sim_stats = calculate_sim_statistics(cos_similarities)
    bleu_stats = calculate_sim_statistics(bleu_scores)
    print(f"COS. SIM. details:\n{filter_and_format_stats(cos_sim_stats)}")
    print(f"BLEU details:\n{filter_and_format_stats(bleu_stats)}")
    
print(f"*** User test statistics: ***\n\nNumber of tests in the women's group: {num_women_tests}")
print(f"Number of tests in the men's group: {num_man_tests}")

print("  DeepSeek - Male:")
print("   ", filter_and_format_stats(user_test_statistics['deepseek_M']))
print("  DeepSeek - Female:")
print("   ", filter_and_format_stats(user_test_statistics['deepseek_F']))
print("  Mistral - Male:")
print("   ", filter_and_format_stats(user_test_statistics['mistral_M']))
print("  Mistral - Female:")
print("   ", filter_and_format_stats(user_test_statistics['mistral_F']))    
    
print("*** Similarity statistics: ***")    
print_sim_statistics("deepseek-r1-distill-llama-8b")
print_sim_statistics("mistral-7b-instruct-v0.3")