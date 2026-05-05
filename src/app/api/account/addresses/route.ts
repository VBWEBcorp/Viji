import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import User from "@/models/User";

// GET /api/account/addresses
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select("addresses").lean();

    return NextResponse.json({ addresses: user?.addresses || [] });
  } catch (error) {
    console.error("GET /api/account/addresses error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/account/addresses — Add address
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();
    const { street, city, zip, country } = await req.json();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const isFirst = user.addresses.length === 0;
    user.addresses.push({ street, city, zip, country: country || "FR", isDefault: isFirst });
    await user.save();

    return NextResponse.json({ message: "Adresse ajoutée" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/account/addresses error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/account/addresses — Update address
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();
    const { addressId, street, city, zip, country, isDefault } = await req.json();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addr = (user.addresses as any).id(addressId);
    if (!addr) {
      return NextResponse.json({ error: "Adresse non trouvee" }, { status: 404 });
    }

    if (street) addr.street = street;
    if (city) addr.city = city;
    if (zip) addr.zip = zip;
    if (country) addr.country = country;

    if (isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = (a as unknown as { _id: { toString(): string } })._id.toString() === addressId;
      });
    }

    await user.save();
    return NextResponse.json({ message: "Adresse mise a jour" });
  } catch (error) {
    console.error("PUT /api/account/addresses error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/account/addresses — Remove address
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();
    const { addressId } = await req.json();

    await User.findByIdAndUpdate(session.user.id, {
      $pull: { addresses: { _id: addressId } },
    });

    return NextResponse.json({ message: "Adresse supprimée" });
  } catch (error) {
    console.error("DELETE /api/account/addresses error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
