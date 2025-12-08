import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const recommendationLogSchema = new Schema(
  {
    // For which user this recommendation was generated
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // What kind of recommendation this is
    // e.g. "for-you", "similar-track", "by-genre", "daily-mix"
    type: {
      type: String,
      default: "for-you",
    },

    // From where it was generated: rule-based vs ml-model (future)
    source: {
      type: String,
      enum: ["rule-based", "ml-model"],
      default: "rule-based",
    },

    // Snapshot of input used to generate recommendations
    inputContext: {
      favoriteGenres: {
        type: [String],
        default: [],
      },
      recentTrackIds: {
        type: [
          {
            type: Schema.Types.ObjectId,
            ref: "Track",
          },
        ],
        default: [],
      },
      baseTrack: {
        // used for "similar-track" type
        type: Schema.Types.ObjectId,
        ref: "Track",
        default: null,
      },
    },

    // The actual recommendations returned to the user
    recommendedTracks: {
      type: [
        {
          track: {
            type: Schema.Types.ObjectId,
            ref: "Track",
            required: true,
          },
          score: {
            type: Number, // relevance score / ranking value
            default: 0,
          },
          rank: {
            type: Number, // 1, 2, 3... (position in list)
          },
        },
      ],
      default: [],
    },

    // Optional: metadata for debugging / future ML
    algorithmVersion: {
      type: String,
      default: "",
    },
  },
  { timestamps: true } // createdAt = when rec was generated
);

recommendationLogSchema.plugin(mongooseAggregatePaginate);

export const RecommendationLog = mongoose.model(
  "RecommendationLog",
  recommendationLogSchema
);
