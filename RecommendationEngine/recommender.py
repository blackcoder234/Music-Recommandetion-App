import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class ContentBasedRecommender:
    def __init__(self):
        self.similarity_matrix = None
        self.tracks_df = None
        self.indices = None

    def fit(self, tracks_df: pd.DataFrame):
        """
        Builds the similarity matrix based on track genres and moods.
        """
        self.tracks_df = tracks_df.reset_index(drop=True)
        
        # Create a 'soup' of metadata (genres + mood)
        # We join list elements with spaces
        self.tracks_df['soup'] = self.tracks_df.apply(self._create_soup, axis=1)

        # Compute Count Matrix
        count = CountVectorizer(stop_words='english')
        count_matrix = count.fit_transform(self.tracks_df['soup'])

        # Compute Cosine Similarity matrix
        self.similarity_matrix = cosine_similarity(count_matrix, count_matrix)
        
        # Create a reverse mapping of track_id to index and index to track_id
        self.indices = pd.Series(self.tracks_df.index, index=self.tracks_df['_id']).drop_duplicates()
        
        print("Model trained successfully.")

    def _create_soup(self, x):
        return ' '.join(x['genres']) + ' ' + ' '.join(x['mood'])

    def recommend(self, track_id: str, n=10):
        """
        Returns a list of recommended track IDs based on the input track_id.
        """
        if self.similarity_matrix is None or self.indices is None:
            return []

        if track_id not in self.indices:
            return []

        # Get the index of the track
        idx = self.indices[track_id]

        # Get the pairwise similarity scores of all movies with that movie
        sim_scores = list(enumerate(self.similarity_matrix[idx]))

        # Sort the movies based on the similarity scores
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

        # Get the scores of the n most similar movies (ignoring itself)
        sim_scores = sim_scores[1:n+1]

        # Get the movie indices
        track_indices = [i[0] for i in sim_scores]

        # Return the top n most similar movies
        return self.tracks_df.iloc[track_indices]['_id'].tolist()
