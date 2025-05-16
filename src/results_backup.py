from datetime import datetime
import requests
import json
from collections import defaultdict

URL = "https://firestore.googleapis.com/v1/projects/geodesctest/databases/(default)/documents/testResults"
response = requests.get(URL)
response_json = response.json()
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
filename = f"test_results_{timestamp}.json"
with open(filename, "w", encoding="utf-8") as file:
    json.dump(response_json, file, ensure_ascii=False, indent=4)
print(f"Test results saved into {filename} file.")

grouped_by_date = defaultdict(lambda: {"M": 0, "F": 0})

for doc in response_json.get("documents", []):
    fields = doc.get("fields", {})
    gender = fields.get("gender", {}).get("stringValue", None)
    create_time = doc.get("createTime", None)
    if create_time and gender in ["M", "F"]:
        date_key = create_time.split("T")[0]
        grouped_by_date[date_key][gender] += 1

for date, gender_counts in sorted(grouped_by_date.items()):
    print(f"Day: {date}")
    print(f"Number of womens: {gender_counts['F']}")
    print(f"Number of mens: {gender_counts['M']}")
    print("-" * 40)
