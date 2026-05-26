#!/usr/bin/env bash
# Suite de tests end-to-end (cartes cadeaux + codes promo + auth + checkout).
# Lancer le serveur dev (npm run dev) AVANT. Usage: bash scripts/e2e-test.sh
B=http://localhost:3000
# Identifiants admin lus depuis l'environnement, sinon depuis .env.local (jamais codés en dur).
ADMIN_EMAIL="${ADMIN_EMAIL:-$(grep -E '^ADMIN_EMAIL=' .env.local 2>/dev/null | cut -d= -f2-)}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(grep -E '^ADMIN_PASSWORD=' .env.local 2>/dev/null | cut -d= -f2-)}"
PASS=0; FAIL=0
# extracteur JSON via node (chemin type a.b.c ou a[0].b)
get() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{let o=JSON.parse(s);console.log(eval('o.'+process.argv[1])??'')}catch{console.log('')}})" "$1"; }
assert() { if [ "$2" = "$3" ]; then echo "  ✅ $1"; PASS=$((PASS+1)); else echo "  ❌ $1  (attendu='$2' obtenu='$3')"; FAIL=$((FAIL+1)); fi; }
assert_ne() { if [ -n "$3" ] && [ "$3" != "null" ]; then echo "  ✅ $1"; PASS=$((PASS+1)); else echo "  ❌ $1  (obtenu vide)"; FAIL=$((FAIL+1)); fi; }

echo "════════ AUTH ════════"
JAR=/tmp/e2e_admin.txt; rm -f $JAR
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 $B/api/gift-cards)
assert "GET /api/gift-cards sans session -> 401" "401" "$HTTP"
CSRF=$(curl -s --max-time 20 -c $JAR $B/api/auth/csrf | get csrfToken)
curl -s --max-time 20 -b $JAR -c $JAR -o /dev/null -X POST $B/api/auth/callback/credentials -H "Content-Type: application/x-www-form-urlencoded" --data-urlencode "csrfToken=$CSRF" --data-urlencode "email=$ADMIN_EMAIL" --data-urlencode "password=$ADMIN_PASSWORD"
ROLE=$(curl -s --max-time 20 -b $JAR $B/api/auth/session | get user.role)
assert "Connexion admin -> role admin" "admin" "$ROLE"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 -b $JAR $B/api/gift-cards)
assert "GET /api/gift-cards avec session -> 200" "200" "$HTTP"

echo "════════ CONFIG / SETTINGS ════════"
EN=$(curl -s --max-time 20 $B/api/settings | get giftCards.enabled)
assert "Cartes cadeaux activées (seed)" "true" "$EN"

echo "════════ CODES PROMO ════════"
curl -s --max-time 20 -b $JAR -o /dev/null -X POST $B/api/promos -H "Content-Type: application/json" -d '{"code":"E2E10","type":"percentage","value":10,"validFrom":"2026-01-01","validUntil":"2026-12-31","isActive":true}'
curl -s --max-time 20 -b $JAR -o /dev/null -X POST $B/api/promos -H "Content-Type: application/json" -d '{"code":"E2E5","type":"fixed","value":5,"validFrom":"2026-01-01","validUntil":"2026-12-31","isActive":true}'
curl -s --max-time 20 -b $JAR -o /dev/null -X POST $B/api/promos -H "Content-Type: application/json" -d '{"code":"E2EMIN","type":"fixed","value":5,"minOrderAmount":200,"validFrom":"2026-01-01","validUntil":"2026-12-31","isActive":true}'
D=$(curl -s --max-time 20 -X POST $B/api/promos/validate -H "Content-Type: application/json" -d '{"code":"E2E10","subtotal":10000}' | get discount)
assert "validate E2E10 (10% de 100€) -> 1000" "1000" "$D"
D=$(curl -s --max-time 20 -X POST $B/api/promos/validate -H "Content-Type: application/json" -d '{"code":"E2E5","subtotal":10000}' | get discount)
assert "validate E2E5 (fixe 5€) -> 500" "500" "$D"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 -X POST $B/api/promos/validate -H "Content-Type: application/json" -d '{"code":"NOPE123","subtotal":10000}')
assert "validate code inexistant -> 404" "404" "$HTTP"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 -X POST $B/api/promos/validate -H "Content-Type: application/json" -d '{"code":"E2EMIN","subtotal":5000}')
assert "validate min non atteint (50€<200€) -> 400" "400" "$HTTP"

