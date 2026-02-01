import pandas as pd
from database import get_database

def load_tracks():
    """
    Fetches all tracks from MongoDB and returns them as a pandas DataFrame.
    """
    client = get_database()
    if not client:
        return pd.DataFrame()

    db = client['test'] # Assuming 'test' is the default if not specified, usually standard for Atlas
    # Note: In production we should verify the DB name. 
    # Based on the user's connection string, it often defaults to 'test' or 'admin' or the one in the path.
    # We will try to dynamically find the db with collections or try 'test'.
    
    # Ideally we should list dbs and find the one with 'tracks' collection.
    
    db_name = 'test' # Default fallback
    if 'test' not in client.list_database_names():
         # Simple heuristic: find a db that has 'tracks'
         for name in client.list_database_names():
             if name in ['local', 'admin', 'config']:
                 continue
             if 'tracks' in client[name].list_collection_names():
                 db_name = name
                 break
    
    print(f"Using database: {db_name}")
    db = client[db_name]
    
    tracks_cursor = db['tracks'].find({}, {
        '_id': 1, 
        'title': 1, 
        'genres': 1, 
        'mood': 1, 
        'artist': 1,
        'album': 1,
        'duration': 1
    })
    
    tracks = list(tracks_cursor)
    
    if not tracks:
        print("No tracks found in database.")
        return pd.DataFrame()

    df = pd.DataFrame(tracks)
    # Convert _id to string for easier handling
    df['_id'] = df['_id'].astype(str)
    
    # Ensure list columns are lists (sometimes they might be null or mixed)
    df['genres'] = df['genres'].apply(lambda x: x if isinstance(x, list) else [])
    df['mood'] = df['mood'].apply(lambda x: x if isinstance(x, list) else [])
    
    print(f"Loaded {len(df)} tracks.")
    return df

if __name__ == "__main__":
    df = load_tracks()
    print(df.head())
