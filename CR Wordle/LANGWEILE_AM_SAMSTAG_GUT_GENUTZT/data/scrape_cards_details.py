from calendar import c
from math import inf
import requests
from bs4 import BeautifulSoup

def scrape_details(name: str, url: str) -> dict:
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    details = {
        "id": name.lower().replace(" ", "_").replace(".", ""),
        "name": name,
        "elixir": 0,
        "rarity": "",
        "type": "",
        "target": "k.A.",
        "range": "k.A.",
        "speed": "k.A.",
        "hitSpeed": 0,
        "releaseYear": 0
    }
    details["image"] = "images/cards/" + details["id"] + ".png"

    # Find the infobox table
    infobox = soup.find("aside", class_="portable-infobox pi-background pi-border-color pi-theme-wikia pi-layout-default")
    if infobox:
        for row in infobox.find_all("div"):
            header = row.find("h3", class_="pi-data-label pi-secondary-font")
            value = row.find("div", class_="pi-data-value pi-font")
            if header and value:
                label = header.get_text(strip=True)
                val_text = value.get_text(strip=True)
                if label == "Elixir Cost":
                    try:
                        details["elixir"] = int(val_text)
                    except ValueError:
                        details["elixir"] = "?"
                elif label == "Rarity":
                    details["rarity"] = val_text
                elif label == "Type":
                    details["type"] = val_text
                elif label == "Release Date":
                    details["releaseYear"] = int(val_text[-4:])
    
    detailsbox = soup.select_one("#unit-attributes-table > tbody")
    
    if detailsbox:
        detailsbox_labels = [x.get_text(strip=True) for x in detailsbox.find_all("tr")[0].find_all("th")]
        detailsbox_values = [x.get_text(strip=True) for x in detailsbox.find_all("tr")[1].find_all("td")]
        for label, val_text in zip(detailsbox_labels, detailsbox_values):
            if label == "Range":
                if "Melee" in val_text:
                    val_text = "Melee"
                else:
                    try:
                        float(val_text)
                        val_text = "Ranged"
                    except ValueError:
                        val_text = "k.A."
                details["range"] = val_text
            if label == "Target":
                details["target"] = val_text
            elif label == "Speed":
                details["speed"] = val_text.split(" ")[0]
            elif label == "Hit Speed":
                details["hitSpeed"] = float(val_text.split(" ")[0])
        
    return details

import json, os

dir = os.listdir("C:\\Users\\grego\\Desktop\\CR Wordle\\data\\card_urls")
details = []
for file in dir:
    if file.endswith(".json"):
        with open(f"C:\\Users\\grego\\Desktop\\CR Wordle\\data\\card_urls\\{file}", "r", encoding="utf-8") as f:
            card_urls = json.load(f)
        for pair in card_urls:
            card_name = pair["name"]
            card_url = pair["link"]
            count = card_urls.index(pair) + 1
            length = len(card_urls)
            print(f"({count:>3}/{length}) - {card_name:<20} from {card_url}")
            result = scrape_details(name=card_name, url=card_url)
            details.append(result)

with open("C:\\Users\\grego\\Desktop\\CR Wordle\\data\\card_details.json", "w", encoding="utf-8") as f:
    json.dump(details, f, indent=4, ensure_ascii=False)

