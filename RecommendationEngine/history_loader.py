import pandas as pd
from database import get_database

def load_user_history():
    """
    Fetches user playback history from MongoDB.
    Returns a DataFrame with [user_id, track_id, score]
    """
    client = get_database()
    if not client:
        return pd.DataFrame()

    db_name = 'MusicApp' 
    if db_name not in client.list_database_names():
         for name in client.list_database_names():
             if name in ['local', 'admin', 'config']:
                 continue
             if 'playbackhistories' in client[name].list_collection_names():
                 db_name = name
                 break
    
    db = client[db_name]
    collection_name = 'playbackhistories'
    
    # Check if collection exists
    if collection_name not in db.list_collection_names():
        return pd.DataFrame()
    
    cursor = db[collection_name].find({}, {
        'user': 1, 
        'track': 1, 
        'completed': 1
    })
    
    interactions = list(cursor)
    
    if not interactions:
        return pd.DataFrame(columns=['user', 'track', 'score'])

    df = pd.DataFrame(interactions)
    
    # Ensure columns exist
    if 'user' not in df.columns or 'track' not in df.columns:
         return pd.DataFrame(columns=['user', 'track', 'score'])
         
    df['user'] = df['user'].astype(str)
    df['track'] = df['track'].astype(str)
    
    # Simple scoring: 1 if exists (implicit feedback)
    df['score'] = 1.0
    
    # Aggregate
    df_agg = df.groupby(['user', 'track'])['score'].sum().reset_index()
    
    return df_agg

if __name__ == "__main__":
    df = load_user_history()
    if not df.empty:
        print(f"Loaded {len(df)} interactions")
    else:
        print("No history data found.")
