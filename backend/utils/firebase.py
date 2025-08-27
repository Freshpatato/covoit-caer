import firebase_admin
from firebase_admin import credentials, firestore

# Initialiser Firebase (à faire une seule fois)
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def get_users():
    """Récupère tous les utilisateurs depuis Firestore"""
    users_ref = db.collection("users")
    docs = users_ref.stream()
    return [doc.to_dict() for doc in docs]

def save_group(group_data):
    """Enregistre un groupe dans Firestore"""
    groups_ref = db.collection("groups")
    groups_ref.add(group_data)
