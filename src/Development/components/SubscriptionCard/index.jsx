import React from "react";
import { Card, Flex, Text, Button, Separator, Box } from "@radix-ui/themes";
import { CheckCircle2 } from "lucide-react";

const CURRENCY_SYMBOL = {
  INR: "₹",
  USD: "$",
};

/**
 * SubscriptionCard — renders a single pricing card from a product object.
 *
 * Decoupled from Context on purpose: you tell it what state the *current
 * viewer* is in relative to this product (guest / subscribed / eligible to
 * purchase) instead of it reaching into UserCtx/InstitutionContext itself.
 * That's what makes it droppable into any page — a pricing grid, a modal
 * upsell, an admin preview — not just TestingPayment.js.
 *
 * Required:
 *  - product: the product object, e.g.
 *      {
 *        heading, amount, currency, durationText, provides: string[],
 *        productId, planId, ...
 *      }
 *
 * Optional:
 *  - primaryColor: institution accent color (defaults to HappyPrancer teal)
 *  - status: "guest" | "subscribed" | "purchasable"  (default: "purchasable")
 *  - onAction(product): called when the CTA is clicked (Sign up / Purchase).
 *    Not called at all when status is "subscribed" (button is disabled state).
 *  - loading: shows a disabled/loading CTA, e.g. while a redirect is in flight
 */
const SubscriptionCard = ({
  product,
  primaryColor = "#1B4B45",
  status = "purchasable",
  onAction,
  loading = false,
}) => {
  if (!product) return null;

  const currencySymbol =
    CURRENCY_SYMBOL[product.currency] || `${product.currency || ""} `;
  const priceValue =
    product.amount != null
      ? (parseInt(product.amount, 10) / 100).toFixed(0)
      : "0";
  const provides = Array.isArray(product.provides) ? product.provides : [];

  const cta = (() => {
    if (status === "subscribed") {
      return (
        <Button
          size="3"
          variant="outline"
          disabled
          style={{
            width: "100%",
            borderColor: primaryColor,
            color: primaryColor,
          }}>
          Subscribed
        </Button>
      );
    }
    if (status === "guest") {
      return (
        <Button
          size="3"
          disabled={loading}
          style={{ width: "100%", backgroundColor: primaryColor }}
          onClick={() => onAction?.(product)}>
          {loading ? "Redirecting…" : "Sign in"}
        </Button>
      );
    }
    // purchasable
    return (
      <Button
        size="3"
        disabled={loading}
        style={{ width: "100%", backgroundColor: primaryColor }}
        onClick={() => onAction?.(product)}>
        {loading ? "Redirecting…" : "Purchase"}
      </Button>
    );
  })();

  return (
    <Card
      size="4"
      style={{
        width: "100%",
        maxWidth: 420,
        borderRadius: 16,
        boxShadow: "0 20px 40px rgba(15, 46, 43, 0.12)",
      }}>
      <Flex direction="column" gap="4" style={{ minHeight: 420 }}>
        <Text
          as="div"
          size="6"
          weight="medium"
          color="gray"
          style={{ minHeight: 56 }}>
          {product.heading}
        </Text>

        <Flex align="baseline" gap="1">
          <Text size="6" weight="bold">
            {currencySymbol}
          </Text>
          <Text size="9" weight="bold" style={{ letterSpacing: "-0.02em" }}>
            {priceValue}
          </Text>
          <Text size="4" color="gray">
            /{product.durationText || "period"}
          </Text>
        </Flex>

        <Separator size="4" />

        <Flex direction="column" gap="3" style={{ flexGrow: 1 }}>
          {provides.length === 0 ? (
            <Text size="2" color="gray">
              No plan details provided yet.
            </Text>
          ) : (
            provides.map((line, i) => (
              <Flex key={i} gap="3" align="start">
                <Box
                  style={{ color: primaryColor, flexShrink: 0, marginTop: 2 }}>
                  <CheckCircle2 size={18} />
                </Box>
                <Text size="2" color="gray">
                  {line}
                </Text>
              </Flex>
            ))
          )}
        </Flex>

        {cta}
      </Flex>
    </Card>
  );
};

export default SubscriptionCard;
