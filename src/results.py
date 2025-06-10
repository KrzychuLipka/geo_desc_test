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
    'mistral': {}
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
    group_key = map_age_to_group(age)
    if group_key is None:
        continue
    gender_group_key = f"{gender}_{group_key}"
    num_tests_by_gender_age[gender_group_key] = num_tests_by_gender_age.get(gender_group_key, 0) + 1
    results = document['fields']['results']['arrayValue']['values']

    for result in results:
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
        if gender_group_key not in user_test_results[model_key]:
            user_test_results[model_key][gender_group_key] = []
        user_test_results[model_key][gender_group_key].append((referenceDescId, accuracy, accuracy_0_1, naturalness))

def get_user_test_statistics(results):
    accuracies = [r[1] for r in results]
    accuracy_0_1s = [r[2] for r in results]
    naturalnesses = [r[3] for r in results]
    return {
        'avg_accuracy': np.mean(accuracies),
        'avg_accuracy_0_1': np.mean(accuracy_0_1s),
        'median_accuracy': np.median(accuracies),
        'median_accuracy_0_1': np.median(accuracy_0_1s),
        'avg_naturalness': np.mean(naturalnesses),
        'median_naturalness': np.median(naturalnesses)
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

desc_scores = {}  # {id: (sum_accuracy, aum_accuracy_01, sum_naturalness, count)}
for model in user_test_results:
    for group in user_test_results[model]:
        for (desc_id, acc, _, nat) in user_test_results[model][group]:
            if desc_id not in desc_scores:
                desc_scores[desc_id] = [0, 0, 0]
            desc_scores[desc_id][0] += acc
            desc_scores[desc_id][1] += nat
            desc_scores[desc_id][2] += 1

ranking = []
for desc_id, (acc_sum, nat_sum, count) in desc_scores.items():
    avg_acc = acc_sum / count
    avg_nat = nat_sum / count
    score = (avg_acc + avg_nat) / 2
    ranking.append((desc_id, avg_acc, avg_nat, score))

ranking.sort(key=lambda x: x[3], reverse=True)

print("\n===== GEO-DESCRIPTIONS RANKING (by accuracy + naturalness) =====\n")
for rank, (desc_id, acc, nat, score) in enumerate(ranking, 1):
    print(f"{rank}. Geo-description ID: {desc_id} | Average accuracy: {acc:.2f} | Average naturalness: {nat:.2f} | Score: {score:.2f}")

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

plot_user_test_statistics("Accuracy test results", accuracy_stats_categories)
plot_user_test_statistics("Naturalness test results", naturalness_stats_categories)