echo "════════ CARTES CADEAUX — création admin ════════"
GC1=$(curl -s --max-time 20 -b $JAR -X POST $B/api/gift-cards -H "Content-Type: application/json" -d '{"amount":50}' | get code)
assert_ne "Carte admin #1 créée" "" "$GC1"
GC2=$(curl -s --max-time 20 -b $JAR -X POST $B/api/gift-cards -H "Content-Type: application/json" -d '{"amount":100}' | get code)
assert_ne "Carte admin #2 créée (pas de collision d'index)" "" "$GC2"
BAL=$(curl -s --max-time 20 -X POST $B/api/gift-cards/check-balance -H "Content-Type: application/json" -d "{\"code\":\"$GC1\"}" | get balance)
assert "check-balance carte #1 -> 5000" "5000" "$BAL"

echo "════════ CARTES CADEAUX — achat en ligne (Stripe) ════════"
PI=$(curl -s --max-time 30 -X POST $B/api/gift-cards/create-payment-intent -H "Content-Type: application/json" -d '{"amount":30}' | get paymentIntentId)
assert_ne "create-payment-intent -> PI" "" "$PI"
ST=$(node scripts/confirm-test-pi.mjs "$PI" | get status)
assert "Paiement carte test -> succeeded" "succeeded" "$ST"
GCO=$(curl -s --max-time 30 -X POST $B/api/gift-cards/purchase -H "Content-Type: application/json" -d "{\"amount\":30,\"purchaser\":{\"name\":\"Acheteur\",\"email\":\"buyer@example.com\"},\"stripePaymentIntentId\":\"$PI\"}" | get code)
assert_ne "purchase -> carte créée" "" "$GCO"
BAL=$(curl -s --max-time 20 -X POST $B/api/gift-cards/check-balance -H "Content-Type: application/json" -d "{\"code\":\"$GCO\"}" | get balance)
assert "check-balance carte achetée -> 3000" "3000" "$BAL"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 -X POST $B/api/gift-cards/purchase -H "Content-Type: application/json" -d "{\"amount\":30,\"purchaser\":{\"name\":\"X\",\"email\":\"x@example.com\"},\"stripePaymentIntentId\":\"$PI\"}")
assert "Anti-rejeu du même PaymentIntent -> 400" "400" "$HTTP"

echo "════════ CARTES CADEAUX — annulation admin ════════"
GC1ID=$(curl -s --max-time 20 -b $JAR "$B/api/gift-cards?search=$GC1" | get giftCards[0]._id)
ST=$(curl -s --max-time 20 -b $JAR -X PATCH $B/api/gift-cards/$GC1ID -H "Content-Type: application/json" -d '{"action":"cancel"}' | get status)
assert "Annulation carte #1 -> status cancelled" "cancelled" "$ST"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 -X POST $B/api/gift-cards/check-balance -H "Content-Type: application/json" -d "{\"code\":\"$GC1\"}")
assert "check-balance carte annulée -> 400" "400" "$HTTP"

echo "════════ CHECKOUT — couverture totale (commande gratuite) ════════"
PID=$(curl -s --max-time 30 "$B/api/products?limit=1" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{let d=JSON.parse(s);let p=(d.products||d)[0];console.log(p._id)})")
G1=/tmp/e2e_guest1.txt; rm -f $G1
curl -s --max-time 20 -c $G1 -b $G1 -o /dev/null -X POST $B/api/cart -H "Content-Type: application/json" -d "{\"productId\":\"$PID\",\"quantity\":1}"
BEF=$(curl -s --max-time 20 -X POST $B/api/gift-cards/check-balance -H "Content-Type: application/json" -d "{\"code\":\"$GC2\"}" | get balance)
RESP=$(curl -s --max-time 40 -c $G1 -b $G1 -X POST $B/api/checkout -H "Content-Type: application/json" -d "{\"email\":\"full@example.com\",\"shippingAddress\":{\"name\":\"A\",\"street\":\"1 r\",\"city\":\"Rennes\",\"zip\":\"35000\",\"country\":\"FR\",\"phone\":\"0600\"},\"billingAddress\":{\"name\":\"A\",\"street\":\"1 r\",\"city\":\"Rennes\",\"zip\":\"35000\",\"country\":\"FR\"},\"paymentMethod\":\"stripe\",\"shippingMethod\":\"home\",\"giftCardCode\":\"$GC2\"}")
PAID=$(echo "$RESP" | get paid)
assert "Checkout couvert par carte -> paid=true" "true" "$PAID"
AFT=$(curl -s --max-time 20 -X POST $B/api/gift-cards/check-balance -H "Content-Type: application/json" -d "{\"code\":\"$GC2\"}" | get balance)
DIFF=$((BEF-AFT))
assert_ne "Carte débitée (diff>0): $BEF -> $AFT (diff=$DIFF)" "" "$([ $DIFF -gt 0 ] && echo ok)"

