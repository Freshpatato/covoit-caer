from geopy.distance import geodesic

def distance_km(coord1, coord2):
    return geodesic(coord1, coord2).km
