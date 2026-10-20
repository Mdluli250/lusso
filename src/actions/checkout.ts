'use server';

import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendOrderEmail } from '@/lib/email';
import type { Prisma } from '@prisma/client';
import { generatePayFastUUID } from '@/lib/payfast';
import { checkRateLimit } from '@/lib/rate-limit';
import { validatePromoCode } from '@/lib/discounts/service';
import { calculateTotalDiscount } from '@/lib/discounts/calculate';
import type { AppliedDiscount, CartItemForDiscount } from '@/lib/discounts/types';
import { getShippingRates, calculateShipping } from '@/lib/shipping';
import type { CartItem } from '@/types';

async function reserveInventory(tx: Prisma.TransactionClient, items: CartItem[]) {
  for (const item of items) {
    const result = await tx.productVariant.updateMany({
      where: { id: item.variantId, productId: item.productId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (result.count !== 1) {
      throw new Error(`Insufficient stock for ${item.name}. Please update your cart.`);
    }
  }
}

interface CheckoutSuccess {
  checkoutId?: string;
  orderId: string;
  merchantTransactionId: string;
}

interface CheckoutError {
  error: string;
}

export async function createCheckoutSession(
  cartItems: CartItem[],
  giftWrap?: { enabled: boolean; message: string },
  appliedDiscounts?: AppliedDiscount[]
): Promise<CheckoutSuccess | CheckoutError> {
  try {
    if (!Array.isArray(cartItems) || cartItems.length === 0 || cartItems.length > 50) {
      return { error: 'Cart is empty. Please add items before checking out.' };
    }
    if (cartItems.some((item) => !item || typeof item.variantId !== 'string' || typeof item.productId !== 'string')) {
      return { error: 'Cart contains an invalid item. Please refresh the page and try again.' };
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: 'You must be signed in to checkout.' };
    }

    const userId = session.user.id;

    if (cartItems.some((item) => !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100)) {
      return { error: 'Cart contains an invalid quantity.' };
    }

    const shippingAddress = await prisma.shippingAddress.findUnique({ where: { userId } });
    if (!shippingAddress) {
      return { error: 'Add a delivery address in Account Settings before checking out.' };
    }

    const variantIds = [...new Set(cartItems.map((item) => item.variantId))];
    if (variantIds.length !== cartItems.length) {
      return { error: 'Cart contains duplicate or invalid items. Please refresh your cart.' };
    }

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds }, product: { isActive: true } },
      include: { product: true },
    });
    if (variants.length !== cartItems.length) {
      return { error: 'One or more products are no longer available.' };
    }

    const variantsById = new Map(variants.map((v) => [v.id, v]));
    const canonicalItems: CartItem[] = [];
    for (const item of cartItems) {
      const variant = variantsById.get(item.variantId);
      if (!variant || variant.productId !== item.productId || variant.stock < item.quantity) {
        return { error: `Insufficient stock for ${item.name}. Please update your cart.` };
      }
      canonicalItems.push({
        productId: variant.productId,
        variantId: variant.id,
        name: variant.product.name,
        scent: variant.scent,
        price: variant.product.price,
        quantity: item.quantity,
        modelPath: variant.modelPath,
        imageUrl: variant.product.image ?? '',
      });
    }

    const rateLimitResult = await checkRateLimit('checkout', userId);
    if (!rateLimitResult.allowed) {
      return { error: 'Too many checkout attempts. Please wait before trying again.' };
    }

    const cartItemsForDiscount: CartItemForDiscount[] = canonicalItems.map((item) => ({
      productId: item.productId,
      price: item.price,
      quantity: item.quantity,
    }));

    const validatedDiscounts: AppliedDiscount[] = [];
    if (appliedDiscounts && appliedDiscounts.length > 0) {
      for (const discount of appliedDiscounts) {
        const result = await validatePromoCode(discount.code, cartItemsForDiscount, userId);
        if (!result.valid) {
          return { error: `Discount code '${discount.code}' is no longer valid: ${result.error}. Please remove it and try again.` };
        }
        validatedDiscounts.push(result.discount);
      }
    }

    const cartSubtotal = canonicalItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalDiscount = validatedDiscounts.length > 0 ? calculateTotalDiscount(validatedDiscounts, cartSubtotal) : 0;

    if (validatedDiscounts.reduce((sum, d) => sum + d.discountAmountZAR, 0) > cartSubtotal) {
      return { error: 'Applied discounts exceed your cart subtotal. Remove and reapply your discount codes.' };
    }

    const giftWrapEnabled = giftWrap?.enabled ?? false;
    const giftMessage = giftWrapEnabled ? (giftWrap?.message ?? '').slice(0, 200) : null;
    const giftWrapCost = giftWrapEnabled ? 4900 : 0;

    // ── Use CMS-backed shipping rates ────────────────────────────────────────
    const hasFreeShipping = validatedDiscounts.some((d) => d.type === 'FREE_SHIPPING');
    const shippingRates = await getShippingRates();
    const shippingAmountZAR = calculateShipping(cartSubtotal, hasFreeShipping, shippingRates);

    const totalAmountZAR = Math.max(cartSubtotal - totalDiscount, 0) + giftWrapCost + shippingAmountZAR;

    const discountData = validatedDiscounts.length > 0
      ? {
          codes: validatedDiscounts.map((d) => ({
            codeId: d.codeId,
            isEmailCapture: d.isEmailCapture,
            code: d.code,
            type: d.type,
            amount: d.discountAmountZAR,
          })),
          totalDiscount,
        }
      : undefined;

    const merchantTransactionId = randomUUID();

    // Zero-total path — skip payment gateway
    if (totalAmountZAR === 0) {
      const order = await prisma.$transaction(async (tx) => {
        await reserveInventory(tx, canonicalItems);
        const created = await tx.order.create({
          data: {
            userId,
            status: 'PAID',
            totalAmountZAR,
            merchantTransactionId,
            items: JSON.parse(JSON.stringify(canonicalItems)),
            shippingAddress: JSON.parse(JSON.stringify(shippingAddress)),
            shippingAmountZAR,
            giftWrap: giftWrapEnabled,
            giftMessage,
            discountData: discountData ?? undefined,
          },
        });

        if (validatedDiscounts.length > 0) {
          await tx.discountUsage.createMany({
            data: validatedDiscounts.map((d) => ({
              discountCodeId: d.isEmailCapture ? null : d.codeId,
              emailCaptureCode: d.isEmailCapture ? d.codeId.replace('emailcapture:', '') : null,
              userId,
              orderId: created.id,
              discountAmountZAR: d.discountAmountZAR,
            })),
            skipDuplicates: true,
          });
        }

        return created;
      });

      await sendOrderEmail(order.id, 'payment-confirmation', session.user.email ?? '', `Your order ${order.id.slice(0, 8)} is confirmed.`)
        .catch((err) => console.error('[Checkout] Confirmation email failed:', err));

      return { orderId: order.id, merchantTransactionId: order.merchantTransactionId };
    }

    // Paid path — create PENDING order + reserve inventory
    const order = await prisma.$transaction(async (tx) => {
      await reserveInventory(tx, canonicalItems);
      return tx.order.create({
        data: {
          userId,
          status: 'PENDING',
          totalAmountZAR,
          merchantTransactionId,
          items: JSON.parse(JSON.stringify(canonicalItems)),
          shippingAddress: JSON.parse(JSON.stringify(shippingAddress)),
          shippingAmountZAR,
          reservationExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
          giftWrap: giftWrapEnabled,
          giftMessage,
          discountData: discountData ?? undefined,
        },
      });
    });

    const amountDecimal = (totalAmountZAR / 100).toFixed(2);
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    let payfastUUID: string;
    try {
      const [nameFirst, ...nameParts] = (session.user.name ?? '').split(' ');
      payfastUUID = await generatePayFastUUID({
        m_payment_id: merchantTransactionId,
        amount: amountDecimal,
        item_name: 'Lusso Order',
        return_url: `${baseUrl}/success?merchantTransactionId=${encodeURIComponent(merchantTransactionId)}`,
        cancel_url: `${baseUrl}/cart`,
        notify_url: `${baseUrl}/api/webhooks/payfast`,
        email_address: session.user.email ?? '',
        name_first: nameFirst || undefined,
        name_last: nameParts.join(' ') || undefined,
      });
    } catch (pfError) {
      await prisma.$transaction(async (tx) => {
        await tx.order.delete({ where: { id: order.id } });
        for (const item of canonicalItems) {
          await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        }
      }).catch(() => null);
      const message = pfError instanceof Error ? pfError.message : String(pfError);
      return { error: `Payment provider error: ${message}` };
    }

    return { checkoutId: payfastUUID, orderId: order.id, merchantTransactionId: order.merchantTransactionId };
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    return { error: 'Failed to create checkout session. Please try again.' };
  }
}
