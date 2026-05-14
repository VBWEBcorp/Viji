import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IAddress {
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: "customer" | "admin";
  addresses: IAddress[];
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true, default: "FR" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    addresses: [AddressSchema],
    // Token de réinitialisation / configuration initiale du mot de passe.
    // Envoyé au premier checkout invité, valable 30 jours par défaut.
    passwordResetToken: { type: String, default: null, index: true },
    passwordResetExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

UserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.index({ role: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
