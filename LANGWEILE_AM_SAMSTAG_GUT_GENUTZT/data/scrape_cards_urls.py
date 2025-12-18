import requests
from bs4 import BeautifulSoup

urls = ["https://clashroyale.fandom.com/wiki/Category:Troop_Cards",
        "https://clashroyale.fandom.com/wiki/Category:Spell_Cards",
        "https://clashroyale.fandom.com/wiki/Category:Building_Cards"]

total = 0

for url in urls:
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    list_cards = []
    for div in soup.find_all("div", class_="card-overview"):
        a = div.find("a")
        if a and a.text and a.get("href"):
            list_cards.append({
                "name": a.text.strip(),
                "link": "https://clashroyale.fandom.com" + a["href"]
            })

    name = url.replace("https://clashroyale.fandom.com/wiki/Category:", "").lower()
    import json
    with open(f"C:/Users/grego/Desktop/CR Wordle/data/card_urls/{name}.json", "w", encoding="utf-8") as f:
        json.dump(list_cards, f, ensure_ascii=False, indent=2)

    print(list_cards)
    total += len(list_cards)
    print(f"Total {name} found: {len(list_cards)}")
print(f"Overall total cards found: {total}")