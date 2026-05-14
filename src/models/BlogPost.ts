import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  author: mongoose.Types.ObjectId;
  category?: string;
  tags: string[];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, required: true },
    excerpt: { type: String, required: true, maxlength: 500 },
    coverImage: { type: String },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
    },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

BlogPostSchema.index({ isPublished: 1, publishedAt: -1 });
BlogPostSchema.index({ tags: 1 });
BlogPostSchema.index({ title: "text", content: "text" });

const BlogPost: Model<IBlogPost> =
  mongoose.models.BlogPost || mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);

export default BlogPost;
