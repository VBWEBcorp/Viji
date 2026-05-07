/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { IOrder } from "@/models/Order";
import type { ISiteSettings } from "@/models/SiteSettings";

// =============== STYLES ===============
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
    lineHeight: 1.4,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  brand: { flexDirection: "column", maxWidth: 240 },
  brandName: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  brandLine: { fontSize: 9, color: "#555" },
  logo: { width: 80, height: 80, objectFit: "contain", marginBottom: 8 },
  invoiceMeta: { textAlign: "right", maxWidth: 240 },
  invoiceTitle: { fontSize: 22, fontWeight: 700, marginBottom: 6 },
  metaRow: { fontSize: 9, color: "#555", marginBottom: 2 },
  metaStrong: { fontWeight: 700, color: "#1a1a1a" },

  // Parties
  parties: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
    gap: 20,
  },
  partyBox: {
    flex: 1,
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 4,
  },
  partyLabel: {
    fontSize: 8,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  partyName: { fontSize: 11, fontWeight: 700, marginBottom: 4 },
  partyLine: { fontSize: 9, color: "#444", marginBottom: 1 },

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 10,
  },
  colDescription: { flex: 4 },
  colQty: { flex: 1, textAlign: "center" },
  colUnit: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  variant: { fontSize: 8, color: "#888", marginTop: 2 },

  // Totals
  totalsBox: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totals: { width: 240 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    fontSize: 10,
  },
  totalLabel: { color: "#555" },
  totalValue: { fontWeight: 700 },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
    backgroundColor: "#1a1a1a",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#888",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e5e5",
    paddingTop: 8,
  },
  footerLegal: { marginBottom: 4 },
  bank: { marginTop: 12, fontSize: 9, color: "#444" },
});

// =============== HELPERS ===============
function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(2)} €`.replace(".", ",");
}

function formatDate(d: Date | string | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// =============== COMPONENT ===============
interface Props {
  order: IOrder;
  settings: ISiteSettings;
}

export default function InvoiceDocument({
  order,
  settings,
}: Props): ReactElement<DocumentProps> {
  const taxRate = settings.tax?.rate ?? 20;
  const taxLabel = settings.tax?.label || "TVA";
  const showTax = taxRate > 0;
  const totalHT = order.total - (order.tax || 0);

  return (
    <Document
      title={`Facture ${order.invoiceNumber || order.orderNumber}`}
      author={settings.shopName || "Boutique"}
      creator={settings.shopName || "Boutique"}
    >
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brand}>
            {settings.shopLogo ? (
              <Image src={settings.shopLogo} style={styles.logo} />
            ) : null}
            <Text style={styles.brandName}>{settings.shopName || "Boutique"}</Text>
            {settings.address && <Text style={styles.brandLine}>{settings.address}</Text>}
            {settings.contactEmail && <Text style={styles.brandLine}>{settings.contactEmail}</Text>}
            {settings.contactPhone && <Text style={styles.brandLine}>{settings.contactPhone}</Text>}
          </View>

          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={styles.metaRow}>
              <Text style={styles.metaStrong}>N° </Text>
              {order.invoiceNumber || order.orderNumber}
            </Text>
            <Text style={styles.metaRow}>
              <Text style={styles.metaStrong}>Date : </Text>
              {formatDate(order.invoiceIssuedAt || order.createdAt)}
            </Text>
            <Text style={styles.metaRow}>
              <Text style={styles.metaStrong}>Commande : </Text>
              {order.orderNumber}
            </Text>
          </View>
        </View>

        {/* PARTIES */}
        <View style={styles.parties}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Émetteur</Text>
            <Text style={styles.partyName}>{settings.shopName || "Boutique"}</Text>
            {settings.address && <Text style={styles.partyLine}>{settings.address}</Text>}
            {settings.legal?.legalForm && (
              <Text style={styles.partyLine}>
                {settings.legal.legalForm}
                {settings.legal.capital ? ` au capital de ${settings.legal.capital}` : ""}
              </Text>
            )}
            {settings.legal?.siret && (
              <Text style={styles.partyLine}>SIRET : {settings.legal.siret}</Text>
            )}
            {settings.legal?.tva && (
              <Text style={styles.partyLine}>TVA : {settings.legal.tva}</Text>
            )}
            {settings.legal?.rcs && (
              <Text style={styles.partyLine}>{settings.legal.rcs}</Text>
            )}
          </View>

          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Facturé à</Text>
            <Text style={styles.partyName}>{order.billingAddress.name}</Text>
            <Text style={styles.partyLine}>{order.billingAddress.street}</Text>
            <Text style={styles.partyLine}>
              {order.billingAddress.zip} {order.billingAddress.city}
            </Text>
            <Text style={styles.partyLine}>{order.billingAddress.country}</Text>
            {order.billingAddress.phone && (
              <Text style={styles.partyLine}>{order.billingAddress.phone}</Text>
            )}
          </View>
        </View>

        {/* TABLE */}
        <View style={styles.tableHeader}>
          <Text style={styles.colDescription}>Description</Text>
          <Text style={styles.colQty}>Qté</Text>
          <Text style={styles.colUnit}>P.U. {showTax ? "HT" : ""}</Text>
          <Text style={styles.colTotal}>Total {showTax ? "HT" : ""}</Text>
        </View>
        {order.items.map((item, i) => {
          const unitHT = showTax
            ? Math.round(item.unitPrice / (1 + taxRate / 100))
            : item.unitPrice;
          const totalHTLine = unitHT * item.quantity;
          return (
            <View key={i} style={styles.tableRow}>
              <View style={styles.colDescription}>
                <Text>{item.name}</Text>
                {item.variant && <Text style={styles.variant}>{item.variant}</Text>}
              </View>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{formatPrice(unitHT)}</Text>
              <Text style={styles.colTotal}>{formatPrice(totalHTLine)}</Text>
            </View>
          );
        })}

        {/* TOTALS */}
        <View style={styles.totalsBox}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total HT</Text>
              <Text style={styles.totalValue}>
                {formatPrice(totalHT - order.shippingCost + (order.discount || 0))}
              </Text>
            </View>
            {order.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Remise</Text>
                <Text style={styles.totalValue}>- {formatPrice(order.discount)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Livraison</Text>
              <Text style={styles.totalValue}>
                {order.shippingCost === 0 ? "Gratuit" : formatPrice(order.shippingCost)}
              </Text>
            </View>
            {showTax && order.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  {taxLabel} ({taxRate}%)
                </Text>
                <Text style={styles.totalValue}>{formatPrice(order.tax)}</Text>
              </View>
            )}
            <View style={styles.grandRow}>
              <Text>TOTAL TTC</Text>
              <Text>{formatPrice(order.total)}</Text>
            </View>
          </View>
        </View>

        {/* BANK INFO */}
        {(settings.invoice?.iban || settings.invoice?.bic) && (
          <View style={styles.bank}>
            <Text style={{ fontWeight: 700, marginBottom: 2 }}>Coordonnées bancaires</Text>
            {settings.invoice.bankName && <Text>{settings.invoice.bankName}</Text>}
            {settings.invoice.iban && <Text>IBAN : {settings.invoice.iban}</Text>}
            {settings.invoice.bic && <Text>BIC : {settings.invoice.bic}</Text>}
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          {settings.invoice?.legalMention && (
            <Text style={styles.footerLegal}>{settings.invoice.legalMention}</Text>
          )}
          <Text>
            {settings.shopName}
            {settings.legal?.siret ? ` · SIRET ${settings.legal.siret}` : ""}
            {settings.legal?.tva ? ` · TVA ${settings.legal.tva}` : ""}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
