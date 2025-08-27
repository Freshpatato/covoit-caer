from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from utils.firebase import get_users, save_group
from utils.matching import create_carpool_groups

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API de covoiturage prête"}

@app.get("/users")
def list_users():
    users = get_users()
    return {"users": users}

@app.post("/create-groups")
def create_groups():
    users = get_users()
    groups = create_carpool_groups(users)
    for group in groups:
        save_group(group)
    return {"groups": groups}
