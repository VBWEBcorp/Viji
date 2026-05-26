import User from "@/models/User";

/**
 * Assure l'existence du compte admin à partir des variables d'environnement
 * ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME.
 *
 * - Fonctionne en dev ET en production (contrairement au seed dev) : c'est ce
 *   qui permet de créer l'admin sur Netlify en définissant simplement les vars.
 * - Idempotent : ne crée le compte que s'il est absent.
 * - Synchronise le mot de passe sur la valeur d'environnement (si un compte
 *   existe déjà mais que le mot de passe ne correspond pas, il est mis à jour),
 *   pour que « la variable d'env = le mot de passe » soit toujours vrai.
 * - No-op si ADMIN_EMAIL ou ADMIN_PASSWORD ne sont pas définis.
 * - Best-effort : toute erreur est journalisée mais ne casse pas la connexion DB.
 */
export async function ensureAdminUser(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  try {
    const existing = await User.findOne({ email });

    if (existing) {
      let changed = false;
      if (existing.role !== "admin") {
        existing.role = "admin";
        changed = true;
      }
      // Si le mot de passe stocké ne correspond pas à l'env, on le réaligne.
      const matches = await existing.comparePassword(password);
      if (!matches) {
        existing.passwordHash = password; // re-hashé par le hook pre-save
        changed = true;
      }
      if (changed) await existing.save();
      return;
    }

    await User.create({
      email,
      name,
      passwordHash: password, // hashé par le hook pre-save du modèle User
      role: "admin",
    });
    console.log(`[admin] Compte admin assuré : ${email}`);
  } catch (err) {
    // Ex. course entre deux cold starts (clé unique) — sans gravité.
    console.error("[admin] ensureAdminUser échec (ignoré) :", err);
  }
}
