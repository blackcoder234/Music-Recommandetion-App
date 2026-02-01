from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import csr_matrix
import pandas as pd
import numpy as np

class CollaborativeRecommender:
    def __init__(self):
        self.user_similarity_matrix = None
        self.user_item_matrix_sparse = None
        self.users = None
        self.index_to_user = None
        self.user_to_index = None
        self.tracks = None
        self.index_to_track = None
        self.track_to_index = None

    def fit(self, df: pd.DataFrame):
        """
        Trains a User-User Collaborative Filtering model using Sparse Matrices (Memory Efficient).
        Expected df columns: ['user', 'track', 'score']
        """
        if df.empty:
            print("Cannot train Collaborative model: Dataset is empty.")
            return

        print("Building Sparse User-Item Matrix...")
        
        # 1. Map Users and Tracks to Indices (0, 1, 2...)
        # This is required for sparse matrix construction
        
        # Get unique values
        unique_users = df['user'].unique()
        unique_tracks = df['track'].unique()
        
        # Create Mappings
        self.users = unique_users
        self.tracks = unique_tracks
        
        self.user_to_index = {user: i for i, user in enumerate(unique_users)}
        self.index_to_user = {i: user for i, user in enumerate(unique_users)}
        
        self.track_to_index = {track: i for i, track in enumerate(unique_tracks)}
        self.index_to_track = {i: track for i, track in enumerate(unique_tracks)}
        
        # 2. Transform Dataframe to mapped indices
        user_indices = df['user'].map(self.user_to_index).values
        track_indices = df['track'].map(self.track_to_index).values
        scores = df['score'].values
        
        # 3. Create Compressed Sparse Row (CSR) Matrix
        # shape = (n_users, n_tracks)
        n_users = len(unique_users)
        n_tracks = len(unique_tracks)
        
        self.user_item_matrix_sparse = csr_matrix(
            (scores, (user_indices, track_indices)), 
            shape=(n_users, n_tracks)
        )
        
        print(f"Matrix Created. Shape: ({n_users}, {n_tracks}). Stored elements: {len(scores)}")
        
        # 4. Compute User-User Similarity
        # sklearn's cosine_similarity is optimized for sparse input
        print("Computing Sparse User Similarity...")
        self.user_similarity_matrix = cosine_similarity(self.user_item_matrix_sparse, dense_output=False)
        
        print(f"Collaborative Model Trained Successfully.")

    def recommend(self, user_id: str, n=10):
        """
        Suggests tracks that similar users have liked.
        """
        if self.user_similarity_matrix is None:
            return []
            
        if user_id not in self.user_to_index:
            return []
            
        user_idx = self.user_to_index[user_id]
        
        # 1. Get similarity row for this user (Sparse Row)
        # We convert just this row to dense array or handle sparsely
        user_similarities = self.user_similarity_matrix[user_idx]
        
        # Convert to arrays for sorting
        if hasattr(user_similarities, "toarray"):
            user_similarities = user_similarities.toarray().flatten()

        # 2. Find top similar users
        # Exclude self (index matches user_idx) - handled by setting to -1
        user_similarities[user_idx] = -1
        
        # Get indices of top 20 similar users
        similar_user_indices = user_similarities.argsort()[::-1][:20]
        
        # 3. Aggregate Tracks
        recommendations = {}
        
        # Get what the target user has ALREADY played (to exclude them)
        # Sparse matrix row for target user
        user_played_row = self.user_item_matrix_sparse[user_idx]
        played_track_indices = set(user_played_row.indices)

        for other_idx in similar_user_indices:
            similarity_score = user_similarities[other_idx]
            if similarity_score <= 0: continue
            
            # Get tracks this similar user liked
            other_user_row = self.user_item_matrix_sparse[other_idx]
            other_user_track_indices = other_user_row.indices
            other_user_scores = other_user_row.data
            
            for i, track_idx in enumerate(other_user_track_indices):
                if track_idx not in played_track_indices:
                    track_id = self.index_to_track[track_idx]
                    
                    # Score = Similarity * Rating (or just Similarity for implicit)
                    if track_id not in recommendations:
                        recommendations[track_id] = 0
                    recommendations[track_id] += similarity_score 

        # Sort
        sorted_recs = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)
        
        return [rec[0] for rec in sorted_recs[:n]]
