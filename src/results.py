import requests
import numpy as np

URL = "https://firestore.googleapis.com/v1/projects/geodesctest/databases/(default)/documents/testResults"
response = requests.get(URL)
response_json = response.json()
documents = response_json['documents']
geo_desc_results = {i: {'M': [], 'F': []} for i in range(1, 7)}
num_man_tests = 0
num_women_tests = 0

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
        geo_desc_results[i][gender].append((referenceDescId, accuracy, accuracy_0_1, naturalness))

def calculate_statistics(results):
    accuracies = [result[1] for result in results]
    accuracy_0_1s = [result[2] for result in results]
    naturalnesses = [result[3] for result in results]
    num_tests = len(results)
    avg_accuracy = np.mean(accuracies) if num_tests > 0 else float('nan')
    avg_accuracy_0_1 = np.mean(accuracy_0_1s) if num_tests > 0 else float('nan')
    avg_naturalness = np.mean(naturalnesses) if num_tests > 0 else float('nan')
    median_accuracy = np.median(accuracies) if num_tests > 0 else float('nan')
    median_accuracy_0_1 = np.median(accuracy_0_1s) if num_tests > 0 else float('nan')
    median_naturalness = np.median(naturalnesses) if num_tests > 0 else float('nan')
    std_accuracy = np.std(accuracies) if num_tests > 0 else float('nan')
    std_accuracy_0_1 = np.std(accuracy_0_1s) if num_tests > 0 else float('nan')
    std_naturalness = np.std(naturalnesses) if num_tests > 0 else float('nan')
    return {
        'avg_accuracy': avg_accuracy,
        'avg_accuracy_0_1': avg_accuracy_0_1,
        'avg_naturalness': avg_naturalness,
        'median_accuracy': median_accuracy,
        'median_accuracy_0_1': median_accuracy_0_1,
        'median_naturalness': median_naturalness,
        'std_accuracy': std_accuracy,
        'std_accuracy_0_1': std_accuracy_0_1,
        'std_naturalness': std_naturalness
    }

geo_desc_statistics = {i: {'M': calculate_statistics(geo_desc_results[i]['M']),
                           'F': calculate_statistics(geo_desc_results[i]['F'])}
                       for i in range(1, 7)}

print(f"Number of tests in the women's group: {num_women_tests}")
print(f"Number of tests in the men's group: {num_man_tests}\n")
for i in range(1, 7):
    print(f"Geo-description {i} statistics for male testers:")
    print({k: float(v) for k, v in geo_desc_statistics[i]['M'].items()})
    print(f"\nGeo-description {i} statistics for female testers:")
    print({k: float(v) for k, v in geo_desc_statistics[i]['F'].items()})
    print("\n")
