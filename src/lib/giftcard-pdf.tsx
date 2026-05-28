/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { GiftCardTemplate } from "@/components/shop/GiftCardVisual";

const DEFAULT_PRIMARY = "#b08438";
const DEFAULT_PRIMARY_DARK = "#8a6a2c";
const DEFAULT_BG = "#faf6ee";

function fmtPrice(cents: number): string {
  return `${(cents / 100).toFixed(2)} €`.replace(".", ",");
}

function fmtDate(d?: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

interface Props {
  shopName: string;
  amount: number; // centimes
  code: string;
  recipientName?: string;
  message?: string;
  expiresAt?: Date | string | null;
  template?: GiftCardTemplate;
}

export default function GiftCardPdf({
  shopName,
  amount,
  code,
  recipientName,
  message,
  expiresAt,
  template,
}: Props): ReactElement<DocumentProps> {
  const primary = template?.primaryColor || DEFAULT_PRIMARY;
  const bg = template?.backgroundColor || DEFAULT_BG;
  const headline = template?.headline || "Carte cadeau";
  const logo = template?.logoUrl;
  const bgImage = template?.backgroundImageUrl;
  const footer = template?.footerText;
  const onImage = Boolean(bgImage);
  const textMain = onImage ? "#ffffff" : "#1a1a1a";
  const textSoft = onImage ? "rgba(255,255,255,0.85)" : "#6b7280";

  const styles = StyleSheet.create({
    page: { padding: 0, fontFamily: "Helvetica", backgroundColor: bg },
    bgImg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" },
    overlay: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: onImage ? "rgba(0,0,0,0.4)" : "transparent" },
    frame: {
      position: "absolute",
      top: 24, left: 24, right: 24, bottom: 24,
      borderWidth: 1,
      borderColor: onImage ? "rgba(255,255,255,0.6)" : primary,
      paddingVertical: 40,
      paddingHorizontal: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    logo: { height: 48, objectFit: "contain", marginBottom: 16 },
    shopName: { fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: onImage ? "#fff" : primary, marginBottom: 18 },
    headline: { fontSize: 14, letterSpacing: 3, textTransform: "uppercase", color: textSoft, marginBottom: 10 },
    recipient: { fontSize: 18, color: textMain, marginBottom: 6 },
    amount: { fontSize: 54, color: onImage ? "#fff" : DEFAULT_PRIMARY_DARK, marginBottom: 8, fontWeight: 700 },
    message: { fontSize: 12, fontStyle: "italic", color: textSoft, marginBottom: 14, textAlign: "center" },
    codeLabel: { fontSize: 8, letterSpacing: 3, textTransform: "uppercase", color: textSoft, marginTop: 14, marginBottom: 6 },
    code: { fontFamily: "Courier", fontSize: 22, letterSpacing: 3, color: textMain, fontWeight: 700 },
    expiry: { fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: textSoft, marginTop: 18 },
    footer: { fontSize: 10, color: textSoft, marginTop: 10, textAlign: "center" },
    divider: { width: 60, height: 1, backgroundColor: onImage ? "rgba(255,255,255,0.5)" : primary, marginVertical: 14 },
  });

  return (
    <Document title={`Carte cadeau ${code}`} author={shopName} creator={shopName}>
      {/* A6 paysage : format carte */}
      <Page size="A6" orientation="landscape" style={styles.page}>
        {bgImage ? <Image src={bgImage} style={styles.bgImg} /> : null}
        <View style={styles.overlay} />
        <View style={styles.frame}>
          {logo ? <Image src={logo} style={styles.logo} /> : <Text style={styles.shopName}>{shopName}</Text>}
          <Text style={styles.headline}>{headline}</Text>
          {recipientName ? <Text style={styles.recipient}>Pour {recipientName}</Text> : null}
          <Text style={styles.amount}>{fmtPrice(amount)}</Text>
          {message ? <Text style={styles.message}>«{" "}{message}{" "}»</Text> : null}
          <View style={styles.divider} />
          <Text style={styles.codeLabel}>Code</Text>
          <Text style={styles.code}>{code}</Text>
          {expiresAt ? <Text style={styles.expiry}>Valable jusqu&apos;au {fmtDate(expiresAt)}</Text> : null}
          {footer ? <Text style={styles.footer}>{footer}</Text> : null}
        </View>
      </Page>
    </Document>
  );
}
