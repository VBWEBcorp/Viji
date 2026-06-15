import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { z } from "zod";
import { sendEmail } from "@/lib/resend";
import { generateWelcomeEmail } from "@/components/emails/WelcomeEmail";

const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    await connectDB();

    const existingUser = await User.findOne({
      email: validated.email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 400 }
      );
    }

    const user = await User.create({
      name: validated.name,
      email: validated.email.toLowerCase(),
      passwordHash: validated.password,
      role: "customer",
    });

    // Envoyer email de bienvenue
    sendEmail({
      to: user.email,
      subject: `Bienvenue sur Entre Maman et Moi, ${user.name} !`,
      html: generateWelcomeEmail({ customerName: user.name }),
    }).catch(console.error);

    return NextResponse.json(
      {
        message: "Compte créé avec succès",
        user: { id: user._id, name: user.name, email: user.email },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0].message },
        { status: 400 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
