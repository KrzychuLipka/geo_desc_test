from sklearn.metrics.pairwise import cosine_similarity
from nltk.translate.bleu_score import sentence_bleu
from comet import download_model, load_from_checkpoint
from sentence_transformers import SentenceTransformer
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

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

print("⏬ SentenceTransformer loading...")
semantic_model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

def calculate_semantic_similarity(text1, text2):
    embeddings = semantic_model.encode([text1, text2])
    return cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]

def calculate_bleu(reference, candidate):
    reference_tokens = reference.split()
    candidate_tokens = candidate.split()
    return sentence_bleu([reference_tokens], candidate_tokens)

print("⏬ COMET loading...")
model_path = download_model("Unbabel/wmt22-comet-da")
comet_model = load_from_checkpoint(model_path)

def calculate_comet_score(reference, hypothesis):
    data = [{"src": "", "ref": reference, "mt": hypothesis}]
    score = comet_model.predict(data, batch_size=8, gpus=0)
    return score[0]

def calculate_sim_statistics(values):
    return {
        'avg': np.mean(values),
        'med': np.median(values),
        'std': np.std(values)
    }

def print_score_summary(name, scores):
    stats = calculate_sim_statistics(scores)
    print(f"\n📌 {name}:\n  ➤ Average: {stats['avg']:.3f}\n  ➤ Median: {stats['med']:.3f}\n  ➤ Standard deviation: {stats['std']:.3f}")
    
    avg = stats['avg']
    
    if "cosine" in name.lower():
        if avg > 0.85:
            print("  ✅ Opisy są bardzo zbliżone do referencyjnych.")
        elif avg > 0.65:
            print("  ⚠️ Umiarkowana jakość — część opisów może być niedokładna.")
        else:
            print("  ❌ Jakość opisów niska — warto zweryfikować lub poprawić model.")
    
    elif "bleu" in name.lower():
        if avg > 0.6:
            print("  ✅ Bardzo wysoka zgodność leksykalna.")
        elif avg > 0.4:
            print("  ⚠️ Umiarkowana zgodność — możliwe parafrazy lub synonimy.")
        else:
            print("  ❌ Niska zgodność słów — prawdopodobnie inna struktura zdań.")
    
    elif "comet" in name.lower():
        if avg > 0.8:
            print("  ✅ Opisy bardzo dobre — zgodne znaczeniowo.")
        elif avg > 0.6:
            print("  ⚠️ Dobra jakość, ale warto przejrzeć kilka przykładów.")
        else:
            print("  ❌ Słaba jakość — opisy mogą być nieadekwatne.")


def calculate_all_scores(source):
    results = {
        "cosine_sim": [],
        "bleu": [],
        "comet": []
    }
    for desc in geo_descriptions:
        if desc['source'] == source and source != "human":
            ref = desc['expert_desc']
            gen = desc['generated_desc']
            results["cosine_sim"].append(calculate_semantic_similarity(ref, gen))
            results["bleu"].append(calculate_bleu(ref, gen))
            results["comet"].append(calculate_comet_score(ref, gen))
    return results

def plot_similarity_stats(source, scores):
    fig, ax = plt.subplots(1, 3, figsize=(16, 5))
    for i, (metric, values) in enumerate(scores.items()):
        flat_values = [item for sublist in values for item in sublist] if isinstance(values[0], list) else values
        sns.boxplot(y=flat_values, ax=ax[i], palette='Set2')
        mean_val = np.mean(flat_values)
        ax[i].set_title(f'{metric.upper()} - {source}')
        ax[i].set_ylabel("Score")
        ax[i].annotate(f'Mean: {mean_val:.2f}', 
                       xy=(0, mean_val), 
                       xytext=(0.1, mean_val + 0.02), 
                       textcoords='data',
                       arrowprops=dict(arrowstyle='->', color='black'),
                       fontsize=10)

    plt.tight_layout()
    plt.show()

for model in ["deepseek-r1-distill-llama-8b", "mistral-7b-instruct-v0.3"]:
    print(f"\n=== 📊 Wyniki dla: {model} ===")
    scores = calculate_all_scores(model)
    plot_similarity_stats(model, scores)
    print_score_summary("Cosine similarity", scores["cosine_sim"])
    print_score_summary("BLEU", scores["bleu"])
    print_score_summary("COMET", scores["comet"])
