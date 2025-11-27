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

def build_df_raw(metric_key):
    metric_idx = {'accuracy': 1, 'accuracy_0_1': 2, 'naturalness': 3, 'adequacy': 4}[metric_key]
    rows = []
    for model, groups in user_test_results.items():
        for gender_age_key, gvals in groups.items():
            for r in gvals:
                rows.append({
                    "model": model,            # oś Y: model
                    "gender_age": gender_age_key,  # kolor: grupa badana (np. male_21-23)
                    "value": r[metric_idx],    # oś X: wartość metryki
                })
    return pd.DataFrame(rows)

def draw_box_scatter(metric_key, title, max_points=120, palette="Set2"):
    df_raw = build_df_raw(metric_key)

    if df_raw.empty:
        print("Brak danych dla metryki:", metric_key)
        return

    # ========== 1) Zakres osi X ==========
    if metric_key == "accuracy_0_1":
        xmin, xmax = -0.2, 1.2
    else:
        lo, hi = np.percentile(df_raw['value'], [1, 99])
        pad = max(1.0, (hi - lo) * 0.08)
        xmin, xmax = lo - pad, hi + pad

    # ========== 2) Podpróbkowanie punktów ==========
    # df_points = df_raw.sample(max_points, random_state=42) if len(df_raw) > max_points else df_raw.copy()
    df_points = df_raw.copy()

    # ========== 3) Rozmiar punktów ==========
    point_size = 40 if metric_key == "accuracy_0_1" else 80

    # ========== 4) Uporządkowanie osi i kolorów ==========
    model_order = ["deepseek", "mistral", "human"]
    group_order = ["male_21-23", "female_21-23", "male_18-20", "female_18-20"]
    # zachowaj tylko grupy obecne w danych, w ustalonej kolejności
    present_groups = [g for g in group_order if g in df_points['gender_age'].unique()]
    # jeśli jakieś grupy mają inne etykiety (np. 'M_21-23'), dodaj dynamicznie
    for g in sorted(df_points['gender_age'].unique()):
        if g not in present_groups:
            present_groups.append(g)

    # paleta i mapowanie kolorów na grupy
    palette_colors = sns.color_palette(palette, max(len(present_groups), 3))
    group_to_color = dict(zip(present_groups, palette_colors))

    plt.figure(figsize=(13, 6))

    # BOXPLOT (bez hue — pokazuje rozkład całej próbki dla modelu)
    sns.boxplot(
        data=df_raw,
        y="model",
        x="value",
        order=model_order,
        orient="h",
        width=0.5,
        fliersize=0,
        showcaps=True,
        boxprops={'alpha': 0.25},
        whiskerprops={'alpha': 0.5},
        medianprops={'color': 'black', 'linewidth': 1.5}
    )

    # STRIP / DOTS (kolor = grupa badana)
    sns.stripplot(
       data=df_points,
       y="model",
       x="value",
       order=model_order,
       hue="gender_age",
       hue_order=present_groups,
       palette=group_to_color,
       orient="h",
       size=np.sqrt(point_size),
       alpha=0.85,
       jitter=0.35,
       dodge=False,
       linewidth=0.5,
       edgecolor='gray'
    )

    # STRIP / DOTS (kolor = grupa badana)
    # sns.stripplot(
    #     data=df_points,
    #     y="model",
    #     x="value",
    #     order=model_order,
    #     hue="gender_age",
    #     hue_order=present_groups,
    #     palette=group_to_color,
    #     orient="h",
    #     size=np.sqrt(point_size),
    #     alpha=0.85,
    #     jitter=0.35,
    #     dodge=False,
    #     linewidth=0.5,
    #     edgecolor='gray'
    # )

    # Tytuły i osie
    plt.title(title, fontsize=16, fontweight='bold')
    plt.xlabel(f"{metric_key}", fontsize=13)
    # if metric_key == "accuracy_0_1":
    #     plt.xlabel("Poziom trafności z uwzględnieniem tylko pierwszego trafienia (accuracy_0_1))", fontsize=13)
    # elif metric_key == "accuracy":
    #     plt.xlabel("Poziom trafności z uwzględnieniem wszystkich trafień (accuracy)", fontsize=13)
    # elif metric_key == "naturalness":
    #     plt.xlabel("Poziom naturalności geo-opisu (naturalness)", fontsize=13)
    # elif metric_key == "adequacy":
    #     plt.xlabel("Poziom adekwatności geo-opisu (adequacy)", fontsize=13)
    # else:
    #     plt.xlabel(f"Nieznana metryka", fontsize=13)
    plt.ylabel("Model", fontsize=13)
    plt.xlim(xmin, xmax)
    plt.grid(axis='x', linestyle=':', alpha=0.4)

    # Czytelniejsze ticki na osi X
    try:
        ticks = np.linspace(xmin, xmax, num=11)
        plt.xticks(ticks)
    except Exception:
        pass

    # Liczba punktów przy każdym modelu
    for i, m in enumerate(model_order):
        count = df_raw[df_raw['model'] == m].shape[0]
        plt.text(xmax, i, f'n={count}', va='center', ha='left', fontsize=10, color='gray')

    # Legenda po prawej u góry — ręcznie budowana z mapowania grup -> kolor
    legend_handles = [
        plt.Line2D([0], [0], marker='o', linestyle='',
                   markerfacecolor=group_to_color[g], markeredgecolor='gray',
                   markersize=8, label=g)
        for g in present_groups
    ]
    plt.legend(
        handles=legend_handles,
        title="Grupa badana",
        bbox_to_anchor=(1.06, 1.0),
        loc='upper left',
        frameon=True,
        fontsize=11
    )

    plt.tight_layout()
    plt.show()

# Przykłady wywołania:
draw_box_scatter("accuracy", "Poziom trafności (z uwzględnieniem wszystkich prób)")
draw_box_scatter("accuracy_0_1", "Poziom trafności (z uwzględnieniem tylko pierwszego wyboru)")
draw_box_scatter("adequacy", "Poziom adekwatności")
draw_box_scatter("naturalness", "Poziom naturalności")