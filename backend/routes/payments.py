import os
import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException
from database import db
from auth_utils import get_current_colaborador
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest
)

logger = logging.getLogger(__name__)
router = APIRouter()

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")

PLANS = {
    "premium_monthly": {"amount": 29.90, "currency": "brl", "label": "Premium Mensal"},
    "premium_yearly": {"amount": 299.90, "currency": "brl", "label": "Premium Anual"},
}


@router.post("/billing/create-checkout")
async def create_checkout_session(request: Request):
    """Cria sessao de checkout Stripe para upgrade Premium."""
    try:
        colaborador = await get_current_colaborador(request)
        body = await request.json()
        plan_id = body.get("plan_id", "premium_monthly")
        origin_url = body.get("origin_url", "")

        if not origin_url:
            raise HTTPException(status_code=400, detail="origin_url e obrigatorio.")

        plan = PLANS.get(plan_id)
        if not plan:
            raise HTTPException(status_code=400, detail=f"Plano invalido: {plan_id}")

        access = get_user_access_state(colaborador)

        if access["has_premium_access"]:
            raise HTTPException(status_code=400, detail="Voce ja e Premium.")

        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"

        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

        success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/dashboard"

        checkout_request = CheckoutSessionRequest(
            amount=plan["amount"],
            currency=plan["currency"],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "colaborador_id": colaborador["id"],
                "plan_id": plan_id,
                "email": colaborador["email"],
            }
        )

        session = await stripe_checkout.create_checkout_session(checkout_request)

        # Registrar transacao pendente
        transaction = {
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "colaborador_id": colaborador["id"],
            "email": colaborador["email"],
            "plan_id": plan_id,
            "amount": plan["amount"],
            "currency": plan["currency"],
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.payment_transactions.insert_one(transaction)

        return {"url": session.url, "session_id": session.session_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/billing/checkout-status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    """Verifica status do pagamento Stripe."""
    try:
        colaborador = await get_current_colaborador(request)

        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

        status = await stripe_checkout.get_checkout_status(session_id)

        # Atualizar transacao
        tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})

        if status.payment_status == "paid" and tx and tx.get("payment_status") != "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": "paid",
                    "paid_at": datetime.now(timezone.utc).isoformat(),
                }}
            )
            # Ativar Premium
            await db.colaboradores.update_one(
                {"id": colaborador["id"]},
                {"$set": {
                    "is_premium": True,
                    "premium_expires_at": None,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }}
            )
            logger.info(f"Premium activated for {colaborador['email']} via Stripe.")

        elif status.status == "expired":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "expired"}}
            )

        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking checkout status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Webhook para processar eventos Stripe."""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature", "")

        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

        event = await stripe_checkout.handle_webhook(body, signature)

        if event.payment_status == "paid":
            tx = await db.payment_transactions.find_one(
                {"session_id": event.session_id}, {"_id": 0}
            )
            if tx and tx.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "event_id": event.event_id,
                        "paid_at": datetime.now(timezone.utc).isoformat(),
                    }}
                )
                colab_id = event.metadata.get("colaborador_id") or tx.get("colaborador_id")
                if colab_id:
                    await db.colaboradores.update_one(
                        {"id": colab_id},
                        {"$set": {
                            "is_premium": True,
                            "premium_expires_at": None,
                            "updated_at": datetime.now(timezone.utc).isoformat(),
                        }}
                    )
                    logger.info(f"Webhook: Premium activated for {colab_id}")

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Stripe webhook error: {str(e)}")
        return {"status": "error", "detail": str(e)}