echo "════════ CHECKOUT — partiel + cumul code promo ════════"
GC3=$(curl -s --max-time 20 -b $JAR -X POST $B/api/gift-cards -H "Content-Type: application/json" -d '{"amount":5}' | get code)
G2=/tmp/e2e_guest2.txt; rm -f $G2
curl -s --max-time 20 -c $G2 -b $G2 -o /dev/null -X POST $B/api/cart -H "Content-Type: application/json" -d "{\"productId\":\"$PID\",\"quantity\":1}"
PRICE=$(curl -s --max-time 20 "$B/api/products?limit=1" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{let d=JSON.parse(s);console.log((d.products||d)[0].price)})")
RESP=$(curl -s --max-time 40 -c $G2 -b $G2 -X POST $B/api/checkout -H "Content-Type: application/json" -d "{\"email\":\"part@example.com\",\"shippingAddress\":{\"name\":\"A\",\"street\":\"1 r\",\"city\":\"Rennes\",\"zip\":\"35000\",\"country\":\"FR\",\"phone\":\"0600\"},\"billingAddress\":{\"name\":\"A\",\"street\":\"1 r\",\"city\":\"Rennes\",\"zip\":\"35000\",\"country\":\"FR\"},\"paymentMethod\":\"stripe\",\"shippingMethod\":\"home\",\"promoCode\":\"E2E10\",\"giftCardCode\":\"$GC3\"}")
CS=$(echo "$RESP" | get clientSecret)
GCA=$(echo "$RESP" | get giftCardAmount)
ADUE=$(echo "$RESP" | get amountDue)
OID=$(echo "$RESP" | get orderId)
assert_ne "Checkout partiel -> clientSecret présent (reste à payer)" "" "$CS"
assert "Montant carte appliqué = 500 (solde 5€)" "500" "$GCA"
# total attendu = round(price*0.9) (promo 10%), shipping 0 si >=5000, tva 0 ; amountDue = total-500
EXP=$(node -e "const p=$PRICE;const disc=Math.round(p*0.10);const sub=p-disc;const ship=sub>=5000?0:499;const total=sub+ship;console.log(total-500)")
assert "amountDue = total remisé - 500" "$EXP" "$ADUE"
GCAMT=$(curl -s --max-time 20 -b $JAR "$B/api/orders/$OID" | get giftCard.amount)
assert "Commande stocke giftCard.amount=500" "500" "$GCAMT"

echo "════════ ADMIN — liste / recherche / filtre / pagination ════════"
N=$(curl -s --max-time 20 -b $JAR "$B/api/gift-cards?status=cancelled" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const a=JSON.parse(s).giftCards||[];console.log(a.some(c=>c.status==='cancelled')?'ok':'')})")
assert_ne "Filtre status=cancelled renvoie des cartes" "" "$N"
FCODE=$(curl -s --max-time 20 -b $JAR "$B/api/gift-cards?search=$GC2" | get giftCards[0].code)
assert "Recherche par code retrouve la carte" "$GC2" "$FCODE"
LIMIT=$(curl -s --max-time 20 -b $JAR "$B/api/gift-cards?limit=2&page=1" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{console.log((JSON.parse(s).giftCards||[]).length)})")
assert "Pagination limit=2 -> 2 éléments" "2" "$LIMIT"

echo ""
echo "════════════════════════════════════"
echo "  RÉSULTAT : $PASS réussis, $FAIL échoués"
echo "════════════════════════════════════"
