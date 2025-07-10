from scipy.stats import pearsonr
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
import requests

URL = "https://firestore.googleapis.com/v1/projects/geodesctest/databases/(default)/documents/testResults"
response = requests.get(URL)
response_json = response.json()
documents = response_json['documents']
user_test_results = {
    'deepseek': {},
    'mistral': {},
    'human': {}
}
num_tests_by_gender_age = {}
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
    elif "human" == source:
        return source
    else:
        return None
    
def map_age_to_group(age):
    age = int(age)
    if age > 23 or age < 18:
        return None
    elif age <= 20:
        return "18-20"
    else:
        return "21-23"    
    
for document in documents:
    gender = document['fields']['gender']['stringValue']
    age = document['fields']['age']['integerValue']
    spatialOrientationLevel = document['fields']['spatialOrientationLevel']['integerValue']# Jak użytkownik ocenia swoją orientację w budynku (w skali od 1 do 3)
    group_key = map_age_to_group(age)
    if group_key is None:
        continue
    gender_group_key = f"{gender}_{group_key}"
    num_tests_by_gender_age[gender_group_key] = num_tests_by_gender_age.get(gender_group_key, 0) + 1
    results = document['fields']['results']['arrayValue']['values']

    for result in results:
        fields = result['mapValue']['fields']
        referenceDescId = int(fields['referenceDescId']['integerValue']) 
        desc_entry = next((desc for desc in geo_descriptions if desc['id'] == referenceDescId), None)
        if not desc_entry:
            continue
        accuracy = int(fields['accuracy']['integerValue'])
        naturalness = int(fields['naturalness']['integerValue'])        
        adequacy = int(fields['adequacy']['integerValue'])# Jak dobrze (w skali od 1 do 3) geo-opis opisuje przestrzeń w opini użytkownika
        accuracy_0_1 = 1 if accuracy == 1 else 0       
        source = desc_entry['source']
        model_key = get_model_key(source)
        if not model_key:
            continue
        if gender_group_key not in user_test_results[model_key]:
            user_test_results[model_key][gender_group_key] = []
        user_test_results[model_key][gender_group_key].append((referenceDescId, accuracy, accuracy_0_1, naturalness, adequacy))

def get_user_test_statistics(results):
    accuracies = [r[1] for r in results]
    accuracy_0_1s = [r[2] for r in results]
    naturalnesses = [r[3] for r in results]
    adequacys = [r[4] for r in results]
    return {
        'avg_accuracy': np.mean(accuracies),
        'avg_accuracy_0_1': np.mean(accuracy_0_1s),
        'avg_naturalness': np.mean(naturalnesses),
        'avg_adequacy': np.mean(adequacys),
        'median_naturalness': np.median(naturalnesses),
        'median_accuracy': np.median(accuracies),
        'median_accuracy_0_1': np.median(accuracy_0_1s),
        'median_adequacy': np.median(adequacys),
    }

user_test_statistics = {}
for model in user_test_results:
    for gender_age_key in user_test_results[model]:
        key = f"{model}_{gender_age_key}"
        user_test_statistics[key] = get_user_test_statistics(user_test_results[model][gender_age_key])

print("\n===== STATISTICAL DATA ANALYSIS =====\n")
total_tests = sum(num_tests_by_gender_age.values())
print(f"Total number of tests: {total_tests}\n")
for key, stats in user_test_statistics.items():
    model, gender, age = key.split('_')
    gender_age_key = f"{gender}_{age}"
    print(f"[{key}] Number of tests: {num_tests_by_gender_age.get(gender_age_key, 0)}")
    for metric, val in stats.items():
        print(f"  {metric}: {val:.2f}")
    print()

def plot_user_test_statistics(title, categories):
    data, labels = [], []
    for key, stats in user_test_statistics.items():
        for cat in categories:
            if cat in stats:
                data.append(stats[cat])
                labels.append((key, cat))

    df = pd.DataFrame({
        'Group': [label[0] for label in labels],
        'Metric': [label[1] for label in labels],
        'Value': data
    })

    plt.figure(figsize=(14, 6))
    sns.barplot(data=df, x="Metric", y="Value", hue="Group")
    plt.title(f"{title}")
    plt.legend(title="Model + Gender_Age", loc="center left", bbox_to_anchor=(1, 0.5))
    plt.tight_layout()
    plt.show()

naturalness_stats_categories = ['avg_naturalness', 'median_naturalness']
accuracy_stats_categories = ['avg_accuracy', 'avg_accuracy_0_1', 'median_accuracy', 'median_accuracy_0_1']
adequacy_stats_categories = ['avg_adequacy', 'median_adequacy']

plot_user_test_statistics("Accuracy test results", accuracy_stats_categories)
plot_user_test_statistics("Naturalness test results", naturalness_stats_categories)
plot_user_test_statistics("Adequacy test results", adequacy_stats_categories)

accuracy_vals = []
adequacy_vals = []

for model_results in user_test_results.values():
    for group_results in model_results.values():
        for _, accuracy, _, _, adequacy in group_results:
            accuracy_vals.append(accuracy)
            adequacy_vals.append(adequacy)

corr, _ = pearsonr(accuracy_vals, adequacy_vals)
print(f"Korelacja między accuracy a adequacy: {corr:.2f}")
