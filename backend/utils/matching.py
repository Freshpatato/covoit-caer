from utils.geocode import distance_km

def create_carpool_groups(users):
    # Transformation des données Firestore
    formatted_users = []
    for u in users:
        if "address" not in u or not u["address"]:
            continue  
        formatted_users.append({
            "name": u.get("email", "inconnu"),
            "is_driver": u.get("isDriver", False),
            "places": u.get("places", 0),
            "lat": float(u["address"]["lat"]),
            "lon": float(u["address"]["lon"])
        })

    drivers = [u for u in formatted_users if u["is_driver"]]
    passengers = [u for u in formatted_users if not u["is_driver"]]

    groups = []
    assigned_passengers = set()  
    for driver in drivers:
        group = {
            "driver": {
                "name": driver["name"],
                "lat": driver["lat"],
                "lon": driver["lon"]
            },
            "passengers": [],
            "max_places": driver.get("places", 0),
            "destination": {      
                "name": "Campus",
                "lat": 48.3591,
                "lon": -4.5739
            }
        }

        # Trier les passagers disponibles par distance au conducteur
        sorted_passengers = sorted(
            [p for p in passengers if p["name"] not in assigned_passengers],
            key=lambda p: distance_km(
                (driver["lat"], driver["lon"]),
                (p["lat"], p["lon"])
            )
        )

        for p in sorted_passengers:
            if len(group["passengers"]) < driver["places"]:
                group["passengers"].append({
                    "name": p["name"],
                    "lat": p["lat"],
                    "lon": p["lon"]
                })
                assigned_passengers.add(p["name"]) 

        groups.append(group)

    return groups
